// API route for Azure AI Content Safety
// Screens all user-generated content (text, images) for harmful material
// before broadcasting to meeting participants — core responsible AI feature

import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // TODO: Run content through Azure Content Safety API, return safety score
  return NextResponse.json({ message: "Content safety API placeholder" });
}
