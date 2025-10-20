import { KeyOutlined } from '@ant-design/icons';
import {
  FormattedMessage,
  Helmet,
  SelectLang,
  useIntl,
} from '@umijs/max';
import { App, Button, Card } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';
import { Footer } from '@/components';
import { loginWithKeycloak } from '@/services/keycloak';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    content: {
      flex: '1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 0',
    },
    card: {
      minWidth: 320,
      maxWidth: 480,
      width: '100%',
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const Login: React.FC = () => {
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const handleKeycloakLogin = async () => {
    try {
      await loginWithKeycloak();
    } catch (error) {
      console.error('Keycloak login error:', error);
      message.error(
        intl.formatMessage({
          id: 'pages.login.keycloak.failure',
          defaultMessage: 'Đăng nhập Keycloak thất bại!',
        })
      );
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <Lang />
      <div className={styles.content}>
        <Card className={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img 
              alt="logo" 
              src="/logo.svg" 
              style={{ 
                height: 44,
                marginBottom: 16,
              }}
            />
            <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
              {Settings.title || 'Ant Design'}
            </h1>
            <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
              {intl.formatMessage({
                id: 'pages.layouts.userLayout.title',
                defaultMessage: 'Ant Design 是西湖区最具影响力的 Web 设计规范',
              })}
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<KeyOutlined />}
            onClick={handleKeycloakLogin}
            block
            style={{
              height: 48,
              fontSize: 16,
            }}
          >
            <FormattedMessage
              id="pages.login.keycloak"
              defaultMessage="使用 Keycloak 登录"
            />
          </Button>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
