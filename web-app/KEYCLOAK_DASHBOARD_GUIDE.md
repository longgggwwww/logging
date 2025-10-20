# Hướng dẫn sử dụng Keycloak trong Dashboard

## Tổng quan

Sau khi tích hợp Keycloak OAuth2, hệ thống web-app đã có khả năng:

1. ✅ Đăng nhập qua Keycloak
2. ✅ Lấy thông tin user từ Keycloak và hiển thị trong dashboard
3. ✅ Tự động attach Bearer token vào tất cả API requests
4. ✅ Logout từ Keycloak
5. ✅ Refresh token tự động

## Luồng hoạt động

### 1. Đăng nhập

```
User click "使用 Keycloak 登录"
  ↓
loginWithKeycloak() được gọi
  ↓
Redirect đến Keycloak login page
  ↓
User nhập credentials
  ↓
Keycloak validate
  ↓
Redirect về /callback/keycloak với authorization code
  ↓
handleKeycloakCallback() xử lý code
  ↓
Exchange code để lấy tokens (access_token, refresh_token, id_token)
  ↓
Lưu tokens vào localStorage
  ↓
Load user profile từ Keycloak
  ↓
Format user info cho dashboard (formatUserForDashboard)
  ↓
Cập nhật initialState với currentUser
  ↓
Redirect về /welcome (hoặc trang được yêu cầu)
  ↓
Dashboard hiển thị thông tin user
```

### 2. Hiển thị thông tin User trong Dashboard

Sau khi đăng nhập, thông tin user được lấy từ Keycloak bao gồm:

- **Name**: Tên đầy đủ từ firstName + lastName hoặc từ token
- **Avatar**: Ảnh đại diện (mặc định nếu không có)
- **Email**: Email của user
- **User ID**: Subject ID từ Keycloak
- **Roles**: Các roles được gán trong Keycloak
- **Access Level**: 'admin' hoặc 'user' dựa trên roles

```typescript
// Ví dụ currentUser object
{
  name: "John Doe",
  avatar: "https://...",
  userid: "123e4567-e89b-12d3-a456-426614174000",
  email: "john@example.com",
  signature: "john@example.com",
  title: "admin, user",
  group: "master",
  access: "admin",
  unreadCount: 0,
  notifyCount: 0
}
```

### 3. API Requests với Token

Tất cả API requests tự động có Bearer token:

```typescript
// Request interceptor tự động thêm header
{
  headers: {
    Authorization: `Bearer ${keycloak_token}`
  }
}
```

Backend API sẽ nhận được token và có thể:
- Verify token với Keycloak
- Lấy thông tin user từ token
- Kiểm tra permissions/roles

### 4. Logout

```
User click "退出登录"
  ↓
Kiểm tra isKeycloakAuthenticated()
  ↓
Nếu là Keycloak user:
  ├─ Xóa tokens từ localStorage
  ├─ Clear initialState
  └─ logoutKeycloak() - redirect về Keycloak logout endpoint
     └─ Keycloak logout và redirect về app homepage
```

## Sử dụng trong Code

### Kiểm tra user đã đăng nhập

```typescript
import { useModel } from '@umijs/max';

const YourComponent = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  
  if (!currentUser) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {currentUser.name}!</h1>
      <p>Email: {currentUser.email}</p>
      <p>Access Level: {currentUser.access}</p>
    </div>
  );
};
```

### Lấy Access Token

```typescript
import { getAccessToken } from '@/services/keycloak';

const token = getAccessToken();
console.log('Current token:', token);
```

### Gọi API với Token

```typescript
import { request } from '@umijs/max';

// Token tự động được thêm vào header
const response = await request('/api/some-endpoint', {
  method: 'GET',
});
```

### Kiểm tra Roles

```typescript
const { currentUser } = initialState || {};

const isAdmin = currentUser?.access === 'admin';
const userRoles = currentUser?.title?.split(', ') || [];

if (userRoles.includes('admin')) {
  // Show admin features
}
```

## Cấu hình Backend API

Backend cần verify Keycloak token:

### Option 1: Verify với Keycloak Public Key

```javascript
// Node.js Express example
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://keycloak.iit.vn/realms/master/protocol/openid-connect/certs'
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  jwt.verify(token, getKey, {
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}

app.use('/api', verifyToken);
```

### Option 2: Token Introspection

```javascript
const axios = require('axios');

async function introspectToken(token) {
  const response = await axios.post(
    'https://keycloak.iit.vn/realms/master/protocol/openid-connect/token/introspect',
    new URLSearchParams({
      token: token,
      client_id: 'test-syslog',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data.active;
}
```

## Troubleshooting

### Token expired
Token sẽ tự động refresh khi gần hết hạn. Nếu cần refresh thủ công:

```typescript
import { refreshKeycloakToken } from '@/services/keycloak';

const newToken = await refreshKeycloakToken(30);
```

### User info không hiển thị
1. Kiểm tra console log xem có errors
2. Verify token còn valid
3. Check Keycloak client scopes có bật profile, email

### CORS errors
Đảm bảo Keycloak client có đúng Web Origins

### 401 Unauthorized
- Token đã expire
- Backend không verify đúng token
- Keycloak public key không khớp

## Testing

### Test flow đăng nhập

1. Mở http://localhost:8000/user/login
2. Click "使用 Keycloak 登录"
3. Đăng nhập với Keycloak credentials
4. Xác nhận redirect về dashboard
5. Kiểm tra user info hiển thị đúng ở góc phải trên
6. Click vào avatar, xem menu dropdown
7. Test logout

### Kiểm tra token

```javascript
// Trong browser console
const token = localStorage.getItem('keycloak_token');
console.log('Token:', token);

// Decode token (không verify)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
```

## Best Practices

1. **Không hardcode credentials** trong code
2. **Sử dụng HTTPS** trong production
3. **Set token lifetime** hợp lý (5-15 phút cho access token)
4. **Implement token refresh** logic
5. **Validate token** ở backend cho mọi protected endpoints
6. **Log errors** để debug dễ dàng
7. **Handle token expiration** gracefully

## Migration từ Login thông thường

Nếu bạn đang dùng login cũ và muốn chuyển sang Keycloak:

1. User có thể dùng cả 2 phương thức login
2. Keycloak user sẽ có thông tin được lấy từ Keycloak
3. Normal user sẽ lấy từ API backend thông thường
4. Logout sẽ tự động detect và dùng đúng phương thức

## Support

Nếu có vấn đề, kiểm tra:
- Keycloak server có đang chạy
- Client configuration đúng
- Network requests trong DevTools
- Console logs
- Token trong localStorage
