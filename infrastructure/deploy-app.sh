#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-app.sh — Build & deploy SignBridge AI to Azure App Service
#
# Usage:
#   ./infrastructure/deploy-app.sh [dev|prod] [resource-group] [app-service-name]
#
# Requirements:
#   - az CLI logged in  (az login)
#   - Node 20 + npm installed locally
#   - AZURE_RESOURCE_GROUP env var set, OR pass RG as second arg
#
# Example:
#   AZURE_RESOURCE_GROUP=signbridge-rg ./infrastructure/deploy-app.sh dev
#   ./infrastructure/deploy-app.sh prod signbridge-prod-rg
#   ./infrastructure/deploy-app.sh prod signbridge-prod-rg signbridge-app-prod-a1b2c3d4
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────────────
ENV="${1:-dev}"
RG="${2:-${AZURE_RESOURCE_GROUP:-signbridge-rg}}"
APP_NAME="${3:-signbridge-app-${ENV}}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${REPO_ROOT}/.next/standalone"
PACKAGE_DIR="${REPO_ROOT}/.deploy"
ZIP_PATH="${REPO_ROOT}/signbridge-app.zip"
DEPLOYMENT_JSON_FILE="$(dirname "$0")/.last-deployment-${ENV}.json"
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_BASE_DELAY_SEC="${RETRY_BASE_DELAY_SEC:-5}"

is_transient_error() {
  local output="$1"
  echo "${output}" | grep -Eqi 'TooManyRequests|throttl|timed out|timeout|temporar|temporarily unavailable|InternalServerError|GatewayTimeout|ServiceUnavailable|operation could not be completed'
}

retry_cmd() {
  local attempt=1
  local delay="${RETRY_BASE_DELAY_SEC}"
  local output

  while true; do
    if output=$("$@" 2>&1); then
      if [ -n "${output}" ]; then
        echo "${output}"
      fi
      return 0
    fi

    if [ "${attempt}" -ge "${MAX_RETRIES}" ]; then
      echo "${output}" >&2
      return 1
    fi

    if is_transient_error "${output}"; then
      echo "⚠️  Transient error on attempt ${attempt}/${MAX_RETRIES}; retrying in ${delay}s..." >&2
      echo "   ${output}" >&2
      sleep "${delay}"
      attempt=$((attempt + 1))
      delay=$((delay * 2))
      continue
    fi

    echo "${output}" >&2
    return 1
  done
}

if [ -f "${DEPLOYMENT_JSON_FILE}" ]; then
  DEPLOYED_APP_URL="$(jq -r '.properties.outputs.appServiceUrl.value // empty' "${DEPLOYMENT_JSON_FILE}")"
  DEPLOYED_APP_NAME="$(echo "${DEPLOYED_APP_URL}" | sed -E 's#https://([^.]*)\..*#\1#')"
  if [ -n "${DEPLOYED_APP_NAME}" ] && [ "${DEPLOYED_APP_NAME}" != "${DEPLOYED_APP_URL}" ]; then
    APP_NAME="${DEPLOYED_APP_NAME}"
  fi
fi

if ! az webapp show --resource-group "${RG}" --name "${APP_NAME}" --query name --output tsv > /dev/null 2>&1; then
  MATCHING_APP_NAMES="$(az webapp list --resource-group "${RG}" --query "[?starts_with(name, 'signbridge-app-${ENV}-')].name" -o tsv)"
  MATCH_COUNT="$(echo "${MATCHING_APP_NAMES}" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [ "${MATCH_COUNT}" = "1" ]; then
    APP_NAME="$(echo "${MATCHING_APP_NAMES}" | head -n 1)"
  elif [ "${MATCH_COUNT}" -gt 1 ]; then
    echo "✗ Multiple App Services found for env '${ENV}' in resource group '${RG}':"
    echo "${MATCHING_APP_NAMES}" | sed 's/^/  - /'
    echo "  Pass the app name explicitly as the third argument."
    exit 1
  else
    echo "✗ Could not find App Service '${APP_NAME}' in resource group '${RG}'"
    echo "  Pass the app name explicitly as the third argument, e.g.:"
    echo "  ./infrastructure/deploy-app.sh ${ENV} ${RG} signbridge-app-${ENV}-<8charhash>"
    exit 1
  fi
fi

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  SignBridge AI — App Service Deploy                             ║"
echo "║  Environment : ${ENV}                                            "
echo "║  App Service : ${APP_NAME}                                       "
echo "║  Resource Grp: ${RG}                                             "
echo "╚══════════════════════════════════════════════════════════════════╝"

# ── 1. Build ──────────────────────────────────────────────────────────────────
echo ""
echo "▶ [1/4] Building Next.js (standalone output)…"
cd "${REPO_ROOT}"
npm ci --prefer-offline
npm run build

if [ ! -d "${BUILD_DIR}" ]; then
  echo "✗ .next/standalone not found — make sure next.config.mjs has output: 'standalone'"
  exit 1
fi
echo "✓ Build complete"

# ── 2. Package ────────────────────────────────────────────────────────────────
echo ""
echo "▶ [2/4] Packaging deployment artifact…"
rm -rf "${PACKAGE_DIR}" "${ZIP_PATH}"
cp -r "${BUILD_DIR}" "${PACKAGE_DIR}"

# Static assets must live alongside the standalone server
mkdir -p "${PACKAGE_DIR}/.next"
cp -r "${REPO_ROOT}/.next/static"  "${PACKAGE_DIR}/.next/static"
cp -r "${REPO_ROOT}/public"        "${PACKAGE_DIR}/public"

# App Service startup command runs:  node server.js
# Verify server.js is present
if [ ! -f "${PACKAGE_DIR}/server.js" ]; then
  echo "✗ server.js not found in standalone output"
  exit 1
fi

cd "${PACKAGE_DIR}"
zip -r "${ZIP_PATH}" . -x "*.DS_Store" > /dev/null
cd "${REPO_ROOT}"
echo "✓ Package ready: $(du -sh "${ZIP_PATH}" | cut -f1)"

# ── 3. Set App Service startup command ───────────────────────────────────────
echo ""
echo "▶ [3/4] Configuring App Service startup…"
retry_cmd az webapp config set \
  --resource-group "${RG}" \
  --name           "${APP_NAME}" \
  --startup-file   "node server.js" \
  --output none
echo "✓ Startup command set"

# ── 4. Deploy ZIP ─────────────────────────────────────────────────────────────
echo ""
echo "▶ [4/4] Deploying to Azure App Service…"
retry_cmd az webapp deploy \
  --resource-group "${RG}" \
  --name           "${APP_NAME}" \
  --src-path       "${ZIP_PATH}" \
  --type           zip \
  --async          false

LIVE_URL="https://${APP_NAME}.azurewebsites.net"
echo ""
echo "🔬 Running app smoke check…"
if command -v curl > /dev/null 2>&1; then
  if retry_cmd curl -fsS --max-time 20 "${LIVE_URL}" > /dev/null; then
    echo "✅ App is reachable"
  else
    echo "⚠️  App smoke check failed. Deployment finished, but endpoint is not yet healthy."
  fi
elif retry_cmd az webapp show --resource-group "${RG}" --name "${APP_NAME}" --query "state" --output tsv | grep -q '^Running$'; then
  echo "✅ App Service state is Running"
else
  echo "⚠️  App smoke check failed (no curl, and app state is not Running)."
fi

echo ""
echo "✓ Deployment complete!"
echo ""
echo "  🌐  Live URL : ${LIVE_URL}"
echo "  🚪  Demo room: ${LIVE_URL}/room/demo"
echo ""
echo "  Tail logs   : az webapp log tail --name ${APP_NAME} --resource-group ${RG}"
echo ""

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -rf "${PACKAGE_DIR}" "${ZIP_PATH}"
