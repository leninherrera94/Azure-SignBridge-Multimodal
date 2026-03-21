// Azure SignalR Service integration for real-time messaging
// Broadcasts sign language events, transcription updates, and
// participant state changes to all room members with low latency.
// Uses serverless hub mode with negotiate endpoint.

export async function negotiate(_userId: string): Promise<{ url: string; accessToken: string }> {
  // TODO: Call SignalR negotiate endpoint, return connection info
  return { url: "", accessToken: "" };
}
