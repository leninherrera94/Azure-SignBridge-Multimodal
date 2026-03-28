import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient }          from "@/lib/azure/openai";

interface ConversationEntry {
  text:      string;
  mode:      "speak" | "sign" | "type";
  timestamp: string | Date;
}

interface SummaryRequest {
  conversationLog:  ConversationEntry[];
  sessionDuration:  number; // ms
  signsCount:       number;
  wordsCount:       number;
  safetyCount:      number;
  piiCount:         number;
}

const SYSTEM_PROMPT = `You are an accessibility-focused meeting assistant. Generate a clear, concise meeting summary.

Return ONLY valid JSON in this exact format — no markdown, no prose:
{
  "summary": "2-3 sentence executive summary of the conversation",
  "topics": ["topic 1", "topic 2"],
  "actionItems": ["action 1", "action 2"],
  "tone": "professional | casual | supportive"
}

Rules:
- Use plain, simple language (accessible for all reading levels)
- Focus on what was communicated, not how
- Be brief and concrete
- If no action items are found, return an empty array
- The summary must be meaningful even for a short conversation`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as SummaryRequest;
  const log  = body.conversationLog ?? [];

  if (log.length === 0) {
    return NextResponse.json({
      summary:     "No conversation recorded in this session.",
      topics:      [],
      actionItems: [],
      tone:        "neutral",
    });
  }

  const transcript = log
    .map((e) => `[${e.mode.toUpperCase()}] ${e.text}`)
    .join("\n");

  const userPrompt = `Session duration: ${Math.round((body.sessionDuration ?? 0) / 1000)}s
Signs translated: ${body.signsCount ?? 0}
Words transcribed: ${body.wordsCount ?? 0}
Safety checks passed: ${body.safetyCount ?? 0}
PII entities redacted: ${body.piiCount ?? 0}

CONVERSATION TRANSCRIPT:
${transcript}`;

  try {
    const client     = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model:       process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
      messages:    [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens:  400,
    });

    const raw   = completion.choices[0]?.message?.content ?? "{}";
    const clean = raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(clean) as {
        summary?: string; topics?: string[]; actionItems?: string[]; tone?: string;
      };
      return NextResponse.json({
        summary:     parsed.summary     ?? "Session completed successfully.",
        topics:      parsed.topics      ?? [],
        actionItems: parsed.actionItems ?? [],
        tone:        parsed.tone        ?? "professional",
      });
    } catch {
      return NextResponse.json({
        summary:     raw.slice(0, 300),
        topics:      [],
        actionItems: [],
        tone:        "professional",
      });
    }
  } catch (err) {
    console.error("[summary] OpenAI error:", err);
    return NextResponse.json({
      summary:     `Session of ${log.length} messages with ${body.signsCount ?? 0} signs translated.`,
      topics:      [],
      actionItems: [],
      tone:        "professional",
    });
  }
}
