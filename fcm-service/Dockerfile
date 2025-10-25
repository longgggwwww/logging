FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port (if needed, but this service doesn't listen on a port)
# EXPOSE 3000

# Start the application
CMD ["node", "index.js"]