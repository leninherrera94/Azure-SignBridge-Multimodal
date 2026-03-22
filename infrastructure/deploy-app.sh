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
#   ./infrastructure/deploy-app.sh dev signbridge-rg-dev signbridge-app-dev-abc123
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────────────
ENV="${1:-dev}"
RG="${2:-${AZURE_RESOURCE_GROUP:-signbridge-rg}}"
APP_NAME="${3:-${AZURE_APP_NAME:-}}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${REPO_ROOT}/.next/standalone"
PACKAGE_DIR="${REPO_ROOT}/.deploy"
ZIP_PATH="${REPO_ROOT}/signbridge-app.zip"

if [ -z "${APP_NAME}" ]; then
  APP_NAME="$(az webapp list --resource-group "${RG}" --query "[?contains(name, 'signbridge-app-${ENV}')].name | [0]" -o tsv)"
fi

if [ -z "${APP_NAME}" ]; then
  echo "✗ Could not resolve App Service name in resource group ${RG}."
  echo "  Pass it explicitly as third argument: ./infrastructure/deploy-app.sh ${ENV} ${RG} <app-service-name>"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  SignBridge AI — App Service Deploy                             ║"
echo "║  Environment : ${ENV}                                            ║"
echo "║  App Service : ${APP_NAME}                                       ║"
echo "║  Resource Grp: ${RG}                                             ║"
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
az webapp config set \
  --resource-group "${RG}" \
  --name           "${APP_NAME}" \
  --startup-file   "node server.js" \
  --output none
echo "✓ Startup command set"

# ── 4. Deploy ZIP ─────────────────────────────────────────────────────────────
echo ""
echo "▶ [4/4] Deploying to Azure App Service…"
az webapp deploy \
  --resource-group "${RG}" \
  --name           "${APP_NAME}" \
  --src-path       "${ZIP_PATH}" \
  --type           zip \
  --async          false

echo ""
echo "✓ Deployment complete!"
echo ""
echo "  🌐  Live URL : https://${APP_NAME}.azurewebsites.net"
echo "  🚪  Demo room: https://${APP_NAME}.azurewebsites.net/room/demo"
echo ""
echo "  Tail logs   : az webapp log tail --name ${APP_NAME} --resource-group ${RG}"
echo ""

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -rf "${PACKAGE_DIR}" "${ZIP_PATH}"
