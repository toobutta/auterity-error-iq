# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY src/frontend/package.json src/frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend code
COPY src/frontend/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package.json and package-lock.json
COPY --from=build /app/package.json /app/package-lock.json ./

# Install production dependencies only
RUN npm ci --production

# Copy build output from build stage
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port the app will run on
EXPOSE 8080

# Start the application
CMD ["npm", "start"]