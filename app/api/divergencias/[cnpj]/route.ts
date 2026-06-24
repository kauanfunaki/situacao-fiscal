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
  try {
    const div = await salvarDivergencia(cnpj, descricao);
    return NextResponse.json(div);
  } catch (e) {
    console.error("salvarDivergencia falhou:", e);
    return NextResponse.json(
      { error: "Não foi possível salvar a divergência. Verifique o banco de dados." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const cnpj = params.cnpj.replace(/\D/g, "");
  try {
    await removerDivergencia(cnpj);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("removerDivergencia falhou:", e);
    return NextResponse.json({ error: "Não foi possível remover." }, { status: 500 });
  }
}
