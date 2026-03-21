import { NextRequest, NextResponse } from "next/server";
import { getAllSigns, createSign, searchByKeyword } from "@/lib/azure/signs-db";
import type { SignDefinition } from "@/lib/azure/signs-db";

export async function GET(req: NextRequest) {
  try {
    const url      = new URL(req.url);
    const language = url.searchParams.get("language") ?? undefined;
    const keyword  = url.searchParams.get("keyword");

    if (keyword) {
      const results = await searchByKeyword(keyword, language ?? "ASL");
      return NextResponse.json(results);
    }

    const signs = await getAllSigns(language);
    return NextResponse.json(signs);
  } catch (err) {
    console.error("[GET /api/signs]", err);
    return NextResponse.json({ error: "Failed to fetch signs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SignDefinition>;
    if (!body.id || !body.name || !body.language) {
      return NextResponse.json({ error: "id, name, and language are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const sign: SignDefinition = {
      id:          body.id,
      name:        body.name,
      language:    body.language,
      category:    body.category    ?? "custom",
      type:        body.type        ?? "static",
      pose:        body.pose,
      poseStart:   body.poseStart,
      poseEnd:     body.poseEnd,
      duration:    body.duration    ?? 1000,
      keywords:    body.keywords    ?? [],
      description: body.description ?? "",
      createdAt:   now,
      updatedAt:   now,
    };

    const created = await createSign(sign);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[POST /api/signs]", err);
    return NextResponse.json({ error: "Failed to create sign" }, { status: 500 });
  }
}
