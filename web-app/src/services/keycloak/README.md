# Keycloak Service

Service này cung cấp các hàm tiện ích để tích hợp OAuth2 authentication với Keycloak.

## Cài đặt

```bash
npm install keycloak-js
```

## Cấu hình

Tạo file `.env.local` trong thư mục gốc của web-app:

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=web-app
```

## Sử dụng

### Đăng nhập với Keycloak

```typescript
import { loginWithKeycloak } from '@/services/keycloak';

const handleLogin = async () => {
  try {
    await loginWithKeycloak();
    // User sẽ được redirect đến trang login của Keycloak
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Xử lý Callback

Callback được xử lý tự động tại route `/callback/keycloak`. Token và thông tin user sẽ được lưu vào localStorage.

### Lấy thông tin User

```typescript
import { getKeycloakUserInfo } from '@/services/keycloak';

const userInfo = getKeycloakUserInfo();
console.log(userInfo);
// {
//   username: 'testuser',
//   email: 'test@example.com',
//   name: 'Test User',
//   roles: ['admin', 'user']
// }
```

### Đăng xuất

```typescript
import { logoutKeycloak } from '@/services/keycloak';

logoutKeycloak();
// User sẽ được redirect về trang chủ sau khi logout
```

### Refresh Token

```typescript
import { refreshKeycloakToken } from '@/services/keycloak';

// Refresh token nếu sắp hết hạn (trong vòng 30 giây)
const newToken = await refreshKeycloakToken(30);
if (newToken) {
  console.log('Token refreshed successfully');
}
```

## API Reference

### `initKeycloak(): Keycloak`
Khởi tạo Keycloak instance.

### `getKeycloak(): Keycloak | null`
Lấy Keycloak instance hiện tại.

### `loginWithKeycloak(): Promise<boolean>`
Bắt đầu flow đăng nhập OAuth2 với Keycloak.

### `handleKeycloakCallback(): Promise<KeycloakAuthData | null>`
Xử lý callback từ Keycloak sau khi đăng nhập thành công.

Returns:
```typescript
{
  token: string;
  refreshToken?: string;
  idToken?: string;
  userInfo?: KeycloakUserInfo;
}
```

### `logoutKeycloak(): void`
Đăng xuất khỏi Keycloak.

### `getKeycloakUserInfo(): object | null`
Lấy thông tin user từ token.

Returns:
```typescript
{
  username: string;
  email: string;
  name: string;
  roles: string[];
}
```

### `refreshKeycloakToken(minValidity?: number): Promise<string | null>`
Làm mới access token.

Parameters:
- `minValidity`: Số giây tối thiểu còn lại trước khi token hết hạn (mặc định: 30)

## Flow Diagram

```
User clicks "Login with Keycloak"
         ↓
loginWithKeycloak() is called
         ↓
Redirect to Keycloak login page
         ↓
User enters credentials
         ↓
Keycloak validates credentials
         ↓
Redirect to /callback/keycloak with auth code
         ↓
handleKeycloakCallback() processes the code
         ↓
Exchange code for tokens
         ↓
Save tokens to localStorage
         ↓
Update user info in app state
         ↓
Redirect to main page
```

## Token Storage

Tokens được lưu trong localStorage với các keys:
- `keycloak_token`: Access token
- `keycloak_refresh_token`: Refresh token
- `keycloak_id_token`: ID token

## Security Notes

1. **HTTPS trong Production**: Luôn sử dụng HTTPS cho cả web-app và Keycloak server trong môi trường production.

2. **Token Expiration**: Access token có thời hạn ngắn (thường 5 phút). Implement logic để refresh token tự động.

3. **Secure Storage**: Trong production, cân nhắc sử dụng các phương pháp lưu trữ token an toàn hơn thay vì localStorage.

4. **CORS Configuration**: Đảm bảo Keycloak được cấu hình đúng Web Origins để tránh CORS errors.

## Troubleshooting

### Invalid redirect_uri error
- Kiểm tra Valid Redirect URIs trong Keycloak Client settings
- Đảm bảo URL khớp chính xác (bao gồm protocol, domain, port, và path)

### CORS errors
- Thêm origin của web-app vào Web Origins trong Keycloak Client settings

### Token không được refresh
- Kiểm tra Refresh Token Lifespan trong Realm settings
- Đảm bảo refresh token chưa hết hạn

### User info không có
- Kiểm tra Client Scopes trong Keycloak
- Đảm bảo các scopes cần thiết (profile, email) được bật
