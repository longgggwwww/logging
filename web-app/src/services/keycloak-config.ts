export const keycloakConfig = {
  url: process.env.KEYCLOAK_URL  || 'keycloak-server-url',
  realm: process.env.KEYCLOAK_REALM || 'master',
  keycloak_BE_client_ID: process.env.KEYCLOAK_BE_CLIENT_ID || 'api-service',
  keycloak_FE_client_ID: process.env.KEYCLOAK_FE_CLIENT_ID || 'web-app-client',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'keycloak-client-secret',
};

console.log('Keycloak Configuration:', {
  url: keycloakConfig.url,
  realm: keycloakConfig.realm,
  apiClientId: keycloakConfig.keycloak_BE_client_ID,
  publicClientId: keycloakConfig.keycloak_FE_client_ID,
});
