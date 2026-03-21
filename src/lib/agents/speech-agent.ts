// Speech agent
// Listens to the audio stream, calls Azure Speech-to-Text in real time,
// performs speaker diarization, and publishes transcript segments
// to the orchestrator for downstream translation and display.

export class SpeechAgent {
  async start(_audioStream: MediaStream): Promise<void> {
    // TODO: Connect to Azure Speech SDK continuous recognition
  }

  async stop(): Promise<void> {}
}
