import Link from "next/link";
import { notFound } from "next/navigation";
import {
  debitosDoRelatorio,
  obterDivergencia,
  obterEmpresa,
  sociosDoRelatorio,
  ultimoRelatorio,
} from "@/lib/db";
import DivergenciaWidget from "./DivergenciaWidget";
import {
  CERTIDAO_LABEL,
  formatCnpj,
  formatCpfCnpj,
  formatData,
  formatDataHora,
  formatMoeda,
  situacaoEfetiva,
  SITUACAO_COR,
  SITUACAO_DOT,
  SITUACAO_LABEL,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: { cnpj: string } };

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="info">
      <div className="k">{k}</div>
      <div className="v">{v || "—"}</div>
    </div>
  );
}

export default async function DetalheEmpresa({ params }: Props) {
  const cnpj = (params.cnpj || "").replace(/\D/g, "");
  const [empresa, relatorio, divergencia] = await Promise.all([
    obterEmpresa(cnpj),
    ultimoRelatorio(cnpj),
    obterDivergencia(cnpj),
  ]);
  if (!empresa) notFound();

  const debitos = relatorio ? await debitosDoRelatorio(relatorio.id) : [];
  const socios = relatorio ? await sociosDoRelatorio(relatorio.id) : [];

  const sit = situacaoEfetiva(empresa);
  const certStatus = empresa.apto === 0 ? null : empresa.certidao_status;

  const pendencias = debitos.filter((d) => d.categoria === "pendencia_debito");
  const suspensas = debitos.filter((d) => d.categoria === "exigibilidade_suspensa");

  return (
    <>
      <Link href="/" className="voltar">
        ← Voltar ao painel
      </Link>

      <h1 className="page-title">{empresa.razao_social || formatCnpj(empresa.cnpj)}</h1>
      <p className="page-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="mono">{formatCnpj(empresa.cnpj)}</span>
        <span className={`badge ${SITUACAO_COR[sit] ?? "badge-gray"}`}>
          <span
            className="badge-dot"
            style={{ background: SITUACAO_DOT[sit] ?? "var(--gray)" }}
          />
          {SITUACAO_LABEL[sit] ?? sit}
        </span>
      </p>

      <div style={{ margin: "16px 0" }}>
        <DivergenciaWidget
          cnpj={cnpj}
          inicial={divergencia ? { descricao: divergencia.descricao, criado_em: String(divergencia.criado_em) } : null}
        />
      </div>

      <h2 className="sec">Dados Cadastrais</h2>
      <div className="detalhe-grid">
        <Info k="Situação Cadastral" v={empresa.situacao_cadastral} />
        <Info k="Natureza Jurídica" v={empresa.natureza_juridica} />
        <Info k="Data de Abertura" v={formatData(empresa.data_abertura)} />
        <Info k="Porte" v={empresa.porte} />
        <Info k="CNAE" v={empresa.cnae} />
        <Info k="UA de Domicílio" v={empresa.ua_domicilio} />
        <Info
          k="Endereço"
          v={`${empresa.endereco}${empresa.bairro ? ", " + empresa.bairro : ""}`}
        />
        <Info k="Município / UF" v={`${empresa.municipio} / ${empresa.uf}`} />
        <Info k="CEP" v={empresa.cep} />
        <Info k="Responsável" v={empresa.responsavel} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2 className="sec" style={{ marginBottom: 0 }}>
          Certidão Emitida
        </h2>
        {certStatus === "disponivel" && empresa.tem_certidao ? (
          <a
            href={`/api/certidao/${empresa.cnpj}`}
            className="btn btn-primary"
            style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            title="Baixar certidão (PDF)"
          >
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Baixar Certidão (PDF)
          </a>
        ) : certStatus === "indisponivel" ? (
          <span className="cert-tag cert-tag-gray">{CERTIDAO_LABEL.indisponivel}</span>
        ) : certStatus === "exige_matriz" ? (
          <span
            className="cert-tag cert-tag-amber"
            title="CNPJ é filial — a certidão deve ser emitida pelo CNPJ da matriz"
          >
            {CERTIDAO_LABEL.exige_matriz}
          </span>
        ) : certStatus === "erro_interno" ? (
          <span className="cert-tag cert-tag-red">{CERTIDAO_LABEL.erro_interno}</span>
        ) : (
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
            Certidão não disponível
          </span>
        )}
      </div>
      <div className="detalhe-grid" style={{ marginTop: 12 }}>
        <Info k="Tipo de Certidão" v={empresa.tipo_certidao} />
        <Info k="Código" v={relatorio?.codigo_certidao} />
        <Info k="Emissão" v={formatData(relatorio?.certidao_emissao)} />
        <Info k="Validade" v={formatData(empresa.certidao_validade)} />
        <Info k="Total de Débitos" v={String(empresa.qtd_debitos)} />
        <Info k="Saldo Devedor Total" v={formatMoeda(empresa.valor_total_saldo)} />
        <Info
          k="Última Atualização"
          v={formatDataHora(empresa.ultimo_relatorio_em ?? empresa.atualizado_em)}
        />
      </div>

      <h2 className="sec">Pendências — Débito (SIEF) · {pendencias.length}</h2>
      <TabelaDebitos linhas={pendencias} comEncargos />

      <h2 className="sec">Débitos com Exigibilidade Suspensa · {suspensas.length}</h2>
      <TabelaDebitos linhas={suspensas} comEncargos={false} />

      <h2 className="sec">Sócios e Administradores · {socios.length}</h2>
      <div className="card tabela-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>CPF/CNPJ</th>
              <th>Nome</th>
              <th>Qualificação</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {socios.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <p>Sem sócios registrados</p>
                  </div>
                </td>
              </tr>
            )}
            {socios.map((s) => (
              <tr key={s.id}>
                <td className="mono">{formatCpfCnpj(s.cpf_cnpj)}</td>
                <td>{s.nome}</td>
                <td>{s.qualificacao}</td>
                <td>{s.situacao_cadastral}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TabelaDebitos({
  linhas,
  comEncargos,
}: {
  linhas: Awaited<ReturnType<typeof debitosDoRelatorio>>;
  comEncargos: boolean;
}) {
  if (linhas.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <p>Nenhum débito nesta categoria</p>
        </div>
      </div>
    );
  }
  return (
    <div className="card tabela-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Receita</th>
            <th>PA/Exerc.</th>
            <th>Vencimento</th>
            <th>Vl. Original</th>
            <th>Sdo. Devedor</th>
            {comEncargos && <th>Multa</th>}
            {comEncargos && <th>Juros</th>}
            {comEncargos && <th>Sdo. Consolidado</th>}
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((d) => (
            <tr key={d.id}>
              <td>{d.receita}</td>
              <td>{d.pa_exerc}</td>
              <td>{formatData(d.dt_vcto)}</td>
              <td className="mono">{formatMoeda(d.vl_original)}</td>
              <td className="mono">{formatMoeda(d.sdo_devedor)}</td>
              {comEncargos && <td className="mono">{formatMoeda(d.multa)}</td>}
              {comEncargos && <td className="mono">{formatMoeda(d.juros)}</td>}
              {comEncargos && <td className="mono">{formatMoeda(d.sdo_dev_cons)}</td>}
              <td>{d.situacao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
