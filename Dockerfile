# ─────────────────────────────────────────────────────────────
# Dockerfile multi-stage para a interface Next.js (EasyPanel)
# Usa output "standalone" → imagem final mínima (~150MB)
# ─────────────────────────────────────────────────────────────

# 1) Dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Instala dependências (npm ci se houver lockfile, senão npm install)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 2) Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Runner (produção)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuário sem privilégios
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Artefatos do build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# server.js é gerado pelo output standalone do Next
CMD ["node", "server.js"]
