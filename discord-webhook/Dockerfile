FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port (not needed for this service, but good practice)
# EXPOSE 3000

# Start the application
CMD ["npm", "start"]