# Multi-stage build for Envio Indexer
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY generated/package*.json ./generated/

# Install root dependencies
RUN npm ci

# Install generated dependencies
WORKDIR /app/generated
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy all files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/generated/node_modules ./generated/node_modules
COPY . .

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

