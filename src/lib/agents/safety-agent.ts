// Content safety agent
// Intercepts all outgoing text and images before broadcast,
// runs them through Azure Content Safety API, and either allows,
// flags with a warning, or blocks content exceeding severity thresholds.

export type SafetyVerdict = "allow" | "warn" | "block";

export class SafetyAgent {
  async evaluate(_content: string): Promise<SafetyVerdict> {
    // TODO: Call checkContentSafety(), map scores to verdict
    return "allow";
  }
}
