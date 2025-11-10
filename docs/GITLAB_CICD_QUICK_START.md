# Hướng Dẫn Nhanh GitLab CI/CD

## Bước 1: Chuẩn Bị SSH Keys

### Tạo SSH Key cho GitLab CI/CD

```bash
# Tạo SSH key mới
ssh-keygen -t rsa -b 4096 -C "gitlab-ci-deployment" -f ~/.ssh/gitlab-ci-key

# Key sẽ được tạo tại:
# - Private key: ~/.ssh/gitlab-ci-key
# - Public key: ~/.ssh/gitlab-ci-key.pub
```

### Copy Public Key lên Servers

```bash
# Copy lên Bastion Host
ssh-copy-id -i ~/.ssh/gitlab-ci-key.pub user@bastion-host

# Copy lên VPS (qua bastion)
ssh-copy-id -i ~/.ssh/gitlab-ci-key.pub -o ProxyJump=user@bastion-host user@vps-host
```

### Test Connection

```bash
# Test kết nối trực tiếp đến bastion
ssh -i ~/.ssh/gitlab-ci-key user@bastion-host

# Test kết nối đến VPS qua bastion
ssh -i ~/.ssh/gitlab-ci-key -J user@bastion-host user@vps-host
```

## Bước 2: Cấu Hình GitLab Variables

### Truy Cập GitLab Settings

1. Mở project trên GitLab
2. Vào **Settings** → **CI/CD**
3. Tìm phần **Variables** và click **Expand**

### Thêm Variables Cần Thiết

#### 1. VPS_SSH_PRIVATE_KEY (Required)

```bash
# Copy nội dung private key
cat ~/.ssh/gitlab-ci-key
```

Trong GitLab:
- **Key**: `VPS_SSH_PRIVATE_KEY`
- **Value**: Paste toàn bộ nội dung private key (bao gồm `-----BEGIN ... -----END`)
- **Type**: Variable
- **Protected**: ✅ (Check)
- **Masked**: ✅ (Check)

#### 2. VPS_BASTION_HOST (Required)

- **Key**: `VPS_BASTION_HOST`
- **Value**: `bastion.example.com` hoặc IP của bastion
- **Type**: Variable
- **Protected**: ✅

#### 3. VPS_BASTION_USER (Required)

- **Key**: `VPS_BASTION_USER`
- **Value**: `ubuntu` hoặc username của bạn trên bastion
- **Type**: Variable
- **Protected**: ✅

#### 4. VPS_HOST (Required)

- **Key**: `VPS_HOST`
- **Value**: IP hoặc hostname của VPS đích
- **Type**: Variable
- **Protected**: ✅

#### 5. VPS_USER (Required)

- **Key**: `VPS_USER`
- **Value**: Username trên VPS đích
- **Type**: Variable
- **Protected**: ✅

### Variables Tùy Chọn (Optional)

#### Keycloak Configuration

| Key | Value Example | Description |
|-----|---------------|-------------|
| `KEYCLOAK_URL` | `https://keycloak.iit.vn` | Keycloak server URL |
| `KEYCLOAK_REALM` | `master` | Keycloak realm |
| `KEYCLOAK_BE_CLIENT_ID` | `BE-log-monitoring` | Backend client ID |
| `KEYCLOAK_FE_CLIENT_ID` | `FE-log-monitoring` | Frontend client ID |
| `KEYCLOAK_CLIENT_SECRET` | `your-secret-here` | Client secret (Masked) |

#### Application URLs

| Key | Default | Description |
|-----|---------|-------------|
| `API_BASE_URL` | `http://api:3000` | API base URL |
| `WEBSOCKET_URL` | `http://realtime:3000` | WebSocket URL |

## Bước 3: Chuẩn Bị VPS

### Cài Đặt Docker và Docker Compose

```bash
# SSH vào VPS
ssh -J user@bastion user@vps

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user vào docker group
sudo usermod -aG docker $USER

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Tạo Thư Mục Deployment

```bash
# Tạo thư mục cho project
mkdir -p ~/log-monitoring/deployment
cd ~/log-monitoring

# Tạo .env file (nếu cần)
cp .env.example .env
nano .env  # Chỉnh sửa các giá trị cần thiết
```

## Bước 4: Push Code và Trigger Pipeline

### Clone Repository (nếu chưa có)

```bash
git clone git@gitlab.com:your-username/log-monitoring.git
cd log-monitoring
```

### Push Code lên GitLab

```bash
# Commit changes (nếu có)
git add .
git commit -m "Setup GitLab CI/CD"

# Push lên main branch
git push origin main
```

### Xem Pipeline Chạy

1. Truy cập GitLab project
2. Vào **CI/CD** → **Pipelines**
3. Sẽ thấy pipeline mới đang chạy

## Bước 5: Kiểm Tra Deployment

### Xem Logs trên GitLab

1. Click vào pipeline đang chạy
2. Xem từng stage:
   - **detect**: Kiểm tra services nào thay đổi
   - **build**: Build Docker images
   - **deploy**: Deploy lên VPS

### Verify trên VPS

```bash
# SSH vào VPS
ssh -J user@bastion user@vps

# Kiểm tra services đang chạy
cd ~/log-monitoring
docker compose ps

# Xem logs
docker compose logs -f api
docker compose logs -f web-app

# Kiểm tra health status
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## Các Tình Huống Thường Gặp

### 1. Rebuild Một Service Cụ Thể

```bash
# Tạo file .rebuild để trigger build
touch services/api/.rebuild
git add services/api/.rebuild
git commit -m "Rebuild API service"
git push
```

### 2. Rebuild Tất Cả Services

```bash
# Tạo .rebuild cho tất cả services
touch services/api/.rebuild
touch services/processor/.rebuild
touch services/realtime/.rebuild
touch services/discord-bot/.rebuild
touch services/fcm/.rebuild
touch web-app/.rebuild

git add .
git commit -m "Rebuild all services"
git push
```

### 3. Deploy Thủ Công

Nếu muốn deploy thủ công mà không qua CI/CD:

```bash
# Trên local machine, build images
docker build -t api:latest -f ./services/api/Dockerfile .

# Save image
docker save api:latest -o api.tar

# Transfer lên VPS
scp -J user@bastion api.tar user@vps:~/log-monitoring/deployment/

# SSH vào VPS và load image
ssh -J user@bastion user@vps
cd ~/log-monitoring
docker load -i deployment/api.tar
docker compose up -d --force-recreate api
```

### 4. Rollback Version Cũ

```bash
# SSH vào VPS
ssh -J user@bastion user@vps
cd ~/log-monitoring

# Xem các images có sẵn
docker images | grep api

# Rollback bằng cách tag lại
docker tag api:old-commit-sha api:latest
docker compose up -d --force-recreate api
```

## Monitoring và Logging

### Xem Logs Real-time

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api

# Last 100 lines
docker compose logs --tail=100 api

# With timestamps
docker compose logs -f -t api
```

### Check Resource Usage

```bash
# CPU and Memory usage
docker stats

# Disk usage
docker system df

# Detailed info
docker system df -v
```

### Cleanup

```bash
# Remove unused images
docker image prune -f

# Remove unused containers
docker container prune -f

# Remove everything unused
docker system prune -af --volumes
```

## Troubleshooting

### Pipeline Fails: SSH Connection Timeout

**Nguyên nhân**: Không kết nối được đến bastion host

**Giải pháp**:
```bash
# Test connection từ local
ssh -i ~/.ssh/gitlab-ci-key user@bastion-host

# Kiểm tra firewall
sudo ufw status
sudo ufw allow 22/tcp

# Kiểm tra SSH service
sudo systemctl status ssh
```

### Pipeline Fails: Docker Build Error

**Nguyên nhân**: Build fails do syntax error hoặc missing dependencies

**Giải pháp**:
```bash
# Test build locally
docker build -t test:latest -f ./services/api/Dockerfile .

# Check logs
docker build --no-cache -t test:latest -f ./services/api/Dockerfile .
```

### Service Won't Start on VPS

**Nguyên nhân**: Dependencies chưa ready hoặc config sai

**Giải pháp**:
```bash
# SSH vào VPS
ssh -J user@bastion user@vps
cd ~/log-monitoring

# Check dependencies first
docker compose up -d postgres mongodb redis kafka-1 kafka-2 kafka-3

# Wait and check health
sleep 20
docker compose ps

# Then start application services
docker compose up -d api processor realtime

# Check logs
docker compose logs api
```

### Out of Disk Space

**Nguyên nhân**: Quá nhiều Docker images/containers cũ

**Giải pháp**:
```bash
# Check disk usage
df -h
docker system df

# Cleanup
docker system prune -af --volumes

# Stop và remove tất cả containers
docker compose down

# Remove all images
docker rmi $(docker images -q)

# Restart services
docker compose up -d
```

## Checklist Hoàn Thành

- [ ] SSH keys đã tạo và copy lên servers
- [ ] Test SSH connection thành công
- [ ] GitLab variables đã cấu hình đầy đủ
- [ ] Docker đã cài đặt trên VPS
- [ ] Thư mục deployment đã tạo trên VPS
- [ ] `.gitlab-ci.yml` đã được push lên repository
- [ ] Pipeline chạy thành công
- [ ] Services đang chạy trên VPS
- [ ] Có thể access application qua browser

## Liên Hệ & Hỗ Trợ

Nếu gặp vấn đề:
1. Check pipeline logs trên GitLab
2. Check Docker logs trên VPS
3. Xem file `GITLAB_CICD_SETUP.md` để biết chi tiết

## Tài Liệu Tham Khảo

- [GitLab CI/CD Documentation](https://docs.gitlab.com/ee/ci/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- File chi tiết: `docs/GITLAB_CICD_SETUP.md`
