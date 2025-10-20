# Hướng dẫn cấu hình Keycloak OAuth2

## 1. Cài đặt và khởi động Keycloak

### Sử dụng Docker:
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

Truy cập Keycloak Admin Console tại: http://localhost:8080

## 2. Cấu hình Realm

1. Đăng nhập vào Admin Console với username: `admin`, password: `admin`
2. Tạo một Realm mới hoặc sử dụng Realm `master` mặc định

## 3. Tạo Client cho Web App

1. Trong Realm của bạn, vào **Clients** > **Create Client**
2. Điền thông tin:
   - **Client ID**: `web-app`
   - **Name**: Web Application
   - **Description**: Syslog Web Application
   - Click **Next**

3. **Capability config**:
   - **Client authentication**: OFF (public client)
   - **Authorization**: OFF
   - **Standard flow**: ON ✓
   - **Direct access grants**: OFF
   - Click **Next**

4. **Login settings**:
   - **Root URL**: `http://localhost:8000` (hoặc URL của web-app)
   - **Home URL**: `http://localhost:8000`
   - **Valid redirect URIs**: 
     - `http://localhost:8000/callback/keycloak`
     - `http://localhost:8000/*`
   - **Valid post logout redirect URIs**: `http://localhost:8000`
   - **Web origins**: `http://localhost:8000`
   - Click **Save**

## 4. Tạo User để test

1. Vào **Users** > **Add user**
2. Điền:
   - **Username**: `testuser`
   - **Email**: `testuser@example.com`
   - **First name**: Test
   - **Last name**: User
   - **Email verified**: ON ✓
3. Click **Create**

4. Vào tab **Credentials**
5. Click **Set password**
6. Điền password: `password123`
7. **Temporary**: OFF
8. Click **Save**

## 5. Cấu hình Web App

1. Tạo file `.env` trong thư mục `web-app`:
```bash
cp .env.example .env
```

2. Cập nhật file `.env`:
```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_ID=web-app
```

## 6. Khởi động Web App

```bash
cd web-app
npm install
npm run dev
```

Truy cập: http://localhost:8000/user/login

## 7. Test đăng nhập

1. Click nút **"使用 Keycloak 登录"** (Login with Keycloak)
2. Bạn sẽ được redirect đến trang đăng nhập Keycloak
3. Nhập username: `testuser`, password: `password123`
4. Sau khi đăng nhập thành công, bạn sẽ được redirect về `/callback/keycloak`
5. Token sẽ được xử lý và lưu vào localStorage
6. Bạn sẽ được redirect về trang chính

## 8. Cấu hình nâng cao

### Thêm Roles và Permissions

1. Trong Realm, vào **Realm roles** > **Create role**
2. Tạo các role như: `admin`, `user`, `viewer`
3. Vào **Users** > Chọn user > **Role mapping**
4. Assign roles cho user

### Cấu hình Token Lifetime

1. Vào **Realm settings** > **Tokens**
2. Điều chỉnh:
   - **Access Token Lifespan**: 5 minutes (mặc định)
   - **Refresh Token Lifespan**: 30 minutes
   - **SSO Session Idle**: 30 minutes
   - **SSO Session Max**: 10 hours

### Cấu hình cho Production

Trong production, cập nhật:
- **Valid redirect URIs**: `https://yourdomain.com/callback/keycloak`
- **Web origins**: `https://yourdomain.com`
- **Root URL**: `https://yourdomain.com`
- Sử dụng HTTPS cho Keycloak server

## 9. Xử lý lỗi thường gặp

### Invalid redirect_uri
- Kiểm tra lại **Valid redirect URIs** trong Client settings
- Đảm bảo URL chính xác bao gồm cả protocol (http/https)

### CORS errors
- Kiểm tra **Web origins** trong Client settings
- Thêm origin của web-app

### Token expired
- Token sẽ tự động refresh nếu còn valid refresh token
- Implement token refresh logic trong application

## 10. API Integration

Token từ Keycloak có thể được sử dụng để authenticate với backend APIs:

```typescript
// Lấy token từ localStorage
const token = localStorage.getItem('keycloak_token');

// Gửi request với Authorization header
fetch('http://api-service:3000/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

Backend API cần verify token với Keycloak public key hoặc sử dụng introspection endpoint.
