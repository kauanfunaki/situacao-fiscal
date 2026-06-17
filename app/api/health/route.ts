import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/health → verifica app + conectividade com o MySQL (usado pelo EasyPanel)
export async function GET() {
  try {
    await query("SELECT 1");
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (err: any) {
    return NextResponse.json(
      { status: "degraded", db: "down", detalhe: String(err?.message ?? err) },
      { status: 503 }
    );
  }
}
