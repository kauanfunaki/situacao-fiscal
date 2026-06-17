"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removerDestinatario } from "./actions";

type Resultado = { ok: boolean; msg?: string; erro?: string } | null;

export function VerificarButton() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);

  async function verificar() {
    setVerificando(true);
    setResultado(null);
    try {
      const r = await fetch("/api/notificacoes/verificar", { method: "POST" });
      const data = await r.json();
      setResultado(data);
      router.refresh();
    } catch {
      setResultado({ ok: false, erro: "Erro de conexão." });
    }
    setVerificando(false);
  }

  return (
    <>
      <button
        onClick={verificar}
        disabled={verificando}
        className="btn btn-primary"
        style={{ flexShrink: 0, minWidth: 150, justifyContent: "center" }}
      >
        {verificando ? (
          <>
            <svg className="spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Verificando…
          </>
        ) : (
          <>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Verificar agora
          </>
        )}
      </button>

      {resultado && (
        <div style={{ marginTop: 14, width: "100%" }}>
          <div className={resultado.ok ? "alert alert-success" : "alert alert-error"} style={{ margin: 0 }}>
            {resultado.ok ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            )}
            <span>{resultado.msg || resultado.erro}</span>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteDestinatario({ id, email }: { id: number; email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="icon-btn danger"
        onClick={() => setOpen(true)}
        title="Remover"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>

      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal">
            <div className="modal-icon" style={{ background: "var(--red-bg)" }}>
              <svg fill="none" stroke="var(--red)" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <p className="modal-title">Remover destinatário</p>
            <p className="modal-body">
              <strong>{email}</strong> não receberá mais notificações. A ação pode ser
              desfeita adicionando o e-mail novamente.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <form action={removerDestinatario} style={{ flex: 1 }}>
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }}>
                  Remover
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
