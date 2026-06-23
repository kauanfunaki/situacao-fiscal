import { NextRequest, NextResponse } from "next/server";
import { obterDivergencia, salvarDivergencia, removerDivergencia } from "@/lib/db";

type Params = { params: { cnpj: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const cnpj = params.cnpj.replace(/\D/g, "");
  const div = await obterDivergencia(cnpj);
  return NextResponse.json(div ?? null);
}

export async function POST(req: NextRequest, { params }: Params) {
  const cnpj = params.cnpj.replace(/\D/g, "");
  const body = await req.json().catch(() => ({}));
  const descricao = (body?.descricao ?? "").trim();
  if (!descricao) {
    return NextResponse.json({ error: "Descrição obrigatória" }, { status: 400 });
  }
  const div = await salvarDivergencia(cnpj, descricao);
  return NextResponse.json(div);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const cnpj = params.cnpj.replace(/\D/g, "");
  await removerDivergencia(cnpj);
  return NextResponse.json({ ok: true });
}
