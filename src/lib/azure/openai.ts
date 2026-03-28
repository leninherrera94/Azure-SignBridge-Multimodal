// Azure OpenAI client configuration and utility functions
// Wraps @azure/openai SDK with GPT-4o model for sign translation,
// meeting summarization, and context-aware language generation.
// Supports streaming responses for real-time caption generation.

// @azure/openai v2 re-exports from the openai package; AzureOpenAI lives there
import { AzureOpenAI } from "openai";

export function getOpenAIClient(): AzureOpenAI {
  return new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    apiKey: process.env.AZURE_OPENAI_KEY!,
    apiVersion: "2024-10-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
  });
}
