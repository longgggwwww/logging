FROM node:20-alpine AS builder

WORKDIR /app

# copy package files first for npm install caching
COPY package*.json ./

# Prefer npm ci when lockfile is available, fall back to npm install
RUN if [ -f package-lock.json ]; then npm ci --production=false --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# copy rest of sources and build
COPY . .
ARG REACT_APP_API_BASE_URL
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT_ID
ENV NODE_ENV=production
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV KEYCLOAK_URL=$KEYCLOAK_URL
ENV KEYCLOAK_REALM=$KEYCLOAK_REALM
ENV KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID
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