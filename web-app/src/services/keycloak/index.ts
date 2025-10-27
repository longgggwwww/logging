import Keycloak from 'keycloak-js';
import type { KeycloakConfig, KeycloakAuthData } from './types';

// Cấu hình Keycloak - điều chỉnh theo môi trường của bạn
const keycloakConfig: any = {
  url: 'https://keycloak.iit.vn/',
  realm: process.env.KEYCLOAK_REALM || 'master',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'test-syslog',
  // CẢNH BÁO: Chỉ uncomment dòng dưới nếu client là Confidential
  // KHÔNG AN TOÀN cho production vì secret sẽ bị lộ trong browser
  // Nên đổi client thành Public Client trong Keycloak Admin Console
  // clientSecret: 'YOUR_CLIENT_SECRET_HERE', // Lấy từ Keycloak Clients > test-syslog > Credentials
};

let keycloakInstance: Keycloak | null = null;

/**
 * Khởi tạo Keycloak instance
 */
export const initKeycloak = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
};

/**
 * Khởi tạo và restore session từ localStorage nếu có
 */
export const initKeycloakWithSession = async (): Promise<boolean> => {
  const keycloak = initKeycloak();
  
  try {
    // Lấy token từ localStorage
    const token = localStorage.getItem('keycloak_token');
    const refreshToken = localStorage.getItem('keycloak_refresh_token');
    
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      // Restore token từ localStorage
      token: token || undefined,
      refreshToken: refreshToken || undefined,
      // Silent SSO disabled due to CSP issues
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });

    if (authenticated) {
      console.log('Keycloak session restored successfully');
      // Cập nhật lại token trong localStorage (có thể đã được refresh)
      if (keycloak.token) {
        localStorage.setItem('keycloak_token', keycloak.token);
      }
      if (keycloak.refreshToken) {
        localStorage.setItem('keycloak_refresh_token', keycloak.refreshToken);
      }
      
      // Setup auto refresh token
      setupTokenRefresh(keycloak);
    }

    return authenticated;
  } catch (error) {
    console.error('Keycloak session restore error:', error);
    return false;
  }
};

/**
 * Setup auto refresh token trước khi expire
 */
const setupTokenRefresh = (keycloak: Keycloak) => {
  // Refresh token mỗi 60 giây nếu còn dưới 70 giây
  setInterval(() => {
    keycloak.updateToken(70).then((refreshed) => {
      if (refreshed) {
        console.log('Token refreshed');
        // Cập nhật localStorage
        if (keycloak.token) {
          localStorage.setItem('keycloak_token', keycloak.token);
        }
        if (keycloak.refreshToken) {
          localStorage.setItem('keycloak_refresh_token', keycloak.refreshToken);
        }
      }
    }).catch(() => {
      console.error('Failed to refresh token');
      // Token refresh thất bại, có thể đã hết hạn
      // Clear storage và redirect về login
      localStorage.removeItem('keycloak_token');
      localStorage.removeItem('keycloak_refresh_token');
      localStorage.removeItem('keycloak_id_token');
    });
  }, 60000); // Check mỗi 60 giây
};

/**
 * Lấy Keycloak instance hiện tại
 */
export const getKeycloak = (): Keycloak | null => {
  return keycloakInstance;
};

/**
 * Đăng nhập với Keycloak OAuth2
 */
export const loginWithKeycloak = async () => {
  const keycloak = initKeycloak();
  
  try {
    const authenticated = await keycloak.init({
      onLoad: 'login-required',
      redirectUri: `${window.location.origin}/callback/keycloak`,
      checkLoginIframe: false,
    });

    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization error:', error);
    throw error;
  }
};

/**
 * Xử lý callback từ Keycloak
 */
export const handleKeycloakCallback = async (): Promise<KeycloakAuthData | null> => {
  const keycloak = initKeycloak();
  
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      redirectUri: `${window.location.origin}/callback/keycloak`,
      checkLoginIframe: false,
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
    console.error('Keycloak callback error:', error);
    throw error;
  }
};

/**
 * Đăng xuất local (chỉ xóa session trong app, không logout khỏi Keycloak server)
 */
export const logoutKeycloakLocal = () => {
  // Clear localStorage
  localStorage.removeItem('keycloak_token');
  localStorage.removeItem('keycloak_refresh_token');
  localStorage.removeItem('keycloak_id_token');
  
  // Clear Keycloak instance and token
  if (keycloakInstance) {
    keycloakInstance.clearToken();
  }
  keycloakInstance = null;
  
  console.log('Local session and Keycloak instance cleared. Keycloak SSO session still active.');
};

/**
 * Đăng xuất hoàn toàn khỏi Keycloak (logout cả SSO session)
 */
export const logoutKeycloakFull = () => {
  const keycloak = getKeycloak();
  
  if (keycloak && keycloak.authenticated) {
    // Clear localStorage trước khi logout
    localStorage.removeItem('keycloak_token');
    localStorage.removeItem('keycloak_refresh_token');
    localStorage.removeItem('keycloak_id_token');
    
    // Logout từ Keycloak với redirect URI hợp lệ
    const logoutUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
    const params = new URLSearchParams({
      post_logout_redirect_uri: window.location.origin + '/user/login',
      id_token_hint: keycloak.idToken || '',
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
 * Lấy thông tin user từ Keycloak token
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
      console.error('Failed to load user profile:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Format thông tin user cho dashboard
 */
export const formatUserForDashboard = (tokenParsed: any, profile?: any): API.CurrentUser => {
  const roles = tokenParsed?.realm_access?.roles || [];
  const isAdmin = roles.includes('admin') || roles.includes('realm-admin');
  
  return {
    name: profile?.firstName && profile?.lastName 
      ? `${profile.firstName} ${profile.lastName}` 
      : tokenParsed?.name || tokenParsed?.preferred_username || 'User',
    avatar: tokenParsed?.picture || 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
    userid: tokenParsed?.sub,
    email: profile?.email || tokenParsed?.email,
    signature: tokenParsed?.email || '',
    title: roles.join(', ') || 'User',
    group: tokenParsed?.realm || 'Default',
    access: isAdmin ? 'admin' : 'user',
    unreadCount: 0,
    notifyCount: 0,
  };
};

/**
 * Kiểm tra xem user đã đăng nhập qua Keycloak chưa
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
 * Làm mới token
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
      console.error('Token refresh error:', error);
      throw error;
    }
  }
  
  return null;
};
