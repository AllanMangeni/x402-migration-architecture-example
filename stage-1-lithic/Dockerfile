# Use official Node.js runtime for legacy compatibility (better-sqlite3 requires full V8 support)
FROM node:20-slim AS base
WORKDIR /app

# Install build dependencies for native module compilation (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies using npm
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the service port
EXPOSE 3001

# Start the application using tsx for seamless TypeScript execution
CMD ["npx", "tsx", "src/index.ts"]
