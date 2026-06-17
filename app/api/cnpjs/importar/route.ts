import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { adicionarCnpjMonitorado } from "@/lib/db";

function normalizarColunas(keys: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const k of keys) {
    const kl = k.trim().toLowerCase();
    if (kl.includes("cnpj")) map.cnpj = k;
    else if (kl.includes("razao") || kl.includes("razão") || kl.includes("empresa") || kl.includes("nome"))
      map.razao_social = k;
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("arquivo") as File | null;
    if (!file) return NextResponse.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      return NextResponse.json({ erro: "Formato inválido. Use .xlsx, .xls ou .csv." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ erro: "Planilha vazia ou sem dados." }, { status: 400 });
    }

    const colMap = normalizarColunas(Object.keys(rows[0]));
    if (!colMap.cnpj) {
      return NextResponse.json(
        { erro: "Coluna 'cnpj' não encontrada. Verifique o cabeçalho da planilha." },
        { status: 400 }
      );
    }

    let importados = 0;
    let ignorados = 0;

    for (const row of rows) {
      const raw = String(row[colMap.cnpj] ?? "").trim();
      const cnpj = raw.replace(/\D/g, "");
      if (cnpj.length !== 14) { ignorados++; continue; }
      const razaoSocial = colMap.razao_social ? String(row[colMap.razao_social] ?? "").trim() : "";
      await adicionarCnpjMonitorado(cnpj, razaoSocial);
      importados++;
    }

    return NextResponse.json({
      ok: true,
      importados,
      ignorados,
      msg: `${importados} CNPJ${importados !== 1 ? "s" : ""} importado${importados !== 1 ? "s" : ""}${ignorados > 0 ? ` · ${ignorados} ignorado${ignorados !== 1 ? "s" : ""} (formato inválido)` : ""}.`,
    });
  } catch (err) {
    console.error("Erro ao importar planilha:", err);
    return NextResponse.json({ erro: "Erro ao processar o arquivo." }, { status: 500 });
  }
}
