import { keycloakConfig } from "@/services/keycloak-config";
import Keycloak from "keycloak-js";
import type { KeycloakAuthData, KeycloakConfig } from "./types";

// Define local type for CurrentUser
interface CurrentUser {
  name: string;
  avatar: string;
  userid: string | undefined;
  email: string;
  signature: string;
  title: string;
  group: string;
  access: string;
  unreadCount: number;
  notifyCount: number;
}

// Keycloak configuration - adjust according to your environment
const kcConfig: KeycloakConfig = {
  url: keycloakConfig.url,
  realm: keycloakConfig.realm,
  clientId: keycloakConfig.publicClientId,
};

let keycloakInstance: Keycloak | null = null;
let tokenRefreshInterval: NodeJS.Timeout | null = null;

/**
 * Initialize Keycloak instance
 */
export const initKeycloak = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(kcConfig);
  }
  return keycloakInstance;
};

/**
 * Initialize and restore session from localStorage if available
 */
export const initKeycloakWithSession = async (): Promise<boolean> => {
  const keycloak = initKeycloak();

  try {
    // Get tokens from localStorage
    const token = localStorage.getItem("keycloak_token");
    const refreshToken = localStorage.getItem("keycloak_refresh_token");

    let authenticated = false;

    if (token && refreshToken) {
      authenticated = await keycloak.init({
        checkLoginIframe: false,
        token: token,
        refreshToken: refreshToken,
        scope: "openid profile email",
      });
    } else {
      authenticated = false;
    }

    if (authenticated) {
      // Update localStorage with possibly refreshed tokens
      if (keycloak.token) {
        localStorage.setItem("keycloak_token", keycloak.token);
      }
      if (keycloak.refreshToken) {
        localStorage.setItem("keycloak_refresh_token", keycloak.refreshToken);
      }

      // Setup auto refresh token
      setupTokenRefresh(keycloak);
    }

    return authenticated;
  } catch (error) {
    console.error("Keycloak session restore error:", error);
    return false;
  }
};

/**
 * Setup auto refresh token before expiration
 */
const setupTokenRefresh = (keycloak: Keycloak) => {
  // Clear any existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  // Refresh token every 60 seconds if less than 70 seconds remaining
  tokenRefreshInterval = setInterval(() => {
    keycloak
      .updateToken(70)
      .then((refreshed) => {
        if (refreshed) {
          // Update localStorage
          if (keycloak.token) {
            localStorage.setItem("keycloak_token", keycloak.token);
          }
          if (keycloak.refreshToken) {
            localStorage.setItem(
              "keycloak_refresh_token",
              keycloak.refreshToken
            );
          }
        }
      })
      .catch(() => {
        console.error("Failed to refresh token");
        // Token refresh failed, possibly expired
        // Clear storage and redirect to login
        localStorage.removeItem("keycloak_token");
        localStorage.removeItem("keycloak_refresh_token");
        localStorage.removeItem("keycloak_id_token");
      });
  }, 60000); // Check every 60 seconds
};

/**
 * Lấy Keycloak instance hiện tại
 */
export const getKeycloak = (): Keycloak | null => {
  return keycloakInstance;
};

/**
 * Login with Keycloak OAuth2
 */
export const loginWithKeycloak = async () => {
  const keycloak = initKeycloak();

  try {
    const authenticated = await keycloak.init({
      onLoad: "login-required",
      redirectUri: `${window.location.origin}/callback/keycloak`,
      checkLoginIframe: false,
      scope: "openid profile email",
    });

    return authenticated;
  } catch (error) {
    console.error("Keycloak initialization error:", error);
    throw error;
  }
};

/**
 * Xử lý callback từ Keycloak
 */
export const handleKeycloakCallback =
  async (): Promise<KeycloakAuthData | null> => {
    const keycloak = initKeycloak();

    try {
      const authenticated = await keycloak.init({
        onLoad: "check-sso",
        redirectUri: `${window.location.origin}/callback/keycloak`,
        checkLoginIframe: false,
        scope: "openid profile email",
      });

      if (authenticated && keycloak.token) {
        // Setup auto refresh token
        setupTokenRefresh(keycloak);

        return {
          token: keycloak.token,
          refreshToken: keycloak.refreshToken,
          idToken: keycloak.idToken,
          userInfo: keycloak.tokenParsed,
        };
      }

      return null;
    } catch (error) {
      console.error("Keycloak callback error:", error);
      throw error;
    }
  };

/**
 * Logout locally (clears session in app, not from Keycloak server)
 */
export const logoutKeycloakLocal = () => {
  // Clear localStorage
  localStorage.removeItem("keycloak_token");
  localStorage.removeItem("keycloak_refresh_token");
  localStorage.removeItem("keycloak_id_token");

  // Clear Keycloak instance and token
  if (keycloakInstance) {
    keycloakInstance.clearToken();
  }
  keycloakInstance = null;

  // Clear token refresh interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
};

/**
 * Fully logout from Keycloak (logout SSO session)
 */
export const logoutKeycloakFull = () => {
  const keycloak = getKeycloak();

  if (keycloak && keycloak.authenticated) {
    // Clear localStorage trước khi logout
    localStorage.removeItem("keycloak_token");
    localStorage.removeItem("keycloak_refresh_token");
    localStorage.removeItem("keycloak_id_token");

    // Logout từ Keycloak với redirect URI hợp lệ
    const logoutUrl = `${kcConfig.url}/realms/${kcConfig.realm}/protocol/openid-connect/logout`;
    const params = new URLSearchParams({
      post_logout_redirect_uri: window.location.origin + "/user/login",
      id_token_hint: keycloak.idToken || "",
    });

    // Redirect đến logout endpoint
    window.location.href = `${logoutUrl}?${params.toString()}`;
  }
};

/**
 * Alias cho local logout (mặc định)
 */
export const logoutKeycloak = logoutKeycloakLocal;

/**
 * Get user info from Keycloak token
 */
export const getKeycloakUserInfo = () => {
  const keycloak = getKeycloak();

  if (keycloak && keycloak.authenticated && keycloak.tokenParsed) {
    return {
      username: keycloak.tokenParsed.preferred_username,
      email: keycloak.tokenParsed.email,
      name: keycloak.tokenParsed.name,
      roles: keycloak.tokenParsed.realm_access?.roles || [],
    };
  }

  return null;
};

/**
 * Load user profile từ Keycloak server
 */
export const loadKeycloakUserProfile = async () => {
  const keycloak = getKeycloak();

  if (keycloak && keycloak.authenticated) {
    try {
      const profile = await keycloak.loadUserProfile();
      return profile;
    } catch (error) {
      console.error("Failed to load user profile:", error);
      return null;
    }
  }

  return null;
};

/**
 * Format user info for dashboard
 */
export const formatUserForDashboard = (
  tokenParsed: Keycloak.KeycloakTokenParsed | undefined,
  profile?: Keycloak.KeycloakProfile | null
): API.CurrentUser => {
  const roles = tokenParsed?.realm_access?.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("realm-admin");

  return {
    name:
      profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : tokenParsed?.name || tokenParsed?.preferred_username || "User",
    avatar:
      tokenParsed?.picture ||
      "https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png",
    userid: tokenParsed?.sub || "",
    email: profile?.email || tokenParsed?.email || "",
    signature: tokenParsed?.email || "",
    title: roles.join(", ") || "User",
    group: tokenParsed?.realm || "Default",
    tags: [], // Default empty
    notifyCount: 0,
    unreadCount: 0,
    country: "Vietnam", // Default
    geographic: {
      province: { label: "", key: "" },
      city: { label: "", key: "" },
    },
    address: "",
    phone: "",
  };
};

/**
 * Check if user is logged in via Keycloak
 */
export const isKeycloakAuthenticated = (): boolean => {
  const keycloak = getKeycloak();
  return !!(keycloak && keycloak.authenticated);
};

/**
 * Lấy access token hiện tại
 */
export const getAccessToken = (): string | undefined => {
  const keycloak = getKeycloak();
  return keycloak?.token;
};

/**
 * Refresh token
 */
export const refreshKeycloakToken = async (minValidity: number = 30) => {
  const keycloak = getKeycloak();

  if (keycloak && keycloak.authenticated) {
    try {
      const refreshed = await keycloak.updateToken(minValidity);
      if (refreshed) {
        return keycloak.token;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }

  return null;
};
