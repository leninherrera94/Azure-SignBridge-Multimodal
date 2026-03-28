// Sign language agent
// Receives hand landmark sequences from the MediaPipe tracker,
// classifies signs using the sign-classifier, builds gloss strings,
// and uses GPT-4o to produce fluent natural language translations.

export class SignAgent {
  async processLandmarks(_landmarks: number[][][]): Promise<string> {
    // TODO: Classify landmarks → gloss tokens → GPT-4o natural language
    return "";
  }
}
