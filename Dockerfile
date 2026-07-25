FROM node:22-alpine AS frontend-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY --from=frontend-deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 supercampus
COPY --from=frontend-builder --chown=supercampus:nodejs /app/public ./frontend/public
COPY --from=frontend-builder --chown=supercampus:nodejs /app/.next/standalone ./frontend
COPY --from=frontend-builder --chown=supercampus:nodejs /app/.next/static ./frontend/.next/static
COPY --from=backend-deps --chown=supercampus:nodejs /app/backend/node_modules ./backend/node_modules
COPY --chown=supercampus:nodejs backend/package.json ./backend/package.json
COPY --chown=supercampus:nodejs backend/src ./backend/src
COPY --chown=supercampus:nodejs scripts/start-production.mjs ./scripts/start-production.mjs
USER supercampus
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=8s --start-period=30s --retries=3 CMD node -e "Promise.all([fetch('http://127.0.0.1:3000/'),fetch('http://127.0.0.1:3000/api/health')]).then(rs=>{if(rs.some(r=>!r.ok))process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "scripts/start-production.mjs"]