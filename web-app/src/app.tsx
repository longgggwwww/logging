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
      // Thử restore Keycloak session từ localStorage
      const authenticated = await initKeycloakWithSession();
      
      if (authenticated) {
        const keycloak = getKeycloak();
        if (keycloak && keycloak.tokenParsed) {
          // Lấy thông tin user từ Keycloak
          const profile = await loadKeycloakUserProfile();
          const currentUser = formatUserForDashboard(keycloak.tokenParsed, profile);
          console.log('User from Keycloak (restored):', currentUser);
          return currentUser;
        }
      }

      // Nếu không có Keycloak (không thể restore session), không gọi API ngoài
      // vì việc lấy user hiện được thực hiện qua Keycloak.
      console.log('No Keycloak session restored; skipping external currentUser fetch');
      return undefined;
    } catch (_error) {
      // Nếu có lỗi và không phải trang login, redirect
      if (history.location.pathname !== loginPath) {
        history.push(loginPath);
      }
    }
    return undefined;
  };
  
  // 如果不是登录页面，执行
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
      // Nếu không đăng nhập, redirect đến login
      if (!isKeycloakAuthenticated() && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    ...initialState?.settings,
  };
};

export const request: RequestConfig = {
  // Request interceptor - tự động thêm Keycloak token
  requestInterceptors: [
    (config: any) => {
      // Lấy token từ Keycloak nếu có
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
