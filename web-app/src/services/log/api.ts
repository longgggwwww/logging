import { request } from '@umijs/max';
import { getAccessToken } from '@/services/keycloak';
import { keycloakConfig } from '@/services/keycloak-config';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Client credentials config (read from env). WARNING: placing client secret in
// frontend bundle is insecure. Prefer a server-side proxy when possible.
const KC_URL = keycloakConfig.url;
const KC_REALM = keycloakConfig.realm;
const KC_CLIENT_ID = keycloakConfig.apiClientId;
const KC_CLIENT_SECRET = keycloakConfig.clientSecret;

// In-module cache for client credentials token
let clientToken: { token: string; expiresAt: number } | null = null;

async function fetchClientCredentialsToken(): Promise<string | null> {
  // If client secret not provided, skip
  if (!KC_CLIENT_ID || !KC_CLIENT_SECRET) return null;

  const now = Date.now();
  if (clientToken && clientToken.expiresAt - 5000 > now) {
    return clientToken.token;
  }

  try {
    const tokenUrl = `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/token`;
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', KC_CLIENT_ID);
    body.append('client_secret', KC_CLIENT_SECRET);

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      console.error('Failed to fetch client credentials token', await res.text());
      return null;
    }

    const data = await res.json();
    if (data && data.access_token) {
      const expiresIn = data.expires_in || 300;
      clientToken = {
        token: data.access_token,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      return clientToken.token;
    }
  } catch (err) {
    console.error('Error obtaining client credentials token', err);
  }

  return null;
}

// Small wrapper that injects Authorization header when a Keycloak token exists.
// If no user token is present, will attempt client-credentials flow (if configured).
async function apiRequest<T = any>(endpoint: string, options: any = {}) {
  // Prefer user token (interactive login). If not available and client creds
  // are configured, use client credentials token.
  let token = getAccessToken();
  if (!token) {
    token = await fetchClientCredentialsToken() || undefined;
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return request<T>(endpoint, {
    ...options,
    headers,
  });
}

export async function getLogs(params: LOG.LogListParams) {
  return apiRequest<LOG.LogListResponse>(`${API_BASE_URL}/v1/logs`, {
    method: 'GET',
    params,
  });
}

export async function getProjects(params?: { expand?: string }) {
  return apiRequest<LOG.ProjectListResponse>(`${API_BASE_URL}/v1/projects`, {
    method: 'GET',
    params,
  });
}

export async function getProjectFunctions(projectId: string) {
  return apiRequest<LOG.FunctionListResponse>(`${API_BASE_URL}/v1/projects/${projectId}/functions`, {
    method: 'GET',
  });
}

export async function getFunctions() {
  return apiRequest<LOG.FunctionListResponse>(`${API_BASE_URL}/v1/functions`, {
    method: 'GET',
  });
}
