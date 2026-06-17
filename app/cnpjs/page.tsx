import { listarCnpjsMonitorados } from "@/lib/db";
import { formatCnpj, formatDataHora, SITUACAO_COR, SITUACAO_DOT, SITUACAO_LABEL } from "@/lib/format";
import { adicionarCnpj, alternarCnpj } from "./actions";
import { DeleteCnpj, ImportarPlanilha } from "./client";

export const dynamic = "force-dynamic";

export default async function CnpjsPage() {
  const cnpjs = await listarCnpjsMonitorados();
  const ativos = cnpjs.filter((c) => c.ativo).length;

  return (
    <>
      <h1 className="page-title">CNPJs Monitorados</h1>
      <p className="page-sub">
        Gerencie os CNPJs que a automação processa diariamente no e-CAC.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Coluna principal — lista */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header">
            <span className="card-title">CNPJs cadastrados</span>
            <span className="card-count">
              {ativos} ativo{ativos !== 1 ? "s" : ""} · {cnpjs.length} total
            </span>
          </div>

          {cnpjs.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p>Nenhum CNPJ cadastrado</p>
              <span>Adicione CNPJs no painel ao lado</span>
            </div>
          ) : (
            <div className="tabela-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CNPJ</th>
                    <th>Razão Social</th>
                    <th>Situação</th>
                    <th>Última atualização</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cnpjs.map((c) => {
                    const label = c.razao_social || formatCnpj(c.cnpj);
                    const corBadge = c.situacao ? SITUACAO_COR[c.situacao] ?? "badge-gray" : "badge-gray";
                    const corDot = c.situacao ? SITUACAO_DOT[c.situacao] ?? "var(--gray)" : "var(--gray)";
                    const situacaoLabel = c.situacao ? SITUACAO_LABEL[c.situacao] ?? c.situacao : "—";
                    return (
                      <tr key={c.cnpj}>
                        <td className="mono">
                          <a
                            href={`/cnpj/${c.cnpj}`}
                            style={{ color: "var(--accent)", fontWeight: 500 }}
                          >
                            {formatCnpj(c.cnpj)}
                          </a>
                        </td>
                        <td style={{ textAlign: "left" }}>
                          {c.razao_social || <span style={{ color: "var(--text-3)" }}>—</span>}
                        </td>
                        <td>
                          {c.situacao ? (
                            <span className={`badge ${corBadge}`}>
                              <span className="badge-dot" style={{ background: corDot }} />
                              {situacaoLabel}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-3)", fontSize: 12 }}>Não processado</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-3)", fontSize: 12 }}>
                          {formatDataHora(c.ultimo_relatorio_em)}
                        </td>
                        <td>
                          <form action={alternarCnpj}>
                            <input type="hidden" name="cnpj" value={c.cnpj} />
                            <input type="hidden" name="ativo" value={c.ativo ? "0" : "1"} />
                            <button
                              type="submit"
                              className={`badge ${c.ativo ? "badge-green" : "badge-gray"}`}
                              style={{ border: "none", cursor: "pointer" }}
                            >
                              <span
                                className="badge-dot"
                                style={{ background: c.ativo ? "var(--green)" : "var(--gray)" }}
                              />
                              {c.ativo ? "Ativo" : "Pausado"}
                            </button>
                          </form>
                        </td>
                        <td>
                          <DeleteCnpj cnpj={c.cnpj} label={label} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Painel direito */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Adicionar CNPJ
          </p>
          <form
            action={adicionarCnpj}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div>
              <label className="form-label">CNPJ *</label>
              <input
                type="text"
                name="cnpj"
                className="form-input mono"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                required
              />
            </div>
            <div>
              <label className="form-label">Razão Social</label>
              <input
                type="text"
                name="razao_social"
                className="form-input"
                placeholder="Nome da empresa (opcional)"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ justifyContent: "center" }}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Adicionar
            </button>
          </form>

          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              background: "var(--accent-bg)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p style={{ fontSize: 12, color: "var(--accent-text)", lineHeight: 1.5 }}>
              CNPJs adicionados aqui serão processados automaticamente na próxima
              execução da automação. Você pode pausar um CNPJ sem removê-lo.
            </p>
          </div>
        </div>

        <ImportarPlanilha />
        </div>
      </div>
    </>
  );
}
