export function formatCnpj(cnpj: string): string {
  const d = (cnpj || "").replace(/\D/g, "").padStart(14, "0");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function formatCpfCnpj(v: string): string {
  const d = (v || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length === 14) return formatCnpj(d);
  return v;
}

export function formatMoeda(v: string | number | null | undefined): string {
  const n = typeof v === "number" ? v : parseFloat(v ?? "0");
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatData(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("pt-BR");
}

export function formatDataHora(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-BR");
}

export const SITUACAO_LABEL: Record<string, string> = {
  regular: "Regular",
  positiva_efeito_negativa: "Positiva c/ Efeito de Negativa",
  positiva: "Com Pendência",
  indefinida: "Indefinida",
  nao_apto: "CNPJ não apto",
};

export const SITUACAO_COR: Record<string, string> = {
  regular: "badge-green",
  positiva_efeito_negativa: "badge-yellow",
  positiva: "badge-red",
  indefinida: "badge-gray",
  nao_apto: "badge-purple",
};

// cor "crua" (var CSS) para pontos/realces fora do badge
export const SITUACAO_DOT: Record<string, string> = {
  regular: "var(--green)",
  positiva_efeito_negativa: "var(--yellow)",
  positiva: "var(--red)",
  indefinida: "var(--gray)",
  nao_apto: "var(--purple)",
};

// Situação efetiva da empresa (sobrepõe "não apto" quando o perfil falhou)
export function situacaoEfetiva(e: { situacao: string; apto?: number }): string {
  return e.apto === 0 ? "nao_apto" : e.situacao;
}

// Status da certidão para exibição na coluna "Certidão"
export type CertidaoStatus = "disponivel" | "indisponivel" | "erro_interno" | null | undefined;

export const CERTIDAO_LABEL: Record<string, string> = {
  disponivel: "PDF",
  indisponivel: "Certidão Indisponível",
  erro_interno: "Erro Interno",
};
