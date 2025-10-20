# Hướng dẫn cấu hình Logout với Keycloak

## Lỗi "Invalid redirect uri" khi Logout

### Nguyên nhân:
Keycloak yêu cầu `post_logout_redirect_uri` phải được khai báo trong **Valid post logout redirect URIs** của Client settings.

## ✅ Giải pháp

### Bước 1: Cấu hình Keycloak Client

1. Đăng nhập **Keycloak Admin Console**: https://keycloak.iit.vn/
2. Chọn **Realm**: `master`
3. Menu **Clients** → Chọn `test-syslog`

### Bước 2: Cấu hình Logout Settings

Scroll xuống phần **Logout settings**:

**Valid post logout redirect URIs:**
```
http://localhost:8000
http://localhost:8000/*
http://localhost:8000/user/login
```

Nếu có production domain, thêm:
```
https://your-domain.com
https://your-domain.com/*
https://your-domain.com/user/login
```

Hoặc dùng wildcard (chỉ cho development):
```
*
```

### Bước 3: Cấu hình đầy đủ Client Settings

**Access Settings:**
```
Root URL: http://localhost:8000
Home URL: http://localhost:8000
Valid redirect URIs: 
  - http://localhost:8000/callback/keycloak
  - http://localhost:8000/*

Valid post logout redirect URIs:
  - http://localhost:8000
  - http://localhost:8000/user/login
  - http://localhost:8000/*

Web origins:
  - http://localhost:8000
  - * (cho development)
```

**Capability config:**
```
Client authentication: OFF ❌
Standard flow: ON ✓
Direct access grants: OFF ❌
```

### Bước 4: Save & Test

1. Click **Save**
2. Test logout trong app
3. Sẽ redirect về `/user/login` sau khi logout thành công

## Code Implementation

### Logout Flow

```typescript
logoutKeycloak() được gọi
  ↓
Clear localStorage:
  - keycloak_token
  - keycloak_refresh_token
  - keycloak_id_token
  ↓
Tạo logout URL với params:
  - post_logout_redirect_uri: http://localhost:8000/user/login
  - id_token_hint: <id_token>
  ↓
Redirect đến Keycloak logout endpoint
  ↓
Keycloak logout session
  ↓
Keycloak redirect về post_logout_redirect_uri
  ↓
User về trang /user/login
```

### Logout URL Format

```
https://keycloak.iit.vn/realms/master/protocol/openid-connect/logout
  ?post_logout_redirect_uri=http://localhost:8000/user/login
  &id_token_hint=<ID_TOKEN>
```

**Parameters:**
- `post_logout_redirect_uri`: URL để redirect sau logout (phải có trong Valid post logout redirect URIs)
- `id_token_hint`: ID token của user (optional nhưng recommended)

## Testing

### Test Logout:

1. Login vào app
2. Dashboard hiển thị user info
3. Click avatar → Click "退出登录"
4. ✓ Redirect đến Keycloak logout
5. ✓ Keycloak xử lý logout
6. ✓ Redirect về `/user/login`
7. ✓ LocalStorage đã clear
8. Reload page
9. ✓ Vẫn ở trang login (không auto-login)
10. Thử login lại
11. ✓ Phải nhập credentials (không SSO)

### Debug Logout:

```javascript
// Check localStorage trước logout
console.log('Before logout:');
console.log('Token:', localStorage.getItem('keycloak_token'));
console.log('Refresh:', localStorage.getItem('keycloak_refresh_token'));

// Sau khi logout, check lại
console.log('After logout:');
console.log('Token:', localStorage.getItem('keycloak_token')); // null
console.log('Refresh:', localStorage.getItem('keycloak_refresh_token')); // null
```

### Check Logout URL:

Trong Network tab của DevTools, khi click logout, bạn sẽ thấy redirect:
```
Request URL: https://keycloak.iit.vn/realms/master/protocol/openid-connect/logout
  ?post_logout_redirect_uri=http://localhost:8000/user/login
  &id_token_hint=eyJhbG...
```

## Troubleshooting

### Lỗi "Invalid redirect uri"

**Kiểm tra:**
1. Valid post logout redirect URIs có chứa URL logout không?
2. URL có khớp chính xác không? (bao gồm protocol, domain, port)
3. Keycloak client settings đã Save chưa?

**Giải pháp:**
- Thêm exact URL vào Valid post logout redirect URIs
- Hoặc dùng wildcard `*` cho development
- Ensure format: `http://localhost:8000/user/login`

### Logout thành công nhưng không redirect

**Kiểm tra:**
- `post_logout_redirect_uri` có đúng không?
- Network tab: có request đến logout endpoint không?
- Keycloak có CORS errors không?

**Giải pháp:**
- Check Web Origins trong Client settings
- Verify redirect URI format

### Session vẫn còn sau logout

**Nguyên nhân:**
- LocalStorage không được clear
- Keycloak session chưa terminate

**Giải pháp:**
```javascript
// Manual clear
localStorage.clear();
sessionStorage.clear();
```

### Logout loop (logout rồi auto-login lại)

**Nguyên nhân:**
- SSO session vẫn còn
- Check-SSO tự động login lại

**Giải pháp:**
- Ensure `post_logout_redirect_uri` đúng
- Keycloak phải terminate session
- Không dùng `onLoad: 'login-required'` cho trang login

## Production Checklist

### Keycloak Client Config:

- [ ] Client ID: Correct
- [ ] Client authentication: OFF (for SPA)
- [ ] Standard flow: ON
- [ ] Valid redirect URIs: Configured with production URLs
- [ ] Valid post logout redirect URIs: Configured with production URLs
- [ ] Web origins: Configured with production domain
- [ ] Front channel logout: ON (optional)

### Code Config:

- [ ] KEYCLOAK_URL: Production Keycloak URL
- [ ] KEYCLOAK_REALM: Correct realm
- [ ] KEYCLOAK_CLIENT_ID: Correct client ID
- [ ] Logout redirect: Production login page URL
- [ ] HTTPS enabled
- [ ] CORS configured

## Best Practices

1. **Always use exact URLs** trong Valid post logout redirect URIs (không dùng wildcard cho production)

2. **Include id_token_hint** trong logout request để Keycloak biết chính xác session cần terminate

3. **Clear localStorage** trước khi redirect để đảm bảo không có token cũ

4. **Test logout flow** kỹ trong cả development và production

5. **Handle errors gracefully** - nếu logout fail, vẫn clear local state

## Example Production Config

### Keycloak Client Settings:

```yaml
Client ID: web-app
Root URL: https://syslog.example.com
Valid redirect URIs:
  - https://syslog.example.com/callback/keycloak
  - https://syslog.example.com/*

Valid post logout redirect URIs:
  - https://syslog.example.com/user/login
  - https://syslog.example.com

Web origins:
  - https://syslog.example.com
```

### Environment Variables:

```bash
KEYCLOAK_URL=https://keycloak.example.com
KEYCLOAK_REALM=production
KEYCLOAK_CLIENT_ID=web-app
```

## Summary

Với configuration hiện tại:

✅ Logout URL được build đúng format
✅ LocalStorage được clear trước logout
✅ Redirect về `/user/login` sau logout
✅ Keycloak session được terminate
✅ Không còn auto-login sau logout

User experience:
- Click logout → Keycloak xử lý → Về trang login
- Clean logout (không còn tokens)
- Phải login lại để access app
