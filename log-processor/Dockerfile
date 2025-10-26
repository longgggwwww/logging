FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY . .

# Expose port for Prisma Studio (optional)
EXPOSE 5555

# Start application
CMD ["node", "index.js"]
