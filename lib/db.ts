import mysql from "mysql2/promise";

// Pool único reaproveitado entre requests (evita esgotar conexões em dev/hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "certidao_automation",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: true,
  });
}

export const pool: mysql.Pool = global._mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") global._mysqlPool = pool;

export async function query<T = any>(sql: string, params?: any): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

// ---------- Tipos ----------

export type Empresa = {
  cnpj: string;
  razao_social: string;
  situacao_cadastral: string;
  natureza_juridica: string;
  data_abertura: string | null;
  cnae: string;
  porte: string;
  ua_domicilio: string;
  endereco: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  responsavel: string;
  situacao: string;
  tem_pendencia: number;
  tipo_certidao: string;
  certidao_validade: string | null;
  qtd_debitos: number;
  valor_total_original: string;
  valor_total_saldo: string;
  ultimo_relatorio_em: string | null;
  atualizado_em: string;
  tem_certidao?: number;
};

export type Debito = {
  id: number;
  categoria: string;
  receita: string;
  pa_exerc: string;
  dt_vcto: string | null;
  vl_original: string;
  sdo_devedor: string;
  multa: string;
  juros: string;
  sdo_dev_cons: string;
  situacao: string;
  cnpj_prestador: string;
};

export type Socio = {
  id: number;
  cpf_cnpj: string;
  nome: string;
  qualificacao: string;
  situacao_cadastral: string;
};

export type Relatorio = {
  id: number;
  arquivo: string;
  emitido_em: string | null;
  tipo_certidao: string;
  codigo_certidao: string;
  certidao_emissao: string | null;
  certidao_validade: string | null;
  situacao: string;
  qtd_debitos: number;
  valor_total_original: string;
  valor_total_saldo: string;
  processado_em: string;
};

// ---------- Queries ----------

export async function listarEmpresas(busca?: string, situacao?: string): Promise<Empresa[]> {
  await ensureCertidoesTable();
  const where: string[] = [];
  const params: Record<string, any> = {};
  if (busca && busca.trim()) {
    where.push("(e.cnpj LIKE :b OR e.razao_social LIKE :b)");
    params.b = `%${busca.replace(/\D/g, "") || busca}%`;
    // permite buscar tanto por dígitos do CNPJ quanto por texto da razão social
    if (!/^\d+$/.test(busca)) params.b = `%${busca}%`;
  }
  if (situacao && situacao !== "todas") {
    where.push("e.situacao = :s");
    params.s = situacao;
  }
  const sql = `
    SELECT e.*, (c.cnpj IS NOT NULL) AS tem_certidao
    FROM empresas e
    LEFT JOIN certidoes c ON c.cnpj = e.cnpj
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY e.tem_pendencia DESC, e.razao_social ASC
  `;
  return query<Empresa>(sql, params);
}

export async function obterEmpresa(cnpj: string): Promise<Empresa | null> {
  const rows = await query<Empresa>("SELECT * FROM empresas WHERE cnpj = :c", { c: cnpj });
  return rows[0] ?? null;
}

export async function ultimoRelatorio(cnpj: string): Promise<Relatorio | null> {
  const rows = await query<Relatorio>(
    "SELECT * FROM relatorios WHERE cnpj = :c ORDER BY processado_em DESC LIMIT 1",
    { c: cnpj }
  );
  return rows[0] ?? null;
}

export async function debitosDoRelatorio(relatorioId: number): Promise<Debito[]> {
  return query<Debito>(
    "SELECT * FROM debitos WHERE relatorio_id = :r ORDER BY categoria, dt_vcto",
    { r: relatorioId }
  );
}

export async function sociosDoRelatorio(relatorioId: number): Promise<Socio[]> {
  return query<Socio>("SELECT * FROM socios WHERE relatorio_id = :r", { r: relatorioId });
}

export async function resumoStatus(): Promise<{ situacao: string; total: number }[]> {
  return query("SELECT situacao, COUNT(*) AS total FROM empresas GROUP BY situacao");
}

// ---------- Certidões (PDF) ----------

let _certReady = false;

export async function ensureCertidoesTable(): Promise<void> {
  if (_certReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS certidoes (
      cnpj       VARCHAR(14)  NOT NULL,
      arquivo    VARCHAR(255) DEFAULT '',
      pdf        LONGBLOB,
      tamanho    INT          DEFAULT 0,
      emitida_em TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (cnpj)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  _certReady = true;
}

export async function certidaoExiste(cnpj: string): Promise<boolean> {
  await ensureCertidoesTable();
  const rows = await query<{ cnpj: string }>(
    "SELECT cnpj FROM certidoes WHERE cnpj = :c AND tamanho > 0",
    { c: cnpj }
  );
  return rows.length > 0;
}

export async function obterCertidaoPdf(
  cnpj: string
): Promise<{ pdf: Buffer; arquivo: string } | null> {
  await ensureCertidoesTable();
  const rows = await query<{ pdf: Buffer; arquivo: string }>(
    "SELECT pdf, arquivo FROM certidoes WHERE cnpj = :c AND tamanho > 0",
    { c: cnpj }
  );
  if (rows.length === 0 || !rows[0].pdf) return null;
  return { pdf: rows[0].pdf as Buffer, arquivo: rows[0].arquivo || `certidao_${cnpj}.pdf` };
}

// ---------- Execuções ----------

export type Execucao = {
  id: number;
  inicio: string | null;
  fim: string | null;
  status: string;
  cnpjs_processados: number;
  observacoes: string | null;
};

export async function listarExecucoes(
  page = 1,
  perPage = 30
): Promise<{ rows: Execucao[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * perPage;
  const totalRows = await query<{ total: number }>(
    "SELECT COUNT(*) AS total FROM execucoes"
  );
  const total = Number(totalRows[0]?.total ?? 0);
  const rows = await query<Execucao>(
    "SELECT id, inicio, fim, status, cnpjs_processados, observacoes " +
      "FROM execucoes ORDER BY inicio DESC, id DESC LIMIT :lim OFFSET :off",
    { lim: perPage, off: offset }
  );
  return { rows, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

// ---------- Notificações ----------

export type Destinatario = {
  id: number;
  nome: string;
  email: string;
  ativo: number;
  criado_em: string;
};

export type Novidade = {
  relatorio_id: number;
  cnpj: string;
  razao_social: string | null;
  situacao: string;
  situacao_anterior: string | null;
  tem_pendencia: number;
  qtd_debitos: number;
  valor_total_saldo: string;
  processado_em: string;
};

let _notifReady = false;

export async function ensureNotifTables(): Promise<void> {
  if (_notifReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS notif_destinatarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(200) NOT NULL DEFAULT '',
      email VARCHAR(300) NOT NULL,
      ativo TINYINT(1) DEFAULT 1,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS notif_log (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      relatorio_id BIGINT NOT NULL,
      relevante TINYINT(1) DEFAULT 0,
      enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_relatorio (relatorio_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  _notifReady = true;
}

export async function listarDestinatarios(): Promise<Destinatario[]> {
  await ensureNotifTables();
  return query<Destinatario>(
    "SELECT id, nome, email, ativo, criado_em FROM notif_destinatarios ORDER BY nome, email"
  );
}

export async function criarDestinatario(nome: string, email: string): Promise<void> {
  await ensureNotifTables();
  await query(
    "INSERT INTO notif_destinatarios (nome, email) VALUES (:nome, :email) " +
      "ON DUPLICATE KEY UPDATE nome=VALUES(nome), ativo=1",
    { nome: nome.trim(), email: email.trim().toLowerCase() }
  );
}

export async function toggleDestinatario(id: number, ativo: boolean): Promise<void> {
  await ensureNotifTables();
  await query("UPDATE notif_destinatarios SET ativo=:ativo WHERE id=:id", {
    ativo: ativo ? 1 : 0,
    id,
  });
}

export async function deletarDestinatario(id: number): Promise<void> {
  await ensureNotifTables();
  await query("DELETE FROM notif_destinatarios WHERE id=:id", { id });
}

/**
 * Candidatos = relatórios ainda não registrados no notif_log.
 * Para cada um, busca a situação do relatório imediatamente anterior do mesmo CNPJ.
 */
export async function buscarCandidatos(): Promise<Novidade[]> {
  await ensureNotifTables();
  return query<Novidade>(`
    SELECT r.id AS relatorio_id, r.cnpj, e.razao_social, r.situacao,
           r.tem_pendencia, r.qtd_debitos, r.valor_total_saldo, r.processado_em,
           (SELECT r2.situacao FROM relatorios r2
              WHERE r2.cnpj = r.cnpj AND r2.processado_em < r.processado_em
              ORDER BY r2.processado_em DESC LIMIT 1) AS situacao_anterior
    FROM relatorios r
    LEFT JOIN empresas e ON e.cnpj = r.cnpj
    WHERE r.id NOT IN (SELECT relatorio_id FROM notif_log)
    ORDER BY r.processado_em DESC
    LIMIT 500
  `);
}

/** Filtra os candidatos que representam algo NOVO e RELEVANTE para notificar. */
export function filtrarRelevantes(candidatos: Novidade[]): Novidade[] {
  return candidatos.filter((c) => {
    if (c.situacao_anterior == null) {
      // primeira vez que vemos esse CNPJ → relevante só se já tiver pendência
      return Number(c.tem_pendencia) === 1;
    }
    // mudança de situação em relação ao relatório anterior
    return c.situacao_anterior !== c.situacao;
  });
}

export async function registrarNotificacoes(
  relevanteIds: number[],
  vistosIds: number[]
): Promise<void> {
  await ensureNotifTables();
  const relevantes = new Set(relevanteIds);
  for (const id of vistosIds) {
    await query(
      "INSERT IGNORE INTO notif_log (relatorio_id, relevante) VALUES (:id, :rel)",
      { id, rel: relevantes.has(id) ? 1 : 0 }
    );
  }
}

export async function ultimaVerificacao(): Promise<string | null> {
  await ensureNotifTables();
  const rows = await query<{ ultima: string | null }>(
    "SELECT MAX(enviado_em) AS ultima FROM notif_log"
  );
  return rows[0]?.ultima ?? null;
}

// ---------- CNPJs Monitorados ----------

export type CnpjMonitorado = {
  cnpj: string;
  razao_social: string;
  ativo: number;
  atualizado_em: string;
  situacao: string | null;
  ultimo_relatorio_em: string | null;
};

export async function listarCnpjsMonitorados(): Promise<CnpjMonitorado[]> {
  return query<CnpjMonitorado>(`
    SELECT c.cnpj, c.razao_social, c.ativo, c.atualizado_em,
           e.situacao, e.ultimo_relatorio_em
    FROM cnpjs c
    LEFT JOIN empresas e ON e.cnpj = c.cnpj
    ORDER BY c.ativo DESC, c.razao_social ASC, c.cnpj ASC
  `);
}

export async function adicionarCnpjMonitorado(cnpj: string, razaoSocial: string): Promise<void> {
  await query(
    `INSERT INTO cnpjs (cnpj, razao_social, ativo)
     VALUES (:cnpj, :rs, 1)
     ON DUPLICATE KEY UPDATE razao_social = IF(:rs != '', VALUES(razao_social), razao_social), ativo = 1`,
    { cnpj: cnpj.replace(/\D/g, ""), rs: razaoSocial.trim() }
  );
}

export async function removerCnpjMonitorado(cnpj: string): Promise<void> {
  await query("DELETE FROM cnpjs WHERE cnpj = :cnpj", { cnpj });
}

export async function toggleCnpjMonitorado(cnpj: string, ativo: boolean): Promise<void> {
  await query("UPDATE cnpjs SET ativo = :ativo WHERE cnpj = :cnpj", {
    ativo: ativo ? 1 : 0,
    cnpj,
  });
}

export async function contagemPendentes(): Promise<number> {
  await ensureNotifTables();
  const rows = await query<{ total: number }>(
    "SELECT COUNT(*) AS total FROM relatorios WHERE id NOT IN (SELECT relatorio_id FROM notif_log)"
  );
  return Number(rows[0]?.total ?? 0);
}
