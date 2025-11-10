# GitLab CI/CD Setup Guide

## Tổng Quan

Pipeline GitLab CI/CD này được thiết kế để tự động build và deploy các microservices trong hệ thống log monitoring lên VPS thông qua bastion host.

## Kiến Trúc Pipeline

Pipeline bao gồm 3 stages chính:

### 1. **Detect Stage** - Phát hiện thay đổi
- Phát hiện các service nào đã thay đổi dựa trên git diff
- Tạo file `changes.env` chứa các biến môi trường cho các stage tiếp theo
- Services được theo dõi:
  - API Service (`services/api/`)
  - Processor Service (`services/processor/`)
  - Realtime Service (`services/realtime/`)
  - Discord Bot Service (`services/discord-bot/`)
  - FCM Service (`services/fcm/`)
  - Web App (`web-app/`)

### 2. **Build Stage** - Build Docker Images
- Build Docker images cho các services đã thay đổi
- Mỗi service có một job riêng biệt:
  - `build-api`
  - `build-processor`
  - `build-realtime`
  - `build-discord-bot`
  - `build-fcm`
  - `build-web-app`
- Docker images được lưu dưới dạng `.tar` file và upload làm artifacts
- Sử dụng `docker:24-dind` (Docker-in-Docker) để build images

### 3. **Deploy Stage** - Deploy lên VPS
- Transfer Docker images lên VPS qua bastion host
- Load images và restart các services đã thay đổi
- Đảm bảo infrastructure services (Postgres, MongoDB, Redis, Kafka) đang chạy
- Cleanup images cũ để tiết kiệm dung lượng

## Cấu Hình GitLab Variables

Bạn cần cấu hình các variables sau trong GitLab (Settings > CI/CD > Variables):

### Required Variables (Bắt buộc)

| Variable | Description | Example |
|----------|-------------|---------|
| `VPS_SSH_PRIVATE_KEY` | Private SSH key để kết nối đến VPS | `-----BEGIN RSA PRIVATE KEY-----...` |
| `VPS_BASTION_HOST` | Hostname/IP của bastion host | `bastion.example.com` |
| `VPS_BASTION_USER` | Username cho bastion host | `ubuntu` |
| `VPS_HOST` | Hostname/IP của VPS đích | `192.168.1.100` |
| `VPS_USER` | Username cho VPS đích | `deploy` |

### Optional Variables (Tùy chọn)

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Base URL cho API | `http://api:3000` |
| `WEBSOCKET_URL` | WebSocket URL cho realtime | `http://realtime:3000` |
| `KEYCLOAK_URL` | Keycloak authentication URL | `https://keycloak.iit.vn` |
| `KEYCLOAK_REALM` | Keycloak realm | `master` |
| `KEYCLOAK_BE_CLIENT_ID` | Backend client ID | `BE-log-monitoring` |
| `KEYCLOAK_FE_CLIENT_ID` | Frontend client ID | `FE-log-monitoring` |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | - |

## Cách Cấu Hình GitLab Variables

### 1. Truy cập GitLab Project Settings
```
GitLab Project → Settings → CI/CD → Variables → Expand
```

### 2. Thêm Variables

Với mỗi variable:
1. Click **Add variable**
2. **Key**: Nhập tên variable (ví dụ: `VPS_SSH_PRIVATE_KEY`)
3. **Value**: Nhập giá trị
4. **Type**: 
   - Chọn `Variable` cho các giá trị thông thường
   - Chọn `File` nếu muốn lưu dưới dạng file
5. **Flags**:
   - ✅ **Protected**: Check nếu chỉ muốn dùng trên protected branches (main)
   - ✅ **Masked**: Check để ẩn giá trị trong logs (khuyến nghị cho secrets)
6. Click **Add variable**

### 3. Cấu Hình SSH Key

Để tạo SSH key cho deployment:

```bash
# Tạo SSH key pair mới
ssh-keygen -t rsa -b 4096 -C "gitlab-ci@your-project" -f gitlab-deploy-key

# Copy public key lên VPS và bastion host
ssh-copy-id -i gitlab-deploy-key.pub user@bastion-host
ssh-copy-id -i gitlab-deploy-key.pub user@vps-host

# Copy private key content
cat gitlab-deploy-key
```

Sau đó paste nội dung private key vào GitLab variable `VPS_SSH_PRIVATE_KEY`.

## Workflow

### 1. Khi Push Code lên Branch `main`

```mermaid
graph TD
    A[Push to main] --> B[detect-changes]
    B --> C{Any changes?}
    C -->|Yes| D[Build changed services]
    C -->|No| E[Skip build & deploy]
    D --> F[Deploy to VPS]
    F --> G[Verify deployment]
```

### 2. Khi Tạo Merge Request

Pipeline sẽ chạy để build và test, nhưng **không deploy** lên VPS.

### 3. Trigger Rebuild Thủ Công

Để rebuild một service mà không thay đổi code:

```bash
# Tạo file .rebuild trong thư mục service
touch services/api/.rebuild
git add services/api/.rebuild
git commit -m "Trigger rebuild: api"
git push
```

## Cấu Trúc File

```
.gitlab-ci.yml          # GitLab CI/CD configuration
docker-compose.yml       # Docker Compose for all services
init-scripts/           # Database initialization scripts
services/               # Microservices
  ├── api/
  ├── processor/
  ├── realtime/
  ├── discord-bot/
  └── fcm/
web-app/                # Frontend application
```

## Monitoring Pipeline

### Xem Pipeline Status

```
GitLab Project → CI/CD → Pipelines
```

### Xem Job Logs

1. Click vào pipeline muốn xem
2. Click vào job cụ thể (ví dụ: `build-api`)
3. Xem logs real-time

### Retry Failed Jobs

Nếu một job fail, bạn có thể:
1. Click vào job đó
2. Click nút **Retry** ở góc phải

## Troubleshooting

### 1. SSH Connection Failed

**Lỗi**: Cannot connect to bastion host or VPS

**Giải pháp**:
```bash
# Test SSH connection manually
ssh -i gitlab-deploy-key user@bastion-host
ssh -i gitlab-deploy-key -J user@bastion-host user@vps-host

# Check SSH key permissions
chmod 600 gitlab-deploy-key

# Verify SSH key is added to authorized_keys on both hosts
cat ~/.ssh/authorized_keys
```

### 2. Docker Build Failed

**Lỗi**: Docker build fails during build stage

**Giải pháp**:
- Check Dockerfile syntax
- Verify build arguments
- Check if Docker service is available:
  ```yaml
  services:
    - docker:24-dind
  ```

### 3. Deployment Failed

**Lỗi**: Services cannot start on VPS

**Giải pháp**:
```bash
# SSH vào VPS
ssh -J user@bastion user@vps

# Check Docker Compose status
cd ~/log-monitoring
docker compose ps
docker compose logs --tail=50

# Check Docker disk space
docker system df

# Cleanup if needed
docker system prune -af
```

### 4. Changes Not Detected

**Lỗi**: Changes made but pipeline skips build

**Giải pháp**:
- Verify file paths match the patterns in `.gitlab-ci.yml`
- Check if changes are committed and pushed
- Manually trigger rebuild using `.rebuild` file

## Best Practices

### 1. Protected Branches

Cấu hình protected branches để chỉ deploy từ `main`:
```
Settings → Repository → Protected Branches → Protect main branch
```

### 2. Manual Approval

Thêm manual approval trước khi deploy:
```yaml
deploy-to-vps:
  stage: deploy
  when: manual  # Require manual approval
  # ... rest of config
```

### 3. Parallel Builds

Build jobs chạy song song để tăng tốc độ:
- Mỗi service có job riêng
- GitLab Runner sẽ chạy parallel nếu có đủ resources

### 4. Artifacts Management

- Artifacts (Docker images) được lưu 1 giờ
- Tự động cleanup sau khi deploy
- Giảm storage usage trên GitLab

## So Sánh với GitHub Actions

| Feature | GitLab CI/CD | GitHub Actions |
|---------|--------------|----------------|
| Config File | `.gitlab-ci.yml` | `.github/workflows/ci-cd.yml` |
| Stages | Explicit stages | Jobs with needs |
| Variables | Project/Group level | Secrets + Env vars |
| Artifacts | Built-in | Uses actions |
| Docker-in-Docker | `docker:dind` service | Docker buildx action |
| Change Detection | Git diff in script | `dorny/paths-filter` action |

## Pipeline Performance

### Estimated Times

- **Detect changes**: ~10-20s
- **Build single service**: ~2-5 min
- **Build all services**: ~10-15 min (parallel)
- **Deploy**: ~2-3 min
- **Total (full rebuild)**: ~15-20 min

### Optimization Tips

1. **Enable GitLab Runner Cache**
   ```yaml
   cache:
     key: ${CI_COMMIT_REF_SLUG}
     paths:
       - node_modules/
       - .npm/
   ```

2. **Use Local GitLab Runner** (nếu có VPS riêng)
   - Faster network transfer
   - No public runner queue time

3. **Incremental Builds**
   - Chỉ build services thay đổi
   - Reuse Docker layer cache

## Mở Rộng

### Thêm Service Mới

1. Thêm job detect trong `detect-changes`:
   ```yaml
   if git diff --name-only $BASE_SHA $CI_COMMIT_SHA | grep -E '^services/new-service/'; then
     echo "NEW_SERVICE_CHANGED=true" >> changes.env
   fi
   ```

2. Thêm build job:
   ```yaml
   build-new-service:
     stage: build
     # ... similar to other build jobs
   ```

3. Update deploy job để handle service mới

### Thêm Environment Mới (Staging/Production)

```yaml
deploy-staging:
  stage: deploy
  script:
    - ssh staging-vps "cd ~/app && docker compose up -d"
  only:
    - develop

deploy-production:
  stage: deploy
  script:
    - ssh prod-vps "cd ~/app && docker compose up -d"
  only:
    - main
  when: manual  # Require approval
```

## Kết Luận

GitLab CI/CD pipeline này cung cấp:
- ✅ Automated builds on changes
- ✅ Selective service deployment
- ✅ Secure SSH deployment via bastion
- ✅ Infrastructure dependencies handling
- ✅ Health checks and verification
- ✅ Automatic cleanup

Để bắt đầu, chỉ cần:
1. Cấu hình GitLab variables
2. Push code lên branch `main`
3. Pipeline sẽ tự động chạy
