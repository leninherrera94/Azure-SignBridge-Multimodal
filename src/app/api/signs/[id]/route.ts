import { NextRequest, NextResponse } from "next/server";
import { getSign, updateSign, deleteSign, duplicateSign } from "@/lib/azure/signs-db";

interface Ctx { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const sign = await getSign(params.id);
    if (!sign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sign);
  } catch (err) {
    console.error("[GET /api/signs/[id]]", err);
    return NextResponse.json({ error: "Failed to fetch sign" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const body = await req.json();
    const updated = await updateSign(params.id, body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/signs/[id]]", err);
    return NextResponse.json({ error: "Failed to update sign" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await deleteSign(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/signs/[id]]", err);
    return NextResponse.json({ error: "Failed to delete sign" }, { status: 500 });
  }
}

// POST /api/signs/[id]?action=duplicate&language=LSC
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const url      = new URL(req.url);
    const action   = url.searchParams.get("action");
    const language = url.searchParams.get("language") as "ASL" | "LSC" | null;

    if (action === "duplicate" && language) {
      const copy = await duplicateSign(params.id, language);
      return NextResponse.json(copy, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[POST /api/signs/[id]]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
