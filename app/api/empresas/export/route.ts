import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { listarEmpresas } from "@/lib/db";
import { formatCnpj, formatData, situacaoEfetiva, SITUACAO_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

// Rótulo da certidão no export (espelha a coluna "Certidão" da tabela)
const CERT_EXPORT: Record<string, string> = {
  disponivel: "Disponível",
  indisponivel: "Indisponível",
  exige_matriz: "Emitir pela Matriz",
  erro_interno: "Erro Interno",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const situacao = searchParams.get("situacao") ?? "todas";

  // Mesma listagem (e mesmo filtro) que a tabela da aba Empresas
  const empresas = await listarEmpresas(q, situacao);

  const header = [
    "CNPJ",
    "Razão Social",
    "Situação",
    "Débitos",
    "Saldo Devedor",
    "Validade Certidão",
    "Certidão",
  ];

  const linhas = empresas.map((e) => {
    const sit = situacaoEfetiva(e);
    const certLabel =
      e.apto === 0 ? "—" : CERT_EXPORT[e.certidao_status ?? ""] ?? "—";
    return [
      formatCnpj(e.cnpj),
      e.razao_social || "",
      SITUACAO_LABEL[sit] ?? sit,
      Number(e.qtd_debitos) || 0,
      Number(e.valor_total_saldo) || 0,
      e.certidao_validade ? formatData(e.certidao_validade) : "",
      certLabel,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...linhas]);
  ws["!cols"] = [
    { wch: 20 }, // CNPJ
    { wch: 40 }, // Razão Social
    { wch: 28 }, // Situação
    { wch: 10 }, // Débitos
    { wch: 16 }, // Saldo Devedor
    { wch: 16 }, // Validade Certidão
    { wch: 18 }, // Certidão
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Empresas");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const hoje = new Date().toISOString().slice(0, 10);
  const body = new Uint8Array(buf);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="situacao-fiscal-empresas-${hoje}.xlsx"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}
