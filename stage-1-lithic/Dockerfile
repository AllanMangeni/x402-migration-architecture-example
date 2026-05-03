# Use official Bun runtime as base image per AGENTS.md requirements
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Stage 1 specifically targets port 3001
EXPOSE 3001

# Start the service using Bun
CMD ["bun", "run", "src/index.ts"]
