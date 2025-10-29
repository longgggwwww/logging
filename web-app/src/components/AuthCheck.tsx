import React, { useEffect } from 'react';
import { history } from '@umijs/max';
import { isKeycloakAuthenticated } from '@/services/keycloak';

interface AuthCheckProps {
  children: React.ReactNode;
}

const AuthCheck: React.FC<AuthCheckProps> = ({ children }) => {
  const isAuth = isKeycloakAuthenticated();
  const isLoginPath = window.location.pathname === '/user/login';

  useEffect(() => {
    if (!isAuth && !isLoginPath) {
      history.push('/user/login');
    }
  }, [isAuth, isLoginPath]);

  if (!isAuth && !isLoginPath) {
    return null;
  }

  return <>{children}</>;
};

export default AuthCheck;