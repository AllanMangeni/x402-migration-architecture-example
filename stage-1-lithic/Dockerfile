# Use official Node.js runtime for robust native module support
FROM node:20 AS base
WORKDIR /app

# Install build dependencies for native module compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies securely using npm
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the service port
EXPOSE 3001

# Start the application using tsx for reliable ESM execution
CMD ["npx", "tsx", "src/index.ts"]
