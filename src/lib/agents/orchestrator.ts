// Multi-agent orchestrator
// Coordinates the speech-agent, sign-agent, safety-agent, and summary-agent
// using an event-driven pipeline. Routes audio/video events to the correct
// agent, manages concurrency, and merges outputs into a unified session state.

export interface AgentEvent {
  type: "speech" | "sign" | "text" | "image";
  payload: unknown;
  timestamp: number;
}

export class Orchestrator {
  // TODO: Initialize all sub-agents, set up event bus
  async start(): Promise<void> {}

  async dispatch(_event: AgentEvent): Promise<void> {
    // TODO: Route event to appropriate agent(s), collect responses
  }

  async stop(): Promise<void> {}
}
