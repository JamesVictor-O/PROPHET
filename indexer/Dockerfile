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
# Railway uses --ignore-scripts, so we need to explicitly install the binary here
RUN echo "Checking for envio binary..." && \
    ls -la node_modules/envio/bin/ 2>/dev/null || echo "bin directory not found" && \
    echo "Installing envio binary..." && \
    cd node_modules/envio && \
    npm run postinstall 2>&1 | head -30 || \
    (echo "postinstall failed, trying npm install..." && npm install --no-save --ignore-scripts=false 2>&1 | head -30) || \
    (echo "npm install failed, trying rebuild..." && npm rebuild 2>&1 | head -30) || \
    (echo "All methods failed, checking what's in bin..." && ls -la bin/ || echo "bin directory missing") && \
    echo "Final check:" && \
    ls -la bin/ 2>/dev/null || (echo "ERROR: envio binary still not found!" && exit 1)

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

