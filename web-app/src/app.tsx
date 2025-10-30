import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
} from '@/components';
import { 
  getKeycloak, 
  formatUserForDashboard, 
  loadKeycloakUserProfile,
  getAccessToken,
  initKeycloakWithSession,
  isKeycloakAuthenticated 
} from '@/services/keycloak';
import defaultSettings from '../config/defaultSettings';
import '@ant-design/v5-patch-for-react-19';

const loginPath = '/user/login';

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      // Try to restore Keycloak session from localStorage
      const authenticated = await initKeycloakWithSession();
      
      if (authenticated) {
        const keycloak = getKeycloak();
        if (keycloak?.tokenParsed) {
          // Get user info from Keycloak
          const profile = await loadKeycloakUserProfile();
          const currentUser = formatUserForDashboard(keycloak.tokenParsed, profile);
          console.log('User from Keycloak (restored):', currentUser);
          return currentUser;
        }
      }

      // If no Keycloak (cannot restore session), do not call external API
      // because user fetching is done via Keycloak.
      console.log('No Keycloak session restored; skipping external currentUser fetch');
      return undefined;
    } catch (_error) {
      // If error and not login page, redirect
      if (history.location.pathname !== loginPath) {
        history.push(loginPath);
      }
    }
    return undefined;
  };
  
  // If not login page, execute
  const { location } = history;
  if (
    ![loginPath, '/callback/keycloak'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState: _setInitialState,
}) => {
  return {
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // If not logged in, redirect to login
      if (!isKeycloakAuthenticated() && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    ...initialState?.settings,
  };
};

export const request: RequestConfig = {
  // Request interceptor - automatically add Keycloak token
  requestInterceptors: [
    (config: any) => {
      // Get token from Keycloak if available
      const token = getAccessToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],
};
