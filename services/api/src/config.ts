// ============================================
// CONFIGURATION
// ============================================
export const conf = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  cacheTtl: 300, // 5 minutes
  defaultTake: 50,
  maxTake: 1000,
  // Keycloak settings (for bearer-only protection)
  keycloak: {
    url:
      process.env.KEYCLOAK_URL || "http://keycloak:8080",
    realm: process.env.KEYCLOAK_REALM || "master",
    clientId: process.env.KEYCLOAK_BE_CLIENT_ID || "keycloak-backend-client-id",
    bearerOnly: true,
  },
  mongo: {
    url: process.env.MONGO_URL || "mongodb://localhost:27017/logs",
  },
} as const;
