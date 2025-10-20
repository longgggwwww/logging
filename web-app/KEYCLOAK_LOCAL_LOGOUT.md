# Local Logout vs Full Logout

## Tổng quan

Hệ thống hỗ trợ 2 loại logout:

### 1. **Local Logout** (Mặc định) ✓
- Xóa tokens khỏi localStorage
- Clear session trong app
- Redirect về trang login
- **KHÔNG logout khỏi Keycloak SSO session**
- User vẫn đăng nhập ở Keycloak server

### 2. **Full Logout**
- Xóa tokens khỏi localStorage
- Clear session trong app
- Logout khỏi Keycloak SSO session
- Redirect về trang login
- User phải nhập lại credentials

## Cách hoạt động

### Local Logout (logoutKeycloakLocal)

```
User click "退出登录"
  ↓
Clear localStorage:
  - keycloak_token
  - keycloak_refresh_token
  - keycloak_id_token
  ↓
Clear Keycloak instance token
  ↓
Clear user state trong app
  ↓
Redirect về /user/login
  ↓
KHÔNG gọi Keycloak logout endpoint
  ↓
Keycloak SSO session vẫn còn active
```

**Kết quả:**
- User logout khỏi app
- Nếu login lại → Tự động login (SSO) không cần nhập password
- Keycloak session vẫn còn cho các apps khác

### Full Logout (logoutKeycloakFull)

```
User action trigger full logout
  ↓
Clear localStorage
  ↓
Clear Keycloak instance
  ↓
Gọi Keycloak logout endpoint
  ↓
Keycloak terminate SSO session
  ↓
Redirect về /user/login
```

**Kết quả:**
- User logout hoàn toàn
- Nếu login lại → Phải nhập username/password
- Keycloak session bị terminate

## Use Cases

### Khi nào dùng Local Logout?

✅ **Single Sign-On (SSO) scenario:**
- User dùng nhiều apps cùng Keycloak realm
- Logout khỏi 1 app nhưng vẫn logged in ở apps khác
- Tính năng "Remember me" tự động

✅ **Better UX:**
- User không cần nhập password lại
- Nhanh chóng re-login
- Tiện lợi cho development

✅ **Multi-tab scenario:**
- User có nhiều tabs cùng app
- Logout 1 tab nhưng tabs khác vẫn hoạt động
- Re-login nhanh chóng

### Khi nào dùng Full Logout?

✅ **Security-critical scenarios:**
- Shared computers
- Public computers
- End of work session

✅ **Compliance requirements:**
- Banking apps
- Healthcare apps
- Government systems

✅ **Explicit logout:**
- User muốn logout hoàn toàn
- End SSO session cho tất cả apps

## Implementation

### Current Setup (Local Logout)

```typescript
// services/keycloak/index.ts
export const logoutKeycloakLocal = () => {
  localStorage.removeItem('keycloak_token');
  localStorage.removeItem('keycloak_refresh_token');
  localStorage.removeItem('keycloak_id_token');
  
  if (keycloakInstance) {
    keycloakInstance.clearToken();
  }
};

// Mặc định dùng local logout
export const logoutKeycloak = logoutKeycloakLocal;
```

### Nếu muốn dùng Full Logout

Đổi trong `/src/services/keycloak/index.ts`:

```typescript
// Thay đổi alias để dùng full logout
export const logoutKeycloak = logoutKeycloakFull;
```

### Hoặc cho user chọn

Thêm menu dropdown:

```tsx
const menuItems = [
  {
    key: 'logout-local',
    icon: <LogoutOutlined />,
    label: '退出登录 (保留SSO)',
  },
  {
    key: 'logout-full',
    icon: <LogoutOutlined />,
    label: '完全退出登录',
    danger: true,
  },
];

const onMenuClick = (event) => {
  if (event.key === 'logout-local') {
    logoutKeycloakLocal();
    history.push('/user/login');
  }
  if (event.key === 'logout-full') {
    logoutKeycloakFull(); // Sẽ tự redirect
  }
};
```

## Testing

### Test Local Logout:

1. **Login vào app**
   - Vào http://localhost:8000/user/login
   - Click "使用 Keycloak 登录"
   - Nhập credentials
   - Dashboard hiển thị user info ✓

2. **Logout (Local)**
   - Click avatar → "退出登录"
   - Redirect về /user/login ✓
   - Console log: "Local session cleared. Keycloak SSO session still active."

3. **Re-login (SSO)**
   - Click "使用 Keycloak 登录" lại
   - **KHÔNG cần nhập password** ✓
   - Tự động redirect về dashboard ✓
   - SSO hoạt động!

4. **Check localStorage**
   ```javascript
   // Sau logout
   console.log(localStorage.getItem('keycloak_token')); // null
   
   // Sau re-login (SSO)
   console.log(localStorage.getItem('keycloak_token')); // có token mới
   ```

### Test Full Logout (nếu dùng):

1. Login vào app
2. Trigger full logout
3. Re-login → **Phải nhập password** ✓
4. SSO session đã bị terminate

### Test Multi-tab:

**Local Logout:**
1. Mở 2 tabs cùng app
2. Logout ở tab 1
3. Tab 2 vẫn hoạt động (đến khi reload)
4. Re-login tab 1 → SSO tự động ✓

**Full Logout:**
1. Mở 2 tabs cùng app
2. Full logout ở tab 1
3. Tab 2 reload → cũng bị logout ✓

## Ưu/Nhược điểm

### Local Logout

**Ưu điểm:**
- ✅ UX tốt hơn (không cần nhập password lại)
- ✅ Nhanh chóng
- ✅ Hỗ trợ SSO tốt
- ✅ Tiện cho development
- ✅ Multi-app scenario

**Nhược điểm:**
- ❌ Kém bảo mật hơn (SSO session còn)
- ❌ Không phù hợp shared computers
- ❌ Compliance issues có thể

### Full Logout

**Ưu điểm:**
- ✅ Bảo mật cao
- ✅ Complete session termination
- ✅ Phù hợp sensitive data
- ✅ Compliance requirements

**Nhược điểm:**
- ❌ UX kém hơn (phải nhập password lại)
- ❌ Chậm hơn
- ❌ Logout tất cả apps (có thể không mong muốn)

## Best Practices

### Development:
```typescript
// Dùng Local Logout cho dev
export const logoutKeycloak = logoutKeycloakLocal;
```

### Production:
Tùy theo use case:

**SaaS Apps / Internal Tools:**
```typescript
// Local logout cho better UX
export const logoutKeycloak = logoutKeycloakLocal;
```

**Banking / Healthcare / Government:**
```typescript
// Full logout cho security
export const logoutKeycloak = logoutKeycloakFull;
```

**Hybrid Approach:**
- Default: Local logout
- Option: "Sign out all devices" button → Full logout

## Configuration

### Keycloak Session Settings

Vào **Realm Settings** → **Tokens**:

```yaml
SSO Session Idle: 30 minutes
  → Nếu không hoạt động, session tự expire

SSO Session Max: 10 hours
  → Session tối đa, sau đó phải login lại

SSO Session Idle Remember Me: 7 days
  → Remember me session timeout

SSO Session Max Remember Me: 30 days
  → Remember me max session
```

**Khuyến nghị cho Local Logout scenario:**
- SSO Session Idle: 2-8 hours
- SSO Session Max: 12-24 hours
- Cho phép user SSO trong khoảng thời gian này

## Summary

Current implementation:
- ✅ **Local Logout** được dùng mặc định
- ✅ Xóa tokens khỏi app
- ✅ Clear user state
- ✅ Redirect về login
- ✅ **KHÔNG** logout khỏi Keycloak SSO
- ✅ Re-login tự động qua SSO

Benefits:
- Better user experience
- Fast re-login
- SSO support
- Multi-app scenarios
- Development friendly

Nếu cần Full Logout trong tương lai, chỉ cần đổi:
```typescript
export const logoutKeycloak = logoutKeycloakFull;
```
