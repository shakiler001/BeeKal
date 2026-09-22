# syntax=docker/dockerfile:1.7
# Beekal API — multi-stage, non-root, no build toolchain in the final image.

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/config/package.json ./packages/config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @beekal/api db:generate \
 && pnpm turbo build --filter=@beekal/api \
 && pnpm --filter @beekal/api --prod deploy /out

# ---------- runtime ----------
FROM node:24-alpine AS runner
ENV NODE_ENV=production
# dumb-init reaps zombies and forwards signals, so shutdown hooks actually run.
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs beekal
WORKDIR /app

COPY --from=build --chown=beekal:nodejs /out/node_modules ./node_modules
COPY --from=build --chown=beekal:nodejs /app/apps/api/dist ./dist
COPY --from=build --chown=beekal:nodejs /app/apps/api/prisma ./prisma

USER beekal
EXPOSE 4000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
