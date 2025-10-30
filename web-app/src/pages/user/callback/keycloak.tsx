import { Spin } from 'antd';
import { useEffect } from 'react';
import { history, useModel } from '@umijs/max';
import { handleKeycloakCallback, formatUserForDashboard, loadKeycloakUserProfile } from '@/services/keycloak';
import { flushSync } from 'react-dom';

const KeycloakCallback: React.FC = () => {
  const { setInitialState } = useModel('@@initialState');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const authData = await handleKeycloakCallback();

        if (authData?.token) {
          // Save token to localStorage
          localStorage.setItem('keycloak_token', authData.token);
          if (authData.refreshToken) {
            localStorage.setItem('keycloak_refresh_token', authData.refreshToken);
          }
          if (authData.idToken) {
            localStorage.setItem('keycloak_id_token', authData.idToken);
          }

          // Get detailed user info
          const userInfo = authData.userInfo;
          if (userInfo) {
            // Load additional profile from Keycloak (if needed)
            const profile = await loadKeycloakUserProfile();
            
            // Format user info for dashboard
            const currentUser = formatUserForDashboard(userInfo, profile);

            // Update state
            flushSync(() => {
              setInitialState((s) => ({
                ...s,
                currentUser,
              }));
            });

            console.log('Keycloak user logged in:', currentUser);
          }

          // Redirect to main page or requested page
          const urlParams = new URL(window.location.href).searchParams;
          const redirect = urlParams.get('redirect') || '/list';
          history.push(redirect);
        } else {
          // If no token, redirect to login page
          history.push('/user/login');
        }
      } catch (error) {
        console.error('Keycloak callback processing error:', error);
        history.push('/user/login?error=keycloak_auth_failed');
      }
    };

    processCallback();
  }, [setInitialState]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Spin size="large" tip="Đang xử lý đăng nhập..." />
    </div>
  );
};

export default KeycloakCallback;
