# Multi-stage production Dockerfile for Agent Mesh Sim XR
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Development stage
FROM base AS development
RUN npm ci --include=dev
COPY . .
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build

# Install all dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install production system dependencies
RUN apk add --no-cache \
    dumb-init \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /app/index.html ./
COPY --from=build --chown=nextjs:nodejs /app/src ./src

# Create necessary directories with proper permissions
RUN mkdir -p /app/logs /app/data /app/backups && \
    chown -R nextjs:nodejs /app/logs /app/data /app/backups

# Copy production configuration
COPY --chown=nextjs:nodejs deployment/production/config/ ./config/

# Health check script
COPY --chown=nextjs:nodejs deployment/production/healthcheck.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV WS_PORT=8080

# Expose ports
EXPOSE 3000 8080

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Multi-architecture support
FROM production AS production-amd64
# AMD64 specific optimizations if needed

FROM production AS production-arm64  
# ARM64 specific optimizations if needed

# Final stage selection based on target architecture
FROM production AS final