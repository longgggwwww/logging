// Type definitions for Keycloak integration

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  clientSecret?: string;
}

export interface KeycloakUserInfo {
  sub?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  realm_access?: {
    roles: string[];
  };
}

export interface KeycloakAuthData {
  token: string;
  refreshToken?: string;
  idToken?: string;
  userInfo?: KeycloakUserInfo;
}

export interface KeycloakLoginOptions {
  redirectUri?: string;
  scope?: string;
  prompt?: string;
}

