# Use Node.js official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port nếu cần (ví dụ: 3000 cho web)
EXPOSE 3000

# Start app (có thể cần chỉnh lại cho phù hợp framework)
CMD ["npm", "start"]
