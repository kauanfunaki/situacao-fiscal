import {
  contagemPendentes,
  listarDestinatarios,
  ultimaVerificacao,
} from "@/lib/db";
import { smtpConfigurado } from "@/lib/email";
import { formatDataHora } from "@/lib/format";
import { adicionarDestinatario, alternarDestinatario } from "./actions";
import { DeleteDestinatario, VerificarButton } from "./client";

export const dynamic = "force-dynamic";

export default async function NotificacoesPage() {
  const [destinatarios, ultima, pendentes] = await Promise.all([
    listarDestinatarios(),
    ultimaVerificacao(),
    contagemPendentes(),
  ]);
  const smtpOk = smtpConfigurado();

  return (
    <>
      <h1 className="page-title">Notificações por E-mail</h1>
      <p className="page-sub">
        Cadastre e-mails para receber um aviso sempre que a automação detectar
        mudança de situação fiscal em alguma empresa.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Coluna principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/* Verificação manual */}
          <div className="card" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Verificar novidades agora
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                  Compara os relatórios processados com o log de envios e dispara
                  e-mails para os destinatários ativos quando há mudança relevante.
                </p>
                {ultima && (
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
                    Última verificação:{" "}
                    <span style={{ color: "var(--text-2)", fontWeight: 500 }}>
                      {formatDataHora(ultima)}
                    </span>
                  </p>
                )}
                {pendentes > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span className="badge badge-yellow">
                      <span className="badge-dot" style={{ background: "var(--yellow)" }} />
                      {pendentes} relatório{pendentes !== 1 ? "s" : ""} não verificado
                      {pendentes !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
              <VerificarButton />
            </div>
          </div>

          {/* Lista de destinatários */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-header">
              <span className="card-title">Destinatários</span>
              <span className="card-count">
                {destinatarios.length} cadastrado{destinatarios.length !== 1 ? "s" : ""}
              </span>
            </div>

            {destinatarios.length === 0 ? (
              <div className="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p>Nenhum destinatário cadastrado</p>
                <span>Adicione e-mails no painel ao lado</span>
              </div>
            ) : (
              <div className="tabela-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinatarios.map((d) => (
                      <tr key={d.id}>
                        <td>{d.nome || "—"}</td>
                        <td className="mono">{d.email}</td>
                        <td>
                          <form action={alternarDestinatario}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="ativo" value={d.ativo ? "0" : "1"} />
                            <button
                              type="submit"
                              className={`badge ${d.ativo ? "badge-green" : "badge-gray"}`}
                              style={{ border: "none", cursor: "pointer" }}
                            >
                              <span
                                className="badge-dot"
                                style={{ background: d.ativo ? "var(--green)" : "var(--gray)" }}
                              />
                              {d.ativo ? "Ativo" : "Pausado"}
                            </button>
                          </form>
                        </td>
                        <td>
                          <DeleteDestinatario id={d.id} email={d.email} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Painel direito */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Adicionar destinatário */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              Adicionar destinatário
            </p>
            <form
              action={adicionarDestinatario}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div>
                <label className="form-label">Nome</label>
                <input type="text" name="nome" className="form-input" placeholder="João Silva (opcional)" />
              </div>
              <div>
                <label className="form-label">E-mail *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="joao@empresa.com.br"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar
              </button>
            </form>
          </div>

          {/* Status SMTP */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Configuração SMTP</p>
            {smtpOk ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  background: "var(--green-bg)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <svg
                  style={{ width: 14, height: 14, color: "var(--green)", flexShrink: 0 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ fontSize: 12.5, color: "var(--green)", fontWeight: 500 }}>
                  SMTP configurado
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  padding: "10px 12px",
                  background: "var(--yellow-bg)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <svg
                  style={{ width: 14, height: 14, color: "var(--yellow)", flexShrink: 0, marginTop: 1 }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <div>
                  <p style={{ fontSize: 12.5, color: "var(--yellow)", fontWeight: 600, marginBottom: 2 }}>
                    SMTP não configurado
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--yellow)", lineHeight: 1.5 }}>
                    Defina <code className="mono">SMTP_USER</code>,{" "}
                    <code className="mono">SMTP_PASSWORD</code> e{" "}
                    <code className="mono">SMTP_FROM_EMAIL</code> nas variáveis de ambiente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
