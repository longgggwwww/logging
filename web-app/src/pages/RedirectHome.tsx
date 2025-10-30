import { useEffect, useState } from 'react';
import { history, useModel } from '@umijs/max';
import { isKeycloakAuthenticated, initKeycloakWithSession } from '@/services/keycloak';

export default () => {
  const { initialState } = useModel('@@initialState');
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Execute once: if fetchUserInfo exists, call to restore session first
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
          // If runtime does not provide fetchUserInfo (routes with layout:false may not initialize),
          // try to restore Keycloak session directly
          console.log('RedirectHome: no fetchUserInfo, calling initKeycloakWithSession() fallback');
          try {
            await initKeycloakWithSession();
          } catch (err) {
            console.warn('RedirectHome: initKeycloakWithSession failed', err);
          }
        }
      } catch (e) {
        // fetchUserInfo may redirect or throw — just log and continue
        console.warn('RedirectHome: fetchUserInfo threw', e);
      }

      const isAuth = isKeycloakAuthenticated();
      console.log('RedirectHome: isKeycloakAuthenticated ->', isAuth);

      const go = (to: string) => {
        try {
          history.push(to);
        } catch (_err) {
          // Fallback to full page redirect if history does not work
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

      // Safety fallback: if not redirected after 2s (edge case), force full redirect
      setTimeout(() => {
        if (!hasRedirected) {
          const fallback = isKeycloakAuthenticated() ? '/list' : '/user/login';
          console.warn('RedirectHome: fallback redirect to', fallback);
          window.location.href = fallback;
        }
      }, 2000);
    };

    doRedirect();
    // only run when component mounts or initialState changes
  }, [initialState, hasRedirected]);

  // If already redirected, show loading
  if (hasRedirected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Redirecting...
      </div>
    );
  }

  // While waiting for fetch/restore session, show a placeholder (do not redirect immediately)
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Loading...
    </div>
  );
};