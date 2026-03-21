// Meeting summary agent
// At session end (or on demand), collects the full transcript and
// sign event log, then prompts GPT-4o to generate a structured summary:
// key topics, decisions, action items, and accessibility notes.

export interface MeetingSummaryResult {
  topics: string[];
  decisions: string[];
  actionItems: string[];
  accessibilityNotes: string;
  fullTranscript: string;
}

export class SummaryAgent {
  async generateSummary(_transcript: string): Promise<MeetingSummaryResult> {
    // TODO: Build structured prompt, call Azure OpenAI, parse response
    return {
      topics: [],
      decisions: [],
      actionItems: [],
      accessibilityNotes: "",
      fullTranscript: _transcript,
    };
  }
}
