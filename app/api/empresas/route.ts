import { NextRequest, NextResponse } from "next/server";
import { listarEmpresas } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/empresas?q=...&situacao=...  → JSON com a lista de empresas
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const situacao = req.nextUrl.searchParams.get("situacao") ?? "todas";
  try {
    const empresas = await listarEmpresas(q, situacao);
    return NextResponse.json({ total: empresas.length, empresas });
  } catch (err: any) {
    return NextResponse.json(
      { erro: "Falha ao consultar o banco", detalhe: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
