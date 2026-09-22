# syntax=docker/dockerfile:1.7
# Beekal web — Next.js standalone output, so it runs on any Node host.

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/config/package.json ./packages/config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm turbo build --filter=@beekal/web

# ---------- runtime ----------
FROM node:24-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs beekal
WORKDIR /app

COPY --from=build --chown=beekal:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=beekal:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=beekal:nodejs /app/apps/web/public ./apps/web/public

USER beekal
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
