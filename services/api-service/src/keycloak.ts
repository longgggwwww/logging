import Keycloak from "keycloak-connect";

// Keycloak configuration derived from environment variables
export const KEYCLOAK_CONFIG = {
  realm: process.env.KEYCLOAK_REALM || "master",
  "auth-server-url": process.env.KEYCLOAK_AUTH_URL || "http://localhost:8080/auth",
  resource: process.env.KEYCLOAK_CLIENT_ID || "api-service",
  "bearer-only": true,
} as const;

// Create Keycloak instance
// For bearer-only APIs we don't require an express session store; keycloak-connect can be
// used to validate bearer tokens without persisting sessions.
export const keycloak = new Keycloak({}, KEYCLOAK_CONFIG as any);

// Convenience: middleware to mount onto Express
export function keycloakMiddleware() {
  return keycloak.middleware();
}
