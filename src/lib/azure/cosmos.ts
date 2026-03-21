// Azure Cosmos DB client for persistent data storage
// Stores user accessibility profiles, meeting transcripts, sign history,
// and session metadata. Uses the Core (SQL) API with partition by userId.

import { CosmosClient } from "@azure/cosmos";

let client: CosmosClient | null = null;

export function getCosmosClient(): CosmosClient {
  if (!client) {
    client = new CosmosClient({
      endpoint: process.env.AZURE_COSMOS_ENDPOINT!,
      key: process.env.AZURE_COSMOS_KEY!,
    });
  }
  return client;
}
