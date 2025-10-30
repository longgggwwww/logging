// Keycloak configuration shared between services
export const keycloakConfig = {
  url: process.env.KEYCLOAK_URL || process.env.REACT_APP_KEYCLOAK_URL || 'https://keycloak.iit.vn',
  realm: process.env.KEYCLOAK_REALM || process.env.REACT_APP_KEYCLOAK_REALM || 'master',
  clientId: process.env.KEYCLOAK_CLIENT_ID || process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'api-log-monitoring',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET || 'KExgFbvftbzjJKkytIVaZiyf9fDjNw9w',
  frontendClientId: process.env.KEYCLOAK_FRONTEND_CLIENT_ID || process.env.REACT_APP_KEYCLOAK_FRONTEND_CLIENT_ID || 'api-log-monitoring',
};