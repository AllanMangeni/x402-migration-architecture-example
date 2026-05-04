# Use official Bun runtime as specified in stage-1-brief.json for ElizaOS compatibility
FROM oven/bun:1.1 AS base
WORKDIR /app

# Install build dependencies for native module compilation (better-sqlite3)
# These are required to ensure robust handling of legacy database artifacts.
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies securely using Bun's high-performance package manager
COPY package.json ./
RUN bun install

# Copy source code
COPY . .

# Expose the service port for external observability and webhook delivery
EXPOSE 3001

# Start the application using the native Bun runtime for Stage One execution
CMD ["bun", "run", "src/index.ts"]
