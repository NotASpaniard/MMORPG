# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set environment variables (can be overridden)
ENV NODE_ENV=production

# Start the bot
CMD ["npm", "start"]
