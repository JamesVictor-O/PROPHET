# Multi-stage build for Envio Indexer
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files (exclude generated to avoid optional dependency issues)
COPY package*.json ./

# Install root dependencies (omit optional to skip generated dependency)
# postinstall script is conditional and won't fail if generated doesn't exist
RUN npm ci --omit=optional

# Now copy and install generated dependencies
COPY generated/package*.json ./generated/
WORKDIR /app/generated
RUN npm install --production=false --legacy-peer-deps

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated/node_modules ./generated/node_modules

# Copy source files
COPY . .

# Force install envio binary for linux-x64 platform
# Railway uses --ignore-scripts in deps stage, so we need to reinstall envio with scripts enabled
RUN echo "Checking for envio binary..." && \
    (ls -la node_modules/envio/bin/ 2>/dev/null && echo "Binary found!") || \
    (echo "Binary not found, reinstalling envio with scripts enabled..." && \
     npm install envio@2.30.1 --no-save --ignore-scripts=false 2>&1 | tail -20 && \
     echo "Checking after reinstall..." && \
     ls -la node_modules/envio/bin/ 2>/dev/null || \
     (echo "ERROR: envio binary still not found after reinstall!" && exit 1))

# Run codegen to generate types
RUN npm run codegen

# Production stage
FROM base AS runner
WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/config.yaml ./
COPY --from=builder /app/schema.graphql ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./

# Set environment variables
ENV NODE_ENV=production
ENV TUI_OFF=true

# Expose port (if needed for health checks)
EXPOSE 8080

# Start the indexer
CMD ["npm", "start"]

