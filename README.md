# Interface — Painel de Situação Fiscal (Next.js)

Painel web (App Router + TypeScript) que lê o MySQL preenchido pela Etapa 2 e
mostra o status fiscal das empresas.

## Rotas

| Rota              | Descrição                                        |
|-------------------|--------------------------------------------------|
| `/`               | Dashboard: cards de resumo, busca, filtro, lista |
| `/cnpj/[cnpj]`    | Detalhe da empresa: cadastro, certidão, débitos, sócios |
| `/api/empresas`   | JSON da lista (`?q=`, `?situacao=`) — p/ integrações |
| `/api/health`     | Healthcheck (app + conexão MySQL)                |

## Variáveis de ambiente

Copie `.env.example` para `.env.local` (dev) ou configure no EasyPanel:

```
DB_HOST=vps.41tech.cloud
DB_PORT=3309
DB_USER=root
DB_PASSWORD=********
DB_NAME=certidao_automation
```

## Desenvolvimento

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build local

```bash
npm run build
npm start
```

## Deploy no EasyPanel (Docker)

O `Dockerfile` é multi-stage e usa o output `standalone` do Next (imagem final
mínima, sem `node_modules` de dev).

1. No EasyPanel, crie um app do tipo **App** apontando para este diretório
   (`interface/`) como contexto de build, ou use a imagem buildada.
2. Configure as variáveis de ambiente (`DB_*`) na aba **Environment**.
3. Porta interna do container: **3000**.
4. Healthcheck recomendado: `GET /api/health`.

Build/run manual com Docker:

```bash
docker build -t certidao-interface ./interface
docker run -p 3000:3000 \
  -e DB_HOST=... -e DB_PORT=3309 -e DB_USER=root \
  -e DB_PASSWORD=... -e DB_NAME=certidao_automation \
  certidao-interface
```

> A interface é **somente leitura** — nunca escreve no banco. O preenchimento é
> responsabilidade exclusiva da Etapa 2.
