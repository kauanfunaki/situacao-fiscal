import Link from "next/link";
import { listarEmpresas, resumoStatus } from "@/lib/db";
import {
  formatCnpj,
  formatData,
  formatMoeda,
  SITUACAO_COR,
  SITUACAO_DOT,
  SITUACAO_LABEL,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { q?: string; situacao?: string };
};

export default async function Home({ searchParams }: Props) {
  const busca = searchParams.q ?? "";
  const situacao = searchParams.situacao ?? "todas";

  const [empresas, resumo] = await Promise.all([
    listarEmpresas(busca, situacao),
    resumoStatus(),
  ]);

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
        </select>
        <button type="submit" className="btn btn-primary">
          Filtrar
        </button>
      </form>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Empresas</span>
          <span className="card-count">
            {empresas.length} resultado{empresas.length !== 1 ? "s" : ""}
          </span>
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
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={6}>
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
                    <Link href={`/cnpj/${e.cnpj}`}>
                      <span className="mono" style={{ color: "var(--accent)" }}>
                        {formatCnpj(e.cnpj)}
                      </span>
                    </Link>
                  </td>
                  <td>{e.razao_social || "—"}</td>
                  <td>
                    <span className={`badge ${SITUACAO_COR[e.situacao] ?? "badge-gray"}`}>
                      <span
                        className="badge-dot"
                        style={{ background: SITUACAO_DOT[e.situacao] ?? "var(--gray)" }}
                      />
                      {SITUACAO_LABEL[e.situacao] ?? e.situacao}
                    </span>
                  </td>
                  <td>{e.qtd_debitos}</td>
                  <td className="mono">{formatMoeda(e.valor_total_saldo)}</td>
                  <td>{formatData(e.certidao_validade)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
