FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/platform/package.json ./apps/platform/package.json
COPY modules/crm/package.json ./modules/crm/package.json
COPY modules/academics/package.json ./modules/academics/package.json
COPY modules/admissions/package.json ./modules/admissions/package.json
COPY modules/attendance/package.json ./modules/attendance/package.json
COPY modules/documents/package.json ./modules/documents/package.json
COPY modules/examinations/package.json ./modules/examinations/package.json
COPY modules/fees/package.json ./modules/fees/package.json
COPY modules/gatepass/package.json ./modules/gatepass/package.json
COPY modules/hostel/package.json ./modules/hostel/package.json
COPY modules/library/package.json ./modules/library/package.json
COPY modules/placement/package.json ./modules/placement/package.json
COPY modules/transport/package.json ./modules/transport/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/module-sdk/package.json ./packages/module-sdk/package.json
COPY packages/runtime/package.json ./packages/runtime/package.json
COPY packages/state/package.json ./packages/state/package.json
COPY packages/testing/package.json ./packages/testing/package.json
COPY packages/ui/package.json ./packages/ui/package.json
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/platform/node_modules ./apps/platform/node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=/api
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 supercampus
COPY --from=builder --chown=supercampus:nodejs /app/apps/platform/.next/standalone ./
COPY --from=builder --chown=supercampus:nodejs /app/apps/platform/public ./apps/platform/public
COPY --from=builder --chown=supercampus:nodejs /app/apps/platform/.next/static ./apps/platform/.next/static
USER supercampus
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=8s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "apps/platform/server.js"]