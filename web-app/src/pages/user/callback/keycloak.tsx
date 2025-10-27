import { Spin } from 'antd';
import { useEffect } from 'react';
import { history, useModel } from '@umijs/max';
import { handleKeycloakCallback, formatUserForDashboard, loadKeycloakUserProfile } from '@/services/keycloak';
import { flushSync } from 'react-dom';

const KeycloakCallback: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const authData = await handleKeycloakCallback();

        if (authData && authData.token) {
          // Lưu token vào localStorage
          localStorage.setItem('keycloak_token', authData.token);
          if (authData.refreshToken) {
            localStorage.setItem('keycloak_refresh_token', authData.refreshToken);
          }
          if (authData.idToken) {
            localStorage.setItem('keycloak_id_token', authData.idToken);
          }

          // Lấy thông tin user chi tiết
          const userInfo = authData.userInfo;
          if (userInfo) {
            // Load thêm profile từ Keycloak (nếu cần)
            const profile = await loadKeycloakUserProfile();
            
            // Format user info cho dashboard
            const currentUser = formatUserForDashboard(userInfo, profile);

            // Cập nhật state
            flushSync(() => {
              setInitialState((s) => ({
                ...s,
                currentUser,
              }));
            });

            console.log('Keycloak user logged in:', currentUser);
          }

          // Redirect về trang chính hoặc trang được yêu cầu
          const urlParams = new URL(window.location.href).searchParams;
          const redirect = urlParams.get('redirect') || '/list';
          history.push(redirect);
        } else {
          // Nếu không có token, redirect về trang login
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
