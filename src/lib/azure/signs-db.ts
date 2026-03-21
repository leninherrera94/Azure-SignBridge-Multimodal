/**
 * src/lib/azure/signs-db.ts
 * Cosmos DB operations for the "signs" container.
 * Partition key: /language
 */

import { getCosmosClient } from "./cosmos";

const DB_NAME      = "signbridge";
const CONTAINER_ID = "signs";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PoseArm {
  shoulder: [number, number, number];
  upperArm: [number, number, number];
  forearm:  [number, number, number];
  hand:     [number, number, number];
}

export interface PoseFingers {
  thumb:  number; // 0 = extended, 90 = closed
  index:  number;
  middle: number;
  ring:   number;
  pinky:  number;
}

export interface PoseData {
  rightArm:     PoseArm;
  leftArm?:     PoseArm;
  rightFingers: PoseFingers;
  leftFingers?: PoseFingers;
}

export interface SignDefinition {
  id:          string;   // "hello", "letter_a", etc.
  name:        string;   // "Hello", "A"
  language:    "ASL" | "LSC";
  category:    "greeting" | "response" | "expression" | "number" | "letter" | "common" | "custom";
  type:        "static" | "dynamic";
  pose?:       PoseData; // static: single pose
  poseStart?:  PoseData; // dynamic: first pose
  poseEnd?:    PoseData; // dynamic: final pose
  duration:    number;   // ms
  keywords:    string[];
  description: string;
  createdAt:   string;
  updatedAt:   string;
}

// ─── Container helper ─────────────────────────────────────────────────────────

async function getContainer() {
  const client = getCosmosClient();
  const { database } = await client.databases.createIfNotExists({ id: DB_NAME });
  const { container } = await database.containers.createIfNotExists({
    id: CONTAINER_ID,
    partitionKey: { paths: ["/language"] },
  });
  return container;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAllSigns(language?: string): Promise<SignDefinition[]> {
  const container = await getContainer();
  const querySpec = language
    ? {
        query: "SELECT * FROM c WHERE c.language = @lang",
        parameters: [{ name: "@lang", value: language }],
      }
    : "SELECT * FROM c";

  const { resources } = await container.items
    .query<SignDefinition>(querySpec)
    .fetchAll();

  return resources.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSign(id: string): Promise<SignDefinition | null> {
  const container = await getContainer();
  const { resources } = await container.items
    .query<SignDefinition>({
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

export async function createSign(sign: SignDefinition): Promise<SignDefinition> {
  const container = await getContainer();
  const { resource } = await container.items.create<SignDefinition>(sign);
  return resource!;
}

export async function updateSign(
  id: string,
  updates: Partial<SignDefinition>
): Promise<SignDefinition> {
  const existing = await getSign(id);
  if (!existing) throw new Error(`Sign not found: ${id}`);

  const updated: SignDefinition = {
    ...existing,
    ...updates,
    id:        existing.id,
    language:  updates.language ?? existing.language,
    updatedAt: new Date().toISOString(),
  };

  const container = await getContainer();
  const { resource } = await container
    .item(id, updated.language)
    .replace<SignDefinition>(updated);
  return resource!;
}

export async function deleteSign(id: string): Promise<void> {
  const existing = await getSign(id);
  if (!existing) return;
  const container = await getContainer();
  await container.item(id, existing.language).delete();
}

export async function searchByKeyword(
  keyword: string,
  language: string
): Promise<SignDefinition[]> {
  const container = await getContainer();
  const { resources } = await container.items
    .query<SignDefinition>({
      query:
        "SELECT * FROM c WHERE c.language = @lang AND ARRAY_CONTAINS(c.keywords, @kw)",
      parameters: [
        { name: "@lang", value: language },
        { name: "@kw",   value: keyword.toLowerCase() },
      ],
    })
    .fetchAll();
  return resources.sort((a, b) => a.name.localeCompare(b.name));
}

export async function duplicateSign(
  id: string,
  targetLanguage: "ASL" | "LSC"
): Promise<SignDefinition> {
  const source = await getSign(id);
  if (!source) throw new Error(`Sign not found: ${id}`);
  const now = new Date().toISOString();
  const copy: SignDefinition = {
    ...source,
    id:        `${source.id}_${targetLanguage.toLowerCase()}`,
    language:  targetLanguage,
    createdAt: now,
    updatedAt: now,
  };
  return createSign(copy);
}
