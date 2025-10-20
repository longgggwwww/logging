# Keycloak Session Management

## Tổng quan

Hệ thống đã được cải thiện để **giữ session** sau khi reload trang bằng cách:

1. ✅ Lưu tokens vào `localStorage`
2. ✅ Tự động restore session khi load trang
3. ✅ Auto-refresh token trước khi expire
4. ✅ Silent SSO check
5. ✅ Handle token expiration

## Cách hoạt động

### 1. Đăng nhập lần đầu

```
User login → Keycloak auth → Callback
  ↓
Save tokens to localStorage:
  - keycloak_token (access token)
  - keycloak_refresh_token
  - keycloak_id_token
  ↓
Setup auto-refresh timer (every 60s)
  ↓
User info displayed in dashboard
```

### 2. Reload trang / Mở tab mới

```
App loads → getInitialState()
  ↓
initKeycloakWithSession() được gọi
  ↓
Kiểm tra localStorage có tokens?
  ├─ Yes: Restore session từ tokens
  │   ↓
  │   Keycloak.init({
  │     token: localStorage.getItem('keycloak_token'),
  │     refreshToken: localStorage.getItem('keycloak_refresh_token')
  │   })
  │   ↓
  │   Session restored ✓
  │   ↓
  │   Load user info từ token
  │   ↓
  │   Display dashboard với user info
  │
  └─ No: Redirect to login
```

### 3. Auto Token Refresh

```
Timer chạy mỗi 60 giây
  ↓
Check: Token còn < 70 giây?
  ├─ Yes: Refresh token
  │   ↓
  │   keycloak.updateToken(70)
  │   ↓
  │   Success: Update localStorage với token mới
  │   ↓
  │   Continue session
  │
  └─ No: Token còn valid, không làm gì
```

### 4. Token Expired

```
Refresh failed
  ↓
Clear localStorage
  ↓
Clear user state
  ↓
Redirect to login
```

## Cấu hình Token Lifetime trong Keycloak

### Để session kéo dài lâu hơn:

1. Vào Keycloak Admin Console
2. Chọn Realm → `master`
3. **Realm Settings** → **Tokens** tab

**Các thông số quan trọng:**

```
Access Token Lifespan: 5 minutes (300s)
  → Token API sẽ expire sau 5 phút
  
Refresh Token Max Reuse: 0
  → Refresh token chỉ dùng được 1 lần
  
SSO Session Idle: 30 minutes
  → Session idle timeout (không hoạt động)
  
SSO Session Max: 10 hours
  → Session tối đa (kể cả có hoạt động)
  
Client Session Idle: 30 minutes
  → Client session timeout
  
Client Session Max: 10 hours
  → Client session tối đa
```

### Khuyến nghị cho Production:

```yaml
Access Token Lifespan: 5-15 minutes
SSO Session Idle: 30 minutes - 2 hours
SSO Session Max: 8-12 hours
Refresh Token:
  - Lifespan: Same as SSO Session
  - Reuse: 0 (security)
```

### Khuyến nghị cho Development:

```yaml
Access Token Lifespan: 15 minutes (để test dễ)
SSO Session Idle: 8 hours
SSO Session Max: 12 hours
```

## Kiểm tra Session

### Trong Browser Console:

```javascript
// Kiểm tra tokens
console.log('Access Token:', localStorage.getItem('keycloak_token'));
console.log('Refresh Token:', localStorage.getItem('keycloak_refresh_token'));

// Decode token (không verify)
const token = localStorage.getItem('keycloak_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expires at:', new Date(payload.exp * 1000));
  console.log('Time left:', (payload.exp * 1000 - Date.now()) / 1000, 'seconds');
}
```

### Check Keycloak instance:

```javascript
// Trong component
import { getKeycloak } from '@/services/keycloak';

const keycloak = getKeycloak();
if (keycloak) {
  console.log('Authenticated:', keycloak.authenticated);
  console.log('Token:', keycloak.token);
  console.log('Token parsed:', keycloak.tokenParsed);
}
```

## Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│                      APP LOAD                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Check Route    │
         └────────┬───────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
Login/Callback          Protected Route
Route                         │
│                             ▼
│                   ┌─────────────────────┐
│                   │ initKeycloakWith    │
│                   │ Session()           │
│                   └──────────┬──────────┘
│                              │
│                   ┌──────────┴──────────┐
│                   │                     │
│                   ▼                     ▼
│            Has Token?              No Token
│                Yes                     │
│                 │                      │
│                 ▼                      ▼
│          ┌─────────────┐         ┌─────────┐
│          │ Restore     │         │ Redirect│
│          │ Session     │         │ to Login│
│          └──────┬──────┘         └─────────┘
│                 │
│                 ▼
│          ┌─────────────┐
│          │ Load User   │
│          │ Info        │
│          └──────┬──────┘
│                 │
│                 ▼
│          ┌─────────────┐
│          │ Setup Auto  │
│          │ Refresh     │
│          └──────┬──────┘
│                 │
└─────────────────┴─────────────────┐
                                    ▼
                          ┌──────────────────┐
                          │ Display Dashboard│
                          └──────────────────┘
```

## Troubleshooting

### Session bị mất sau khi reload

**Kiểm tra:**
1. Console có lỗi gì không?
2. LocalStorage có tokens không?
   ```javascript
   console.log(localStorage.getItem('keycloak_token'));
   ```
3. Token đã expire chưa?
4. Network tab: có request refresh token không?

**Giải pháp:**
- Clear cache và cookies
- Clear localStorage
- Login lại
- Kiểm tra Keycloak session settings

### Auto-refresh không hoạt động

**Kiểm tra:**
1. Console có log "Token refreshed" không?
2. Refresh token còn valid không?
3. Keycloak server có accessible không?

**Giải pháp:**
- Check SSO Session Max trong Keycloak
- Verify refresh token trong localStorage
- Check network requests

### "Invalid token" error

**Nguyên nhân:**
- Token đã expire
- Token signature không hợp lệ
- Keycloak realm/client config thay đổi

**Giải pháp:**
```javascript
// Clear và login lại
localStorage.clear();
window.location.href = '/user/login';
```

### Session timeout quá nhanh

**Cấu hình lại Keycloak:**
1. Tăng `SSO Session Idle`
2. Tăng `SSO Session Max`
3. Tăng `Access Token Lifespan` (nhưng không quá 15 phút)

## Testing

### Test session persistence:

1. Login vào app
2. Kiểm tra dashboard hiển thị user info
3. **Reload trang** (F5 hoặc Ctrl+R)
4. ✓ Dashboard vẫn hiển thị user info (không redirect login)
5. **Mở tab mới** với cùng URL
6. ✓ User vẫn logged in
7. **Đợi 5 phút** (để token expire)
8. ✓ Token tự động refresh, session vẫn giữ
9. **Đóng browser và mở lại**
10. ✓ Session vẫn còn (nếu chưa quá SSO Session Max)

### Test logout:

1. Click logout
2. ✓ Redirect về Keycloak logout
3. ✓ Redirect về login page
4. ✓ LocalStorage đã clear
5. Reload trang
6. ✓ Vẫn ở trang login (không auto-login)

## Best Practices

1. **Token Security**
   - Không log token ra console trong production
   - Sử dụng HTTPS
   - Set appropriate token lifetimes

2. **Session Management**
   - Monitor token expiration
   - Handle refresh gracefully
   - Clear tokens on logout

3. **Error Handling**
   - Catch and log errors
   - Provide user feedback
   - Fallback to login page

4. **Performance**
   - Don't refresh too frequently
   - Use silent SSO check
   - Minimize API calls

## Summary

Với implementation hiện tại:

✅ Session được lưu trong localStorage
✅ Auto-restore session khi reload
✅ Auto-refresh token every 60 seconds
✅ Handle token expiration gracefully
✅ Support multiple tabs
✅ Persist session across browser restarts (trong thời gian SSO Session Max)

User experience:
- Login một lần
- Không bị logout khi reload
- Token tự động refresh
- Chỉ phải login lại khi:
  - Manually logout
  - Session idle quá lâu
  - Session max timeout
