FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
# The pnpm version pinned in package.json (packageManager).
RUN corepack enable

# ── deps ─────────────────────────────────────────────────────────────────────
# Manifest + lockfile first → the install layer stays cached as long as the
# dependencies do not change.
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── builder ──────────────────────────────────────────────────────────────────
# `pnpm build` fetches the fonts first (scripts/prepare.mjs). No database
# needed: the pages are rendered per request.
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# The public address is baked in at build time: the live preview's refresh
# talks to it (repository variable).
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── runner ───────────────────────────────────────────────────────────────────
# The standalone server alone – no pnpm, no dev dependencies.
FROM node:22-alpine AS runner
WORKDIR /app
# ffmpeg: a still from every uploaded video (media/video.ts).
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# /data/media: the mount point of the media volume (uploads). It must exist in
# the image and belong to nextjs – a named volume takes over the mount
# point's ownership when first mounted.
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
 && mkdir -p /data/media && chown nextjs:nodejs /data/media
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# The share previews' fonts (scripts/prepare.mjs) – read, not served.
COPY --from=builder --chown=nextjs:nodejs /app/og-fonts ./og-fonts
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
