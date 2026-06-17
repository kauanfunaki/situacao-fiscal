import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state" style={{ padding: "72px 0" }}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p>Empresa não encontrada</p>
      <span>O CNPJ informado não está cadastrado no painel.</span>
      <Link href="/" className="voltar" style={{ marginTop: 16 }}>
        ← Voltar ao painel
      </Link>
    </div>
  );
}
