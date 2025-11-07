import Keycloak, { KeycloakConfig } from "keycloak-connect";
import { conf } from "./config.js";

// ============================================
// KEYCLOAK INSTANCE
// ============================================
// Create Keycloak instance
// For bearer-only APIs we don't require an express session store; keycloak-connect can be
// used to validate bearer tokens without persisting sessions.
export const keycloak = new Keycloak({}, {
  "bearer-only": true,
  "auth-server-url": conf.keycloak.url,
  realm: conf.keycloak.realm,
  resource: conf.keycloak.clientId,
} as KeycloakConfig);

export function keycloakMiddleware() {
  return keycloak.middleware();
}
