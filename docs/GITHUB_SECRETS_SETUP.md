# Hướng dẫn thiết lập GitHub Secrets

## Các secrets cần thêm vào GitHub repository

Truy cập: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### 1. Secrets cho Keycloak (Web App)

```bash
# URL của Keycloak server
KEYCLOAK_URL=https://keycloak.iit.vn

# Realm name
KEYCLOAK_REALM=master

# Backend client ID
KEYCLOAK_BE_CLIENT_ID=BE-log-monitoring

# Frontend client ID
KEYCLOAK_FE_CLIENT_ID=FE-log-monitoring

# Client secret (lấy từ Keycloak admin console)
KEYCLOAK_CLIENT_SECRET=<your-keycloak-client-secret>
```

### 2. Secrets cho API URLs

```bash
# URL của API service (thường là domain hoặc IP của VPS)
API_BASE_URL=https://api.your-domain.com

# URL của WebSocket service
WEBSOCKET_URL=https://ws.your-domain.com
```

### 3. Secrets đã có (VPS SSH)

- `VPS_SSH_PRIVATE_KEY` - Private key SSH để kết nối VPS
- `VPS_BASTION_HOST` - Hostname của bastion host
- `VPS_BASTION_USER` - Username cho bastion host
- `VPS_HOST` - Hostname của VPS
- `VPS_USER` - Username cho VPS

## Cách thêm secret mới

1. Vào repository trên GitHub
2. Click `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Nhập tên secret (ví dụ: `KEYCLOAK_URL`)
5. Nhập giá trị secret
6. Click `Add secret`

## Lưu ý quan trọng

- **KEYCLOAK_CLIENT_SECRET** là bắt buộc và phải được lấy từ Keycloak admin console
- Các giá trị URL không nên có dấu `/` ở cuối
- Sau khi thêm secrets, push code lên main branch để trigger CI/CD pipeline
- Image sẽ được build với các giá trị từ secrets

## Kiểm tra sau khi deploy

Sau khi deploy, kiểm tra log của web-app container trên VPS:

```bash
ssh vps
cd ~/log-monitoring
docker compose logs web-app | head -20
```

Bạn sẽ thấy log như sau nếu cấu hình đúng:

```json
{
    "url": "https://keycloak.iit.vn",
    "realm": "master",
    "apiClientId": "BE-log-monitoring",
    "publicClientId": "FE-log-monitoring"
}
```

## Giá trị mặc định

Nếu không set secrets, các giá trị mặc định sẽ được sử dụng:

- `API_BASE_URL`: `http://localhost:3000`
- `WEBSOCKET_URL`: `http://localhost:5000`
- `KEYCLOAK_URL`: `https://keycloak.iit.vn`
- `KEYCLOAK_REALM`: `master`
- `KEYCLOAK_BE_CLIENT_ID`: `BE-log-monitoring`
- `KEYCLOAK_FE_CLIENT_ID`: `FE-log-monitoring`
