// ============================================
// CONFIGURATION
// ============================================
export const CONFIG = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  cacheTtl: 300, // 5 minutes
  defaultTake: 50,
  maxTake: 1000,
  // Keycloak settings (for bearer-only protection)
  keycloak: {
    realm: process.env.KEYCLOAK_REALM || "master",
    authServerUrl:
      process.env.KEYCLOAK_AUTH_URL || "http://localhost:8080/auth",
    clientId: process.env.KEYCLOAK_CLIENT_ID || "api-service",
    bearerOnly: true,
  },
} as const;
