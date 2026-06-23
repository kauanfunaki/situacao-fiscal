"use client";

import { useState } from "react";

interface DivData {
  descricao: string;
  criado_em: string;
}

interface Props {
  cnpj: string;
  inicial: DivData | null;
}

export default function DivergenciaWidget({ cnpj, inicial }: Props) {
  const [divergencia, setDivergencia] = useState<DivData | null>(inicial);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(inicial?.descricao ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!texto.trim()) return;
    setSalvando(true);
    try {
      const r = await fetch(`/api/divergencias/${cnpj}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: texto.trim() }),
      });
      if (r.ok) {
        const data = await r.json();
        setDivergencia(data);
        setEditando(false);
      }
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!confirm("Remover a sinalização de divergência deste CNPJ?")) return;
    setSalvando(true);
    try {
      await fetch(`/api/divergencias/${cnpj}`, { method: "DELETE" });
      setDivergencia(null);
      setTexto("");
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  const WarnIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  // Sem divergência e não editando — botão sutil
  if (!divergencia && !editando) {
    return (
      <button className="btn btn-secondary" onClick={() => setEditando(true)}>
        <WarnIcon />
        Sinalizar Divergência
      </button>
    );
  }

  // Divergência registrada — card amarelo
  if (divergencia && !editando) {
    return (
      <div className="divergencia-card">
        <div className="divergencia-card-header">
          <span className="divergencia-card-title">
            <WarnIcon />
            Dados divergentes sinalizados
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn btn-secondary"
              style={{ height: 28, padding: "0 10px", fontSize: 12 }}
              onClick={() => { setTexto(divergencia.descricao); setEditando(true); }}
            >
              Editar
            </button>
            <button
              className="btn btn-danger"
              style={{ height: 28, padding: "0 10px", fontSize: 12 }}
              onClick={remover}
              disabled={salvando}
            >
              Resolver
            </button>
          </div>
        </div>
        <p className="divergencia-card-body">{divergencia.descricao}</p>
        <span className="divergencia-card-date">
          Sinalizado em{" "}
          {new Date(divergencia.criado_em).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  }

  // Formulário (novo ou edição)
  return (
    <div className="divergencia-form">
      <label className="form-label">Descreva a divergência encontrada</label>
      <textarea
        className="divergencia-textarea"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Ex: Saldo devedor na Receita difere do sistema interno; CNPJ com data de abertura incorreta..."
        rows={3}
        autoFocus
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setEditando(false);
            setTexto(divergencia?.descricao ?? "");
          }}
          disabled={salvando}
        >
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          onClick={salvar}
          disabled={salvando || !texto.trim()}
        >
          {salvando ? "Salvando…" : divergencia ? "Atualizar" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
