# Developer Platform Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install required packages
RUN apk update && apk upgrade && \
    apk add --no-cache curl python3 make g++ zip && \
    npm install -g openapi-generator-cli

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S devplatform -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=devplatform:nodejs /app/dist ./dist
COPY --from=builder --chown=devplatform:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=devplatform:nodejs /app/package.json ./

# Create directories
RUN mkdir -p /app/sdks /app/templates /app/docs && \
    chown -R devplatform:nodejs /app/sdks /app/templates /app/docs

# Copy templates
COPY --chown=devplatform:nodejs templates/ ./templates/

# Switch to non-root user
USER devplatform

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
