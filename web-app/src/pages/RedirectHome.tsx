import { useEffect, useState } from 'react';
import { history, useModel } from '@umijs/max';
import { isKeycloakAuthenticated, initKeycloakWithSession } from '@/services/keycloak';

export default () => {
  const { initialState } = useModel('@@initialState');
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Thực hiện một lần: nếu có fetchUserInfo thì gọi để restore session trước
    const doRedirect = async () => {
      if (hasRedirected) return;

      console.log('RedirectHome: start redirect flow', {
        initialStateExists: !!initialState,
        hasFetch: !!(initialState && (initialState as any).fetchUserInfo),
      });

      try {
        if (initialState && typeof (initialState as any).fetchUserInfo === 'function') {
          console.log('RedirectHome: calling initialState.fetchUserInfo()');
          await (initialState as any).fetchUserInfo();
        } else {
          // Nếu runtime không cung cấp fetchUserInfo (route với layout:false có thể không khởi tạo),
          // cố gắng restore Keycloak session trực tiếp
          console.log('RedirectHome: no fetchUserInfo, calling initKeycloakWithSession() fallback');
          try {
            await initKeycloakWithSession();
          } catch (err) {
            console.warn('RedirectHome: initKeycloakWithSession failed', err);
          }
        }
      } catch (e) {
        // fetchUserInfo có thể tự redirect hoặc throw — chỉ log và tiếp tục
        console.warn('RedirectHome: fetchUserInfo threw', e);
      }

      const isAuth = isKeycloakAuthenticated();
      console.log('RedirectHome: isKeycloakAuthenticated ->', isAuth);

      const go = (to: string) => {
        try {
          history.push(to);
        } catch (_err) {
          // Fallback to full page redirect nếu history không hoạt động
          window.location.href = to;
        }
      };

      if (isAuth) {
        console.log('RedirectHome: User authenticated, redirecting to /list');
        go('/list');
        setHasRedirected(true);
        return;
      }

      console.log('RedirectHome: No authentication, redirecting to /user/login');
      go('/user/login');
      setHasRedirected(true);

      // Safety fallback: nếu sau 2s vẫn chưa redirect (edge case), force full redirect
      setTimeout(() => {
        if (!hasRedirected) {
          const fallback = isKeycloakAuthenticated() ? '/list' : '/user/login';
          console.warn('RedirectHome: fallback redirect to', fallback);
          window.location.href = fallback;
        }
      }, 2000);
    };

    doRedirect();
    // chỉ chạy khi component mount hoặc khi initialState đổi
  }, [initialState, hasRedirected]);

  // Nếu đã redirect, hiển thị loading
  if (hasRedirected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Redirecting...
      </div>
    );
  }

  // Trong khi chờ fetch/restore session, hiển thị một placeholder (không redirect ngay lập tức)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>
  );
};