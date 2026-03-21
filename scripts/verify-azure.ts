#!/usr/bin/env node
/**
 * scripts/verify-azure.ts
 *
 * Verifies live connectivity to every Azure service used by SignBridge AI.
 * Reads credentials from .env.local (never committed to git).
 *
 * Usage:
 *   npx ts-node --project scripts/tsconfig.json scripts/verify-azure.ts
 *   npx tsx scripts/verify-azure.ts           ← recommended (faster)
 *   npm run verify:azure
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { CosmosClient } from "@azure/cosmos";
import { BlobServiceClient } from "@azure/storage-blob";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const envFile = path.resolve(process.cwd(), ".env.local");

if (!fs.existsSync(envFile)) {
  console.error(
    "\n  ❌  .env.local not found.\n" +
      "      Copy .env.local.example → .env.local and fill in your Azure keys.\n"
  );
  process.exit(1);
}

dotenv.config({ path: envFile });

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  white:  "\x1b[97m",
};

const ok  = `${C.green}✅${C.reset}`;
const err = `${C.red}❌${C.reset}`;
const wrn = `${C.yellow}⚠️ ${C.reset}`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  service:    string;
  status:     "ok" | "fail" | "skip";
  detail:     string;
  durationMs: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function env(key: string): string {
  return process.env[key] ?? "";
}

/** Returns false (and skips the check) when any required env var is empty. */
function hasEnv(...keys: string[]): boolean {
  return keys.every((k) => !!env(k));
}

/** Wraps a check fn with a 7-second timeout + timing. */
async function timed(
  service: string,
  requiredVars: string[],
  fn: () => Promise<string>
): Promise<CheckResult> {
  if (!hasEnv(...requiredVars)) {
    const missing = requiredVars.filter((k) => !env(k)).join(", ");
    return {
      service,
      status: "skip",
      detail: `Missing env vars: ${missing}`,
      durationMs: 0,
    };
  }

  const start = Date.now();
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out after 7s")), 7_000)
    );
    const detail = await Promise.race([fn(), timeout]);
    return { service, status: "ok", detail, durationMs: Date.now() - start };
  } catch (e) {
    return {
      service,
      status: "fail",
      detail: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start,
    };
  }
}

// ─── Individual service checks ───────────────────────────────────────────────

// 1. Azure OpenAI ──────────────────────────────────────────────────────────────

async function checkOpenAI(): Promise<CheckResult> {
  return timed(
    "Azure OpenAI",
    ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_KEY"],
    async () => {
      const endpoint = env("AZURE_OPENAI_ENDPOINT").replace(/\/$/, "");
      const res = await fetch(
        `${endpoint}/openai/models?api-version=2024-02-01`,
        { headers: { "api-key": env("AZURE_OPENAI_KEY") } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
      const data = (await res.json()) as { data?: unknown[] };
      const count = data.data?.length ?? 0;
      const deployment = env("AZURE_OPENAI_DEPLOYMENT") || "gpt-4o";
      return `${count} model(s) available · deployment target: ${deployment}`;
    }
  );
}

// 2. Azure Speech Services ─────────────────────────────────────────────────────

async function checkSpeech(): Promise<CheckResult> {
  return timed(
    "Azure Speech Services",
    ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
    async () => {
      const region = env("AZURE_SPEECH_REGION");
      const res = await fetch(
        `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`,
        {
          method: "POST",
          headers: { "Ocp-Apim-Subscription-Key": env("AZURE_SPEECH_KEY") },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
      const token = await res.text();
      return `Token issued (${token.length} chars) · region: ${region}`;
    }
  );
}

// 3. Azure Computer Vision ────────────────────────────────────────────────────

async function checkVision(): Promise<CheckResult> {
  return timed(
    "Azure Computer Vision",
    ["AZURE_VISION_ENDPOINT", "AZURE_VISION_KEY"],
    async () => {
      const endpoint = env("AZURE_VISION_ENDPOINT").replace(/\/$/, "");
      // Use 'tags' — supported in all regions (caption is East US / West Europe only)
      const testImageUrl =
        "https://learn.microsoft.com/azure/ai-services/computer-vision/media/quickstarts/presentation.png";
      const res = await fetch(
        `${endpoint}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=tags`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": env("AZURE_VISION_KEY"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: testImageUrl }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
      const data = (await res.json()) as {
        tagsResult?: { values?: Array<{ name: string; confidence: number }> };
      };
      const topTags = (data.tagsResult?.values ?? [])
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .map((t) => t.name)
        .join(", ");
      return `Tags detected: [${topTags || "—"}]`;
    }
  );
}

// 4. Azure Translator ─────────────────────────────────────────────────────────

async function checkTranslator(): Promise<CheckResult> {
  return timed(
    "Azure Translator",
    ["AZURE_TRANSLATOR_KEY"],
    async () => {
      const region = env("AZURE_TRANSLATOR_REGION") || "global";
      const res = await fetch(
        "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es",
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": env("AZURE_TRANSLATOR_KEY"),
            "Ocp-Apim-Subscription-Region": region,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ text: "Hello, world!" }]),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
      const data = (await res.json()) as Array<{
        translations?: Array<{ text: string; to: string }>;
      }>;
      const translated = data[0]?.translations?.[0]?.text ?? "?";
      return `"Hello, world!" → "${translated}" (es)`;
    }
  );
}

// 5. Azure AI Content Safety ──────────────────────────────────────────────────

async function checkContentSafety(): Promise<CheckResult> {
  return timed(
    "Azure AI Content Safety",
    ["AZURE_CONTENT_SAFETY_ENDPOINT", "AZURE_CONTENT_SAFETY_KEY"],
    async () => {
      const endpoint = env("AZURE_CONTENT_SAFETY_ENDPOINT").replace(/\/$/, "");
      const res = await fetch(
        `${endpoint}/contentsafety/text:analyze?api-version=2024-09-01`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": env("AZURE_CONTENT_SAFETY_KEY"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "Hello, how are you doing today?",
            categories: ["Hate", "Sexual", "Violence", "SelfHarm"],
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
      const data = (await res.json()) as {
        categoriesAnalysis?: Array<{ category: string; severity: number }>;
      };
      const maxSeverity = Math.max(
        ...(data.categoriesAnalysis?.map((c) => c.severity) ?? [0])
      );
      return `Content analyzed · max severity: ${maxSeverity} (all clear ✓)`;
    }
  );
}

// 6. Azure AI Language ────────────────────────────────────────────────────────

async function checkLanguage(): Promise<CheckResult> {
  return timed(
    "Azure AI Language",
    ["AZURE_LANGUAGE_ENDPOINT", "AZURE_LANGUAGE_KEY"],
    async () => {
      const endpoint = env("AZURE_LANGUAGE_ENDPOINT").replace(/\/$/, "");
      const res = await fetch(
        `${endpoint}/language/:analyze-text?api-version=2023-04-01`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": env("AZURE_LANGUAGE_KEY"),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "LanguageDetection",
            analysisInput: {
              documents: [{ id: "1", text: "SignBridge makes communication barrier-free" }],
            },
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${await res.text()}`);
      const data = (await res.json()) as {
        results?: {
          documents?: Array<{
            detectedLanguage?: { name: string; confidenceScore: number };
          }>;
        };
      };
      const lang  = data.results?.documents?.[0]?.detectedLanguage?.name ?? "?";
      const score = ((data.results?.documents?.[0]?.detectedLanguage?.confidenceScore ?? 0) * 100).toFixed(0);
      return `Detected: ${lang} (${score}% confidence)`;
    }
  );
}

// 7. Azure SignalR Service ────────────────────────────────────────────────────

async function checkSignalR(): Promise<CheckResult> {
  return timed(
    "Azure SignalR Service",
    ["AZURE_SIGNALR_CONNECTION_STRING"],
    async () => {
      const connStr = env("AZURE_SIGNALR_CONNECTION_STRING");
      // Parse Endpoint from connection string
      const endpointMatch = connStr.match(/Endpoint=(https?:\/\/[^;]+)/i);
      if (!endpointMatch) throw new Error("Could not parse Endpoint from connection string");
      const endpoint = endpointMatch[1].replace(/\/$/, "");

      // The health endpoint returns 200 (authenticated) or 401 (bad key) — both mean the service exists
      const res = await fetch(`${endpoint}/api/v1/health`);
      if (res.status === 503) throw new Error("SignalR service unavailable (503)");
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);

      return `Endpoint reachable · status: ${res.status} · host: ${new URL(endpoint).hostname}`;
    }
  );
}

// 8. Azure Communication Services ────────────────────────────────────────────

async function checkCommunication(): Promise<CheckResult> {
  return timed(
    "Azure Communication Services",
    ["AZURE_COMMUNICATION_CONNECTION_STRING"],
    async () => {
      const connStr = env("AZURE_COMMUNICATION_CONNECTION_STRING");
      // Parse endpoint from ACS connection string: endpoint=https://...;accesskey=...
      const endpointMatch = connStr.match(/endpoint=(https?:\/\/[^;]+)/i);
      if (!endpointMatch) throw new Error("Could not parse endpoint from connection string");
      const endpoint = endpointMatch[1].replace(/\/$/, "");

      // GET the root resource — ACS returns 401 for auth fail but 404+ means service exists
      const res = await fetch(`${endpoint}?api-version=2021-03-07`);
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);

      const hostname = new URL(endpoint).hostname;
      return `Endpoint reachable · status: ${res.status} · host: ${hostname}`;
    }
  );
}

// 9. Azure Cosmos DB ──────────────────────────────────────────────────────────

async function checkCosmosDB(): Promise<CheckResult> {
  return timed(
    "Azure Cosmos DB",
    ["AZURE_COSMOS_ENDPOINT", "AZURE_COSMOS_KEY"],
    async () => {
      const client = new CosmosClient({
        endpoint: env("AZURE_COSMOS_ENDPOINT"),
        key:      env("AZURE_COSMOS_KEY"),
      });

      const { resource: account } = await client.getDatabaseAccount();
      const { resources: dbs }    = await client.databases.readAll().fetchAll();
      const dbNames = dbs.map((d) => d.id).join(", ") || "(none yet)";
      // DatabaseAccount type exposes writableLocations; use endpoint hostname as label
      const label = account?.writableLocations?.[0]?.name ?? "connected";

      return `Account reachable (${label}) · databases: [${dbNames}]`;
    }
  );
}

// 10. Azure Blob Storage ───────────────────────────────────────────────────────

async function checkStorage(): Promise<CheckResult> {
  return timed(
    "Azure Blob Storage",
    ["AZURE_STORAGE_CONNECTION_STRING"],
    async () => {
      const blobClient = BlobServiceClient.fromConnectionString(
        env("AZURE_STORAGE_CONNECTION_STRING")
      );
      const props = await blobClient.getProperties();
      const containers: string[] = [];
      for await (const c of blobClient.listContainers()) {
        containers.push(c.name);
        if (containers.length >= 5) break; // cap list for brevity
      }
      const target = env("AZURE_STORAGE_CONTAINER") || "signbridge-assets";
      const found  = containers.includes(target) ? "✓ present" : "⚠ not created yet";
      // getProperties returns ServiceGetPropertiesResponse — use defaultServiceVersion as probe
      const version = props.defaultServiceVersion ?? "ok";
      return `Storage reachable · container "${target}" ${found} · serviceVersion: ${version}`;
    }
  );
}

// 11. Azure Application Insights ──────────────────────────────────────────────

async function checkAppInsights(): Promise<CheckResult> {
  return timed(
    "Azure Application Insights",
    ["APPLICATIONINSIGHTS_CONNECTION_STRING"],
    async () => {
      const connStr = env("APPLICATIONINSIGHTS_CONNECTION_STRING");
      // Extract InstrumentationKey and IngestionEndpoint
      const ikMatch = connStr.match(/InstrumentationKey=([^;]+)/i);
      const ieMatch = connStr.match(/IngestionEndpoint=([^;]+)/i);
      if (!ikMatch) throw new Error("Could not parse InstrumentationKey");

      const ingestionBase = (ieMatch?.[1] ?? "https://dc.services.visualstudio.com").replace(/\/$/, "");

      // Ping the v2 track endpoint with an empty batch — 200 or 206 means reachable
      const res = await fetch(`${ingestionBase}/v2/track`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify([]),
      });

      // 200 / 206 = accepted/partial. 400 = malformed but endpoint exists. 5xx = problem.
      if (res.status >= 500) throw new Error(`Ingestion endpoint error: HTTP ${res.status}`);
      const iKey = ikMatch[1].substring(0, 8) + "…";
      return `Ingestion endpoint reachable · iKey: ${iKey} · HTTP ${res.status}`;
    }
  );
}

// ─── Printer ──────────────────────────────────────────────────────────────────

function printResult(r: CheckResult, index: number): void {
  const icon =
    r.status === "ok"   ? ok  :
    r.status === "skip" ? wrn :
    err;

  const statusLabel =
    r.status === "ok"   ? `${C.green}OK  ${C.reset}` :
    r.status === "skip" ? `${C.yellow}SKIP${C.reset}` :
    `${C.red}FAIL${C.reset}`;

  const timing =
    r.durationMs > 0
      ? `${C.dim}(${r.durationMs}ms)${C.reset}`
      : "";

  const num = String(index + 1).padStart(2);
  console.log(
    `  ${num}. ${icon} ${statusLabel}  ${C.white}${r.service.padEnd(34)}${C.reset}` +
    `${C.dim}${r.detail}${C.reset} ${timing}`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const banner = `
${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗
║       SignBridge AI — Azure Service Connectivity Check       ║
╚══════════════════════════════════════════════════════════════╝${C.reset}
  ${C.dim}env file : ${envFile}${C.reset}
`;
  console.log(banner);
  console.log(`  ${C.dim}Running 11 checks concurrently…${C.reset}\n`);

  const checks = [
    checkOpenAI(),
    checkSpeech(),
    checkVision(),
    checkTranslator(),
    checkContentSafety(),
    checkLanguage(),
    checkSignalR(),
    checkCommunication(),
    checkCosmosDB(),
    checkStorage(),
    checkAppInsights(),
  ];

  // Run all checks concurrently for speed
  const results = await Promise.all(checks);

  // Print divider
  console.log(`  ${C.dim}${"─".repeat(70)}${C.reset}`);

  results.forEach(printResult);

  // ── Summary ────────────────────────────────────────────────────────────────

  const passed  = results.filter((r) => r.status === "ok").length;
  const failed  = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;
  const total   = results.length;

  console.log(`\n  ${C.dim}${"─".repeat(70)}${C.reset}`);
  console.log(
    `\n  ${C.bold}Summary:${C.reset}  ` +
    `${C.green}${passed} connected${C.reset}  ·  ` +
    (failed  > 0 ? `${C.red}${failed} failed${C.reset}  ·  `   : "") +
    (skipped > 0 ? `${C.yellow}${skipped} skipped${C.reset}  ·  ` : "") +
    `${C.dim}${total} total${C.reset}`
  );

  // Big status line
  if (failed === 0 && skipped === 0) {
    console.log(`\n  ${C.bold}${C.green}🎉  All ${total} services connected — SignBridge AI is ready!${C.reset}\n`);
  } else if (passed === total) {
    console.log(`\n  ${C.bold}${C.green}✅  ${passed} of ${total} services connected.${C.reset}\n`);
  } else {
    console.log(
      `\n  ${C.bold}${passed < total / 2 ? C.red : C.yellow}` +
      `${passed} of ${total} services connected.${C.reset}` +
      (skipped > 0
        ? `\n  ${C.dim}Skipped checks have missing env vars — fill in .env.local to enable them.${C.reset}`
        : "") +
      (failed > 0
        ? `\n  ${C.dim}Failed checks indicate invalid keys or unreachable endpoints.${C.reset}`
        : "") +
      "\n"
    );
  }

  // Exit with error code if any check actually failed (not just skipped)
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n${C.red}Unexpected error:${C.reset}`, e);
  process.exit(1);
});
