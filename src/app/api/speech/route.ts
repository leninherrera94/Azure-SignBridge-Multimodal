/**
 * src/app/api/speech/route.ts
 *
 * Server-side token vending machine for Azure Speech Services.
 *
 * GET /api/speech
 *   → { token: string, region: string, expiresAt: number }
 *
 * The Azure Speech SDK accepts an auth token in place of a subscription key.
 * Tokens are issued by the STS endpoint, valid for 10 minutes. We bake in a
 * 60-second early-expiry buffer so the client refreshes before the token dies.
 *
 * SECURITY: AZURE_SPEECH_KEY is server-only and never serialised to the client.
 */

import { NextResponse } from "next/server";

const SPEECH_KEY    = process.env.AZURE_SPEECH_KEY;
const SPEECH_REGION = process.env.AZURE_SPEECH_REGION;

// Azure STS issues tokens valid for 10 minutes.
// Refresh 1 minute early to avoid mid-session expiry.
const TOKEN_TTL_MS = 9 * 60 * 1_000; // 9 minutes in ms

export async function GET(): Promise<NextResponse> {
  if (!SPEECH_KEY || !SPEECH_REGION) {
    return NextResponse.json(
      { error: "Azure Speech service is not configured on this server." },
      { status: 503 }
    );
  }

  try {
    const stsUrl = `https://${SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`;

    const stsResponse = await fetch(stsUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Length":            "0",
      },
      // Next.js caches GET handlers by default — opt out so every request
      // gets a fresh token rather than a stale cached one.
      cache: "no-store",
    });

    if (!stsResponse.ok) {
      const body = await stsResponse.text();
      console.error("[api/speech] STS error:", stsResponse.status, body);
      return NextResponse.json(
        { error: `Failed to issue speech token: HTTP ${stsResponse.status}` },
        { status: 502 }
      );
    }

    const token     = await stsResponse.text();
    const expiresAt = Date.now() + TOKEN_TTL_MS;

    return NextResponse.json(
      { token, region: SPEECH_REGION, expiresAt },
      {
        headers: {
          // Tell the browser not to cache this response — tokens are sensitive
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[api/speech] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error while fetching speech token." },
      { status: 500 }
    );
  }
}
