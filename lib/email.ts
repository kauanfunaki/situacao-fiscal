import nodemailer from "nodemailer";
import type { Destinatario, Novidade } from "./db";
import { formatCnpj, formatMoeda, SITUACAO_LABEL } from "./format";

// ── Paleta (mesma identidade do Caixa Postal 41) ──────────────────
const NAVY = "#0D1117";
const NAVY_2 = "#161D2A";
const BLUE = "#3A7BD5";
const BLUE_L = "#EBF2FF";
const WHITE = "#FFFFFF";
const BODY_BG = "#F4F6FA";
const TEXT_1 = "#0D1117";
const TEXT_2 = "#374151";
const TEXT_3 = "#6B7280";
const BORDER = "#E2E8F0";
const ROW_ALT = "#F8FAFC";

export function smtpConfigurado(): boolean {
  return Boolean(
    process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM_EMAIL
  );
}

function corSituacao(s: string): string {
  if (s === "regular") return "#059669";
  if (s === "positiva_efeito_negativa") return "#D97706";
  if (s === "positiva") return "#DC2626";
  return "#6B7280";
}

function badge(s: string): string {
  const cor = corSituacao(s);
  const label = SITUACAO_LABEL[s] ?? s;
  return (
    `<span style="display:inline-block;background:${cor}1A;color:${cor};` +
    `font-family:'Trebuchet MS',Arial,sans-serif;font-size:11px;font-weight:700;` +
    `padding:2px 8px;border-radius:5px;white-space:nowrap;">${label}</span>`
  );
}

function th(label: string, width = ""): string {
  const w = width ? `width="${width}" ` : "";
  return (
    `<th ${w}style="padding:8px 14px;text-align:center;font-family:'Trebuchet MS',Arial,sans-serif;` +
    `font-size:9px;font-weight:700;color:${TEXT_3};text-transform:uppercase;` +
    `letter-spacing:.1em;background:${ROW_ALT};border-bottom:1px solid ${BORDER};">${label}</th>`
  );
}

function td(content: string, opts: { mono?: boolean } = {}): string {
  const family = opts.mono ? "'Courier New',monospace" : "'Trebuchet MS',Arial,sans-serif";
  const size = opts.mono ? "11px" : "12.5px";
  return (
    `<td style="padding:10px 14px;text-align:center;font-family:${family};font-size:${size};` +
    `color:${TEXT_2};border-bottom:1px solid ${BORDER};vertical-align:middle;">${content}</td>`
  );
}

function montarLinhas(novidades: Novidade[]): string {
  return novidades
    .map((n, i) => {
      const bg = i % 2 ? `background:${ROW_ALT};` : "";
      const transicao =
        n.situacao_anterior && n.situacao_anterior !== n.situacao
          ? `${badge(n.situacao_anterior)} <span style="color:${TEXT_3};">→</span> ${badge(n.situacao)}`
          : badge(n.situacao);
      return (
        `<tr style="${bg}">` +
        td(formatCnpj(n.cnpj), { mono: true }) +
        td(n.razao_social || "—") +
        td(transicao) +
        td(String(n.qtd_debitos)) +
        td(formatMoeda(n.valor_total_saldo), { mono: true }) +
        "</tr>"
      );
    })
    .join("");
}

export function montarHtml(novidades: Novidade[]): string {
  const total = novidades.length;
  const plural = total === 1 ? "atualização" : "atualizações";

  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Situação Fiscal — 41 Tech</title>
</head>
<body style="margin:0;padding:0;background:${BODY_BG};-webkit-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;background:${BODY_BG};">
<tr><td align="center" style="padding:32px 16px;">
  <table width="660" cellpadding="0" cellspacing="0" role="presentation" style="max-width:660px;width:100%;border-collapse:collapse;">

    <!-- HEADER -->
    <tr>
      <td style="background:${NAVY};border-radius:12px 12px 0 0;padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align:middle;">
              <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:10px;font-weight:700;
                          color:${BLUE};letter-spacing:.12em;text-transform:uppercase;">
                41 Tech Contabilidade
              </div>
              <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:${WHITE};
                          letter-spacing:-.02em;margin-top:6px;line-height:1.2;">
                Atualização de<br>Situação Fiscal
              </div>
              <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:12px;
                          color:rgba(255,255,255,.45);margin-top:8px;">
                ${total} ${plural} relevante${total === 1 ? "" : "s"} desde a última verificação
              </div>
            </td>
            <td style="vertical-align:middle;text-align:right;">
              <div style="display:inline-block;background:${BLUE};border-radius:10px;padding:12px 22px;text-align:center;">
                <div style="font-family:Georgia,serif;font-size:38px;font-weight:700;color:${WHITE};line-height:1;">${total}</div>
                <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:9px;color:rgba(255,255,255,.7);
                            text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">novidades</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="background:${WHITE};border:1px solid ${BORDER};border-top:none;padding:24px 28px 28px;">
        <div style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:${TEXT_1};
                    border-bottom:2px solid ${BLUE};padding-bottom:10px;margin-bottom:14px;">
          Empresas com mudança de situação
        </div>
        <table width="100%" cellpadding="0" cellspacing="0"
               style="border-collapse:collapse;border:1px solid ${BORDER};border-radius:6px;overflow:hidden;">
          <thead>
            <tr>${th("CNPJ", "140")}${th("Empresa")}${th("Situação", "200")}${th("Débitos", "70")}${th("Saldo Devedor", "120")}</tr>
          </thead>
          <tbody>${montarLinhas(novidades)}</tbody>
        </table>
        <p style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:11.5px;color:${TEXT_3};
                  margin-top:14px;line-height:1.6;">
          Acesse o painel <strong style="color:${BLUE};">Situação Fiscal</strong> para ver os débitos
          detalhados, sócios e a certidão emitida de cada empresa.
        </p>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:${NAVY_2};border-radius:0 0 12px 12px;padding:18px 32px;">
        <p style="margin:0;font-family:'Trebuchet MS',Arial,sans-serif;font-size:11px;
                  color:rgba(255,255,255,.32);line-height:1.7;">
          Enviado automaticamente pelo painel
          <span style="color:rgba(255,255,255,.55);font-weight:600;">Situação Fiscal — 41 Tech</span>.<br>
          Para cancelar, acesse o painel e desative seu e-mail na aba Notificações.
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

/** Envia o e-mail de notificação. Retorna [qtd_enviados, erro]. */
export async function enviarNotificacao(
  destinatarios: Destinatario[],
  novidades: Novidade[]
): Promise<[number, string]> {
  if (!smtpConfigurado()) {
    return [0, "SMTP não configurado. Preencha as variáveis SMTP_* no ambiente."];
  }
  if (novidades.length === 0) return [0, ""];

  const ativos = destinatarios.filter((d) => Number(d.ativo) === 1);
  if (ativos.length === 0) return [0, "Nenhum destinatário ativo."];

  const fromEmail = process.env.SMTP_FROM_EMAIL!;
  const fromName = process.env.SMTP_FROM_NAME || "Situação Fiscal 41 Tech";
  const total = novidades.length;
  const assunto = `Situação Fiscal — ${total} atualizaç${total === 1 ? "ão" : "ões"} relevante${total === 1 ? "" : "s"}`;
  const html = montarHtml(novidades);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.41contabil.com.br",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: String(process.env.SMTP_TLS ?? "true") !== "false",
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  });

  try {
    let enviados = 0;
    for (const d of ativos) {
      await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: d.nome ? `${d.nome} <${d.email}>` : d.email,
        subject: assunto,
        html,
      });
      enviados++;
    }
    return [enviados, ""];
  } catch (e: any) {
    return [0, String(e?.message ?? e)];
  }
}
