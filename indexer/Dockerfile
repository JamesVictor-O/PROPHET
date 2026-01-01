# Multi-stage build for Envio Indexer
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files (exclude generated to avoid optional dependency issues)
COPY package.json pnpm-lock.yaml ./

# Install root dependencies
RUN pnpm install --frozen-lockfile

# Now copy and install generated dependencies
COPY generated/package.json generated/
# We don't have pnpm-lock.yaml in generated yet, so just install
WORKDIR /app/generated
RUN pnpm install

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files first
COPY package.json pnpm-lock.yaml ./

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated/node_modules ./generated/node_modules

# Copy source files
COPY . .

# Force install envio binary for linux-x64 platform if needed
# With pnpm, this might be handled better, but let's ensure it
RUN echo "Installing envio binary..." && \
    pnpm add envio@2.30.1 --save-exact && \
    echo "Verifying envio installation..." && \
    ./node_modules/.bin/envio --version

# Run codegen to generate types
RUN pnpm run codegen

# Compile TypeScript handlers
RUN pnpm run build

# Copy compiled JS files back to src so relative imports to ../generated work
RUN cp build/src/*.js src/

# Fix start script in generated package.json to use node instead of ts-node
# This is a safety measure in case codegen reverts it
RUN sed -i 's/"start": "ts-node src\/Index.res.js"/"start": "node src\/Index.res.js"/' generated/package.json

# Production stage
FROM base AS runner
WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/package.json ./
COPY --from=builder /app/config.yaml ./
COPY --from=builder /app/schema.graphql ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Set environment variables
ENV NODE_ENV=production
ENV TUI_OFF=true

# Expose port (if needed for health checks)
EXPOSE 8080
ENV ENVIO_INDEXER_PORT=8080

# Start the indexer
CMD ["pnpm", "start"]
