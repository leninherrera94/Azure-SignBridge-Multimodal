// Central type registry for SignBridge AI
// All interfaces, unions, and enums used across components, hooks, lib modules, and API routes.

// ─── User & Accessibility ─────────────────────────────────────────────────────

export interface AccessibilityPreferences {
  highContrast: boolean;
  fontSize: "small" | "medium" | "large" | "xlarge";
  reduceMotion: boolean;
  captionsEnabled: boolean;
  signAvatarEnabled: boolean;
  /** Speech synthesis rate — 0.5 (slow) to 2.0 (fast) */
  speechRate: number;
  voicePreference: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  communicationMode: "speech" | "sign" | "text";
  preferredLanguage: string;
  accessibilityPreferences: AccessibilityPreferences;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Room & Session ───────────────────────────────────────────────────────────

export interface Participant {
  id: string;
  profile: UserProfile;
  role: "host" | "participant";
  connectionState: "connecting" | "connected" | "disconnected";
  videoEnabled: boolean;
  audioEnabled: boolean;
}

export interface Room {
  id: string;
  participants: Participant[];
  status: "waiting" | "active" | "ended";
  createdAt: Date;
  conversationLog: ConversationEntry[];
}

// ─── Communication ────────────────────────────────────────────────────────────

export interface SentimentResult {
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  /** Emoji or short text indicator for at-a-glance tone reading */
  toneIndicator: string;
}

export interface SafetyCheckResult {
  isAllowed: boolean;
  categories: {
    hate:     { severity: number; filtered: boolean };
    sexual:   { severity: number; filtered: boolean };
    violence: { severity: number; filtered: boolean };
    selfHarm: { severity: number; filtered: boolean };
  };
  piiDetected: PIIEntity[];
  explanation: string;
}

export interface PIIEntity {
  text: string;
  category: string;
  offset: number;
  length: number;
  redactedText: string;
}

export interface ConversationEntry {
  id: string;
  participantId: string;
  timestamp: Date;
  inputType: "speech" | "sign" | "text";
  originalContent: string;
  translatedContent: string;
  simplifiedContent?: string;
  sentiment?: SentimentResult;
  safetyCheck: SafetyCheckResult;
}

// ─── Sign Language ────────────────────────────────────────────────────────────

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface SignDetection {
  sign: string;
  confidence: number;
  landmarks: HandLandmark[];
  timestamp: number;
}

export interface FingerPose {
  name: "thumb" | "index" | "middle" | "ring" | "pinky";
  /** Array of [x, y, z] joint positions from MCP to tip */
  joints: [number, number, number][];
}

export interface HandPose {
  wrist: [number, number, number];
  fingers: FingerPose[];
}

export interface BodyPose {
  shoulderRotation: [number, number, number];
  elbowLeft:        [number, number, number];
  elbowRight:       [number, number, number];
}

export interface AvatarKeyframe {
  time: number;
  leftHand: HandPose;
  rightHand: HandPose;
  bodyPose?: BodyPose;
  /** Named facial expression preset, e.g. "neutral" | "raised-eyebrows" */
  facialExpression?: string;
}

export interface SignAnimation {
  signId: string;
  signText: string;
  keyframes: AvatarKeyframe[];
  /** Total animation duration in seconds */
  duration: number;
}

// ─── AI Agents ────────────────────────────────────────────────────────────────

export type AgentType = "speech" | "sign" | "safety" | "summary" | "orchestrator";

export interface AgentMessage {
  agentId: string;
  agentType: AgentType;
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  timestamp: Date;
  processingTimeMs: number;
}

// ─── Meeting Summary ──────────────────────────────────────────────────────────

export interface ResponsibleAIMetrics {
  contentSafetyChecks: number;
  contentFiltered: number;
  piiRedacted: number;
  averageConfidence: number;
  /** 0–1 score reflecting transparency and fairness of AI decisions made in the session */
  transparencyScore: number;
}

export interface MeetingSummary {
  roomId: string;
  /** Session length in seconds */
  duration: number;
  participantCount: number;
  keyTopics: string[];
  actionItems: string[];
  fullTranscript: ConversationEntry[];
  /** Plain-language summary optimised for screen readers and cognitive accessibility */
  accessibleSummary: string;
  generatedAt: Date;
  responsibleAIMetrics: ResponsibleAIMetrics;
}

// ─── SignalR Real-time Messages ───────────────────────────────────────────────

export type SignalRMessageType =
  | "transcription"
  | "sign_detected"
  | "translation"
  | "avatar_command"
  | "safety_alert"
  | "participant_update";

export interface SignalRMessage {
  type: SignalRMessageType;
  roomId: string;
  senderId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: number;
}

// ─── Discriminated union helpers (for typed SignalR data payloads) ─────────────

export type TypedSignalRMessage =
  | { type: "transcription";     roomId: string; senderId: string; timestamp: number; data: ConversationEntry }
  | { type: "sign_detected";     roomId: string; senderId: string; timestamp: number; data: SignDetection }
  | { type: "translation";       roomId: string; senderId: string; timestamp: number; data: { original: string; translated: string; language: string } }
  | { type: "avatar_command";    roomId: string; senderId: string; timestamp: number; data: SignAnimation }
  | { type: "safety_alert";      roomId: string; senderId: string; timestamp: number; data: SafetyCheckResult }
  | { type: "participant_update"; roomId: string; senderId: string; timestamp: number; data: Participant };
