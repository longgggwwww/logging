FROM node:20-alpine AS builder

WORKDIR /app

# copy package files first for npm install caching
COPY package*.json ./

# Prefer npm ci when lockfile is available, fall back to npm install
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --production=false --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# copy rest of sources and build
COPY . .

# Set build arguments
ARG API_BASE_URL
ARG KEYCLOAK_SERVER_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_API_CLIENT_ID
ARG KEYCLOAK_PUBLIC_CLIENT_ID
ARG KEYCLOAK_CLIENT_SECRET

# Set environment variables for build
ENV NODE_ENV=production
ENV API_BASE_URL=${API_BASE_URL:-http://localhost:3000}
ENV KEYCLOAK_SERVER_URL=${KEYCLOAK_SERVER_URL}
ENV KEYCLOAK_REALM=${KEYCLOAK_REALM:-master}
ENV KEYCLOAK_API_CLIENT_ID=${KEYCLOAK_API_CLIENT_ID:-api-service}
ENV KEYCLOAK_PUBLIC_CLIENT_ID=${KEYCLOAK_PUBLIC_CLIENT_ID:-web-app-client}
ENV KEYCLOAK_CLIENT_SECRET=${KEYCLOAK_CLIENT_SECRET:-keycloak-client-secret}

RUN npm run build

FROM nginx:stable-alpine

# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static files from builder (ant-design-pro uses `dist`)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (expects `nginx.conf` at project root)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]