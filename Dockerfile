# ---------- 1. Install dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- 2. Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept and set at build time
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

RUN npm run build

# ---------- 3. Production image ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV USE_HTTPS=false
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
# Copy only required files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]


#docker build --build-arg NEXT_PUBLIC_BASE_URL=http://<your-ip>:3000 -t myapp .