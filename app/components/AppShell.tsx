"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  {
    label: "Consultas",
    items: [
      {
        href: "/",
        text: "Empresas",
        match: (p: string) => p === "/" || p.startsWith("/cnpj"),
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        ),
      },
      {
        href: "/execucoes",
        text: "Execuções",
        match: (p: string) => p.startsWith("/execucoes"),
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        ),
      },
      {
        href: "/divergencias",
        text: "Divergências",
        match: (p: string) => p.startsWith("/divergencias"),
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        ),
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        href: "/cnpjs",
        text: "CNPJs",
        match: (p: string) => p.startsWith("/cnpjs"),
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        ),
      },
      {
        href: "/notificacoes",
        text: "Notificações",
        match: (p: string) => p.startsWith("/notificacoes"),
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        ),
      },
    ],
  },
];

const TITLES: { test: (p: string) => boolean; title: string }[] = [
  { test: (p) => p === "/", title: "Situação Fiscal das Empresas" },
  { test: (p) => p.startsWith("/cnpjs"), title: "CNPJs Monitorados" },
  { test: (p) => p.startsWith("/cnpj/"), title: "Detalhe da Empresa" },
  { test: (p) => p.startsWith("/execucoes"), title: "Histórico de Execuções" },
  { test: (p) => p.startsWith("/notificacoes"), title: "Notificações por E-mail" },
  { test: (p) => p.startsWith("/divergencias"), title: "Divergências" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const [dark, setDark] = useState(false);

  // Sincroniza com a classe já aplicada pelo script anti-FOUC do layout
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("cert41-theme", next ? "dark" : "light");
    } catch {}
  }

  const title = TITLES.find((t) => t.test(pathname))?.title ?? "";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="41 Tech" />
          </div>
          <div className="logo-text">
            <div className="logo-name">Situação Fiscal</div>
            <div className="logo-sub">41 Tech</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div className="nav-section" key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${item.match(pathname) ? "active" : ""}`}
                >
                  <svg
                    className="nav-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {item.icon}
                  </svg>
                  {item.text}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>e-CAC · Pendências Fiscais</p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-right">
            <div className="status-dot">
              <span className="dot" />
              <span>Banco conectado</span>
            </div>
            <button
              className="theme-btn"
              onClick={toggleTheme}
              title={dark ? "Modo claro" : "Modo escuro"}
              aria-label="Alternar tema"
            >
              {dark ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m8.66-9H21m-18 0H1.34M18.36 5.64l-.71.71M6.36 17.64l-.71.71M18.36 18.36l-.71-.71M6.36 6.36l-.71-.71M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
