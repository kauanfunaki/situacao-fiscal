"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { removerCnpj } from "./actions";

type ResultadoImport = { ok: boolean; msg?: string; erro?: string } | null;

export function ImportarPlanilha() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImport>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setEnviando(true);
    setResultado(null);
    try {
      const fd = new FormData();
      fd.append("arquivo", file);
      const r = await fetch("/api/cnpjs/importar", { method: "POST", body: fd });
      const data = await r.json();
      setResultado(data);
      if (data.ok) {
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setResultado({ ok: false, erro: "Erro de conexão." });
    }
    setEnviando(false);
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Importar planilha</p>
      <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.5 }}>
        Aceita <span className="mono">.xlsx</span>, <span className="mono">.xls</span> ou{" "}
        <span className="mono">.csv</span> com coluna <span className="mono">cnpj</span>.
        Coluna <span className="mono">razao_social</span> opcional.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          ref={inputRef}
          type="file"
          name="arquivo"
          accept=".xlsx,.xls,.csv"
          required
          style={{
            fontSize: 12,
            color: "var(--text-2)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 10px",
            cursor: "pointer",
            width: "100%",
          }}
        />
        <button
          type="submit"
          disabled={enviando}
          className="btn btn-secondary"
          style={{ justifyContent: "center" }}
        >
          {enviando ? (
            <>
              <svg className="spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Importando…
            </>
          ) : (
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar
            </>
          )}
        </button>
      </form>

      {resultado && (
        <div
          className={resultado.ok ? "alert alert-success" : "alert alert-error"}
          style={{ marginTop: 10 }}
        >
          {resultado.ok ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
          <span>{resultado.msg || resultado.erro}</span>
        </div>
      )}
    </div>
  );
}

export function DeleteCnpj({ cnpj, label }: { cnpj: string; label: string }) {
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
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
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
            <p className="modal-title">Remover CNPJ</p>
            <p className="modal-body">
              <strong>{label}</strong> será removido da lista de monitoramento. A
              automação não processará mais este CNPJ.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <form action={removerCnpj} style={{ flex: 1 }}>
                <input type="hidden" name="cnpj" value={cnpj} />
                <button
                  type="submit"
                  className="btn btn-danger"
                  style={{ width: "100%", justifyContent: "center" }}
                >
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
