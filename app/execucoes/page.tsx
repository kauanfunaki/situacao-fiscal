import Link from "next/link";
import { listarExecucoes } from "@/lib/db";
import { formatDataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { searchParams: { page?: string } };

function duracao(inicio: string | null, fim: string | null): string {
  if (!inicio || !fim) return "—";
  const ms = new Date(fim).getTime() - new Date(inicio).getTime();
  if (isNaN(ms) || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; cor: string; label: string; pulse?: boolean }> = {
    concluido: { cls: "badge-green", cor: "var(--green)", label: "Concluído" },
    parcial: { cls: "badge-yellow", cor: "var(--yellow)", label: "Parcial" },
    em_andamento: { cls: "badge-blue", cor: "var(--blue)", label: "Em andamento", pulse: true },
    interrompido: { cls: "badge-gray", cor: "var(--gray)", label: "Interrompido" },
    erro: { cls: "badge-red", cor: "var(--red)", label: "Erro" },
  };
  const m = map[status] ?? { cls: "badge-gray", cor: "var(--gray)", label: status };
  return (
    <span className={`badge ${m.cls}`}>
      <span
        className="badge-dot"
        style={{ background: m.cor, animation: m.pulse ? "pulse 1.5s infinite" : undefined }}
      />
      {m.label}
    </span>
  );
}

export default async function ExecucoesPage({ searchParams }: Props) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { rows, total, totalPages } = await listarExecucoes(page);

  return (
    <>
      <h1 className="page-title">Histórico de Execuções</h1>
      <p className="page-sub">
        Registro de cada rodada da automação de pendências fiscais.
      </p>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Execuções da automação</span>
          <span className="card-count">
            {total} registro{total !== 1 ? "s" : ""}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>Nenhuma execução registrada</p>
            <span>Execute a automação para ver o histórico aqui</span>
          </div>
        ) : (
          <>
            <div className="tabela-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Duração</th>
                    <th>CNPJs</th>
                    <th>Status</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono" style={{ color: "var(--text-3)" }}>
                        #{r.id}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDataHora(r.inicio)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDataHora(r.fim)}</td>
                      <td style={{ color: "var(--text-3)" }}>{duracao(r.inicio, r.fim)}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "var(--accent-bg)",
                            color: "var(--accent)",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {r.cnpjs_processados}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <div className="truncate" title={r.observacoes ?? ""}>
                          {r.observacoes || "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
                <div className="pagination">
                  {page > 1 && (
                    <Link href={`?page=${page - 1}`} className="page-btn">
                      ‹ Ant.
                    </Link>
                  )}
                  {Array.from(
                    { length: Math.min(totalPages, page + 2) - Math.max(1, page - 2) + 1 },
                    (_, i) => Math.max(1, page - 2) + i
                  ).map((p) => (
                    <Link
                      key={p}
                      href={`?page=${p}`}
                      className={`page-btn ${p === page ? "active" : ""}`}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link href={`?page=${page + 1}`} className="page-btn">
                      Próx. ›
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
