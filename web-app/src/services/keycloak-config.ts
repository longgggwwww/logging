export const keycloakConfig = {
  url: process.env.KEYCLOAK_SERVER_URL  || 'keycloak-server-url',
  realm: process.env.KEYCLOAK_REALM || 'master',
  apiClientId: process.env.KEYCLOAK_API_CLIENT_ID || 'api-service',
  publicClientId: process.env.KEYCLOAK_PUBLIC_CLIENT_ID || 'web-app-client',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'keycloak-client-secret',
};
