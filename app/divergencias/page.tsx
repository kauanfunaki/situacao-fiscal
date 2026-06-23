import Link from "next/link";
import { listarDivergencias } from "@/lib/db";
import { formatCnpj, formatDataHora } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DivergenciasPage() {
  const divergencias = await listarDivergencias();

  return (
    <>
      <h1 className="page-title">Divergências</h1>
      <p className="page-sub">
        CNPJs com dados sinalizados como divergentes pelos usuários da plataforma.
      </p>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Sinalizadas</span>
          <span className="card-count">
            {divergencias.length} {divergencias.length !== 1 ? "registros" : "registro"}
          </span>
        </div>
        <div className="tabela-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>CNPJ</th>
                <th>Razão Social</th>
                <th style={{ textAlign: "left" }}>Descrição</th>
                <th>Sinalizado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {divergencias.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Nenhuma divergência sinalizada</p>
                      <span>Tudo certo — sem inconsistências registradas</span>
                    </div>
                  </td>
                </tr>
              )}
              {divergencias.map((d) => (
                <tr key={d.cnpj}>
                  <td className="mono">
                    <Link href={`/cnpj/${d.cnpj}`} style={{ color: "var(--accent)" }}>
                      {formatCnpj(d.cnpj)}
                    </Link>
                  </td>
                  <td>{d.razao_social || "—"}</td>
                  <td style={{ textAlign: "left", maxWidth: 420 }}>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {d.descricao}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDataHora(d.criado_em)}</td>
                  <td>
                    <Link
                      href={`/cnpj/${d.cnpj}`}
                      className="btn btn-secondary"
                      style={{ height: 28, padding: "0 10px", fontSize: 12 }}
                    >
                      Ver
                    </Link>
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
