# Use official Bun runtime as specified in stage-1-brief.json for ElizaOS compatibility
FROM oven/bun:1.1 AS base
WORKDIR /app

# Install dependencies using Bun
# Note: Native build tools are no longer required as better-sqlite3 has been removed.
COPY package.json ./
RUN bun install

# Copy source code
COPY . .

# Expose the service port
EXPOSE 3001

# Start the application using the native Bun runtime
CMD ["bun", "run", "src/index.ts"]
