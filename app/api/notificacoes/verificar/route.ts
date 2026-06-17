import { NextResponse } from "next/server";
import {
  buscarCandidatos,
  filtrarRelevantes,
  listarDestinatarios,
  registrarNotificacoes,
} from "@/lib/db";
import { enviarNotificacao } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * POST /api/notificacoes/verificar
 * Compara os relatórios processados com o log de notificações, envia e-mail
 * para os destinatários ativos quando há novidades relevantes e registra o log.
 */
export async function POST() {
  try {
    const candidatos = await buscarCandidatos();
    const relevantes = filtrarRelevantes(candidatos);
    const vistosIds = candidatos.map((c) => c.relatorio_id);

    if (relevantes.length === 0) {
      // marca todos os candidatos como vistos para não reavaliar
      await registrarNotificacoes([], vistosIds);
      return NextResponse.json({
        ok: true,
        enviados: 0,
        relevantes: 0,
        msg: "Nenhuma novidade relevante desde a última verificação.",
      });
    }

    const destinatarios = await listarDestinatarios();
    const [enviados, erro] = await enviarNotificacao(destinatarios, relevantes);

    if (erro) {
      // não registra: mantém as novidades pendentes para nova tentativa
      return NextResponse.json({ ok: false, erro, relevantes: relevantes.length });
    }

    await registrarNotificacoes(
      relevantes.map((r) => r.relatorio_id),
      vistosIds
    );

    const n = relevantes.length;
    return NextResponse.json({
      ok: true,
      enviados,
      relevantes: n,
      msg: `${n} atualizaç${n === 1 ? "ão" : "ões"} relevante${n === 1 ? "" : "s"} — e-mail enviado para ${enviados} destinatário${enviados === 1 ? "" : "s"}.`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, erro: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
