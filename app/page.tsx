import Link from "next/link";
import { listarDivergencias, listarEmpresas, resumoStatus } from "@/lib/db";
import {
  CERTIDAO_LABEL,
  formatCnpj,
  formatData,
  formatMoeda,
  situacaoEfetiva,
  SITUACAO_COR,
  SITUACAO_DOT,
  SITUACAO_LABEL,
} from "@/lib/format";

function CertidaoCell({
  cnpj,
  apto,
  status,
  temCertidao,
}: {
  cnpj: string;
  apto?: number;
  status?: string | null;
  temCertidao?: number;
}) {
  // CNPJ não apto → certidão "—"
  if (apto === 0) return <span style={{ color: "var(--text-3)" }}>—</span>;

  if (status === "disponivel" && temCertidao) {
    return (
      <a
        href={`/api/certidao/${cnpj}`}
        className="btn btn-secondary"
        style={{
          display: "inline-flex",
          gap: 6,
          alignItems: "center",
          padding: "4px 10px",
          fontSize: 12,
        }}
        title="Baixar certidão (PDF)"
      >
        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {CERTIDAO_LABEL.disponivel}
      </a>
    );
  }

  if (status === "indisponivel") {
    return (
      <span className="cert-tag cert-tag-gray" title="Receita: informações insuficientes para emitir">
        {CERTIDAO_LABEL.indisponivel}
      </span>
    );
  }

  if (status === "exige_matriz") {
    return (
      <span
        className="cert-tag cert-tag-amber"
        title="CNPJ é filial — a certidão deve ser emitida pelo CNPJ da matriz"
      >
        {CERTIDAO_LABEL.exige_matriz}
      </span>
    );
  }

  if (status === "erro_interno") {
    return (
      <span className="cert-tag cert-tag-red" title="Erro interno da Receita ao emitir — reprocessar">
        {CERTIDAO_LABEL.erro_interno}
      </span>
    );
  }

  return <span style={{ color: "var(--text-3)" }}>—</span>;
}

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string; situacao?: string };
};

export default async function Home({ searchParams }: Props) {
  const busca = searchParams.q ?? "";
  const situacao = searchParams.situacao ?? "todas";

  const [empresas, resumo, divs] = await Promise.all([
    listarEmpresas(busca, situacao),
    resumoStatus(),
    listarDivergencias(),
  ]);
  const cnpjsComDivergencia = new Set(divs.map((d) => d.cnpj));

  const total = resumo.reduce((acc, r) => acc + Number(r.total), 0);
  const porSituacao = (s: string) =>
    Number(resumo.find((r) => r.situacao === s)?.total ?? 0);

  return (
    <>
      <h1 className="page-title">Situação Fiscal das Empresas</h1>
      <p className="page-sub">
        Dados extraídos automaticamente dos relatórios da Receita Federal.
      </p>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="num">{total}</div>
          <div className="lbl">Empresas monitoradas</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "var(--green)" }}>
            {porSituacao("regular")}
          </div>
          <div className="lbl">Regulares (Negativa)</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "var(--yellow)" }}>
            {porSituacao("positiva_efeito_negativa")}
          </div>
          <div className="lbl">Positiva c/ Efeito Negativa</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "var(--red)" }}>
            {porSituacao("positiva")}
          </div>
          <div className="lbl">Com Pendência</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "var(--purple)" }}>
            {porSituacao("nao_apto")}
          </div>
          <div className="lbl">CNPJ não apto</div>
        </div>
        <div className="stat-card">
          <div className="num" style={{ color: "var(--yellow)" }}>
            {divs.length}
          </div>
          <div className="lbl">Com Divergências</div>
        </div>
      </div>

      <form className="filtros" method="get">
        <input
          type="text"
          name="q"
          className="form-input"
          placeholder="Buscar por CNPJ ou razão social..."
          defaultValue={busca}
        />
        <select name="situacao" className="form-select" defaultValue={situacao}>
          <option value="todas">Todas as situações</option>
          <option value="regular">Regular</option>
          <option value="positiva_efeito_negativa">Positiva c/ Efeito de Negativa</option>
          <option value="positiva">Com Pendência</option>
          <option value="indefinida">Indefinida</option>
          <option value="nao_apto">CNPJ não apto</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Filtrar
        </button>
      </form>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Empresas</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="card-count">
              {empresas.length} resultado{empresas.length !== 1 ? "s" : ""}
            </span>
            <a
              href={`/api/empresas/export?${new URLSearchParams({
                q: busca,
                situacao,
              }).toString()}`}
              className="btn btn-secondary"
              style={{ height: 30, padding: "0 12px", fontSize: 12.5 }}
              title="Exportar a tabela para Excel (.xlsx)"
            >
              <svg
                style={{ width: 14, height: 14 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar
            </a>
          </div>
        </div>
        <div className="tabela-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão Social</th>
                <th>Situação</th>
                <th>Débitos</th>
                <th>Saldo Devedor</th>
                <th>Validade Certidão</th>
                <th>Certidão</th>
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p>Nenhuma empresa encontrada</p>
                      <span>Ajuste a busca ou aguarde a próxima execução</span>
                    </div>
                  </td>
                </tr>
              )}
              {empresas.map((e) => (
                <tr key={e.cnpj}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Link href={`/cnpj/${e.cnpj}`}>
                        <span className="mono" style={{ color: "var(--accent)" }}>
                          {formatCnpj(e.cnpj)}
                        </span>
                      </Link>
                      {cnpjsComDivergencia.has(e.cnpj) && (
                        <span
                          className="divergencia-badge"
                          title="Dados divergentes sinalizados"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                      )}
                    </span>
                  </td>
                  <td>{e.razao_social || "—"}</td>
                  <td>
                    {(() => {
                      const sit = situacaoEfetiva(e);
                      return (
                        <span className={`badge ${SITUACAO_COR[sit] ?? "badge-gray"}`}>
                          <span
                            className="badge-dot"
                            style={{ background: SITUACAO_DOT[sit] ?? "var(--gray)" }}
                          />
                          {SITUACAO_LABEL[sit] ?? sit}
                        </span>
                      );
                    })()}
                  </td>
                  <td>{e.qtd_debitos}</td>
                  <td className="mono">{formatMoeda(e.valor_total_saldo)}</td>
                  <td>{formatData(e.certidao_validade)}</td>
                  <td>
                    <CertidaoCell
                      cnpj={e.cnpj}
                      apto={e.apto}
                      status={e.certidao_status}
                      temCertidao={e.tem_certidao}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
