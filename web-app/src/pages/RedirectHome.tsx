import { useEffect } from 'react';
import { history } from 'umi';
import { isKeycloakAuthenticated } from '@/services/keycloak';

export default () => {
  useEffect(() => {
    if (isKeycloakAuthenticated()) {
      history.push('/list');
    } else {
      history.push('/user/login');
    }
  }, []);

  return null;
};