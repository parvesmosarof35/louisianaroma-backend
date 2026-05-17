# --- Stage 1: Build & Compile ---
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Install openssl for Prisma engine compiler
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Copy package configurations and prisma schemas
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all packages (including development packages for compilation)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application codebase
COPY . .

# Generate Prisma Client typings
RUN pnpm prisma generate

# Compile the production bundle
RUN pnpm build

# Prune development packages to minimize final container footprint
RUN pnpm prune --prod


# --- Stage 2: Runtime Runner ---
FROM node:20-slim AS runner

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install runtime OpenSSL dependencies for Prisma query engines
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Copy compiled assets, production modules, and configuration from builder
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/prisma ./prisma

# Expose luxury server listening port
EXPOSE 5000

# Start NestJS application
CMD ["node", "dist/main"]
