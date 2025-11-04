# Hướng dẫn thiết lập GitHub Actions CI/CD

## Tổng quan

Hệ thống CI/CD này được thiết kế để tự động build và deploy các service lên VPS thông qua SSH. Chỉ các service có thay đổi mới được build và deploy lại, giúp tiết kiệm thời gian và tài nguyên.

## Chiến lược Deploy

### 1. **Phát hiện thay đổi (Change Detection)**
- Sử dụng `dorny/paths-filter` để tự động phát hiện service nào có thay đổi
- Chỉ build các service thực sự thay đổi
- Tạo danh sách động các service cần deploy

### 2. **Build song song (Parallel Building)**
- Sử dụng matrix strategy để build nhiều service cùng lúc
- Mỗi service được build trong job riêng biệt
- Sử dụng GitHub Actions cache để tăng tốc độ build

### 3. **Transfer tối ưu**
- Chỉ transfer Docker images của các service đã thay đổi
- Sử dụng rsync để đồng bộ files hiệu quả
- Compress artifacts để giảm thời gian transfer

### 4. **Deploy không downtime**
- Sử dụng `docker compose up -d --no-deps` để chỉ restart service đã thay đổi
- Các service khác vẫn chạy bình thường
- Auto cleanup để giải phóng dung lượng

## Cấu hình

### Bước 1: Tạo SSH Key cho GitHub Actions

Trên máy local của bạn:

```bash
# Tạo SSH key mới (không set passphrase)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions -N ""

# Key này sẽ tạo 2 files:
# - ~/.ssh/github-actions (private key - cho GitHub Secrets)
# - ~/.ssh/github-actions.pub (public key - cho VPS)
```

### Bước 2: Cấu hình VPS

Trên VPS của bạn:

```bash
# 1. Tạo user deploy (optional nhưng recommended)
sudo adduser deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy

# 2. Thêm public key vào authorized_keys
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Copy nội dung từ ~/.ssh/github-actions.pub (trên máy local) vào file này:
nano ~/.ssh/authorized_keys
# Paste nội dung public key vào
chmod 600 ~/.ssh/authorized_keys

# 3. Tạo thư mục cho project
mkdir -p ~/log-monitoring
cd ~/log-monitoring

# 4. Tạo file .env với các biến môi trường cần thiết
nano .env
```

Ví dụ file `.env` trên VPS:

```env
# Database
POSTGRES_DB=kafka
POSTGRES_USER=longgggwww
POSTGRES_PASSWORD=your_secure_password

MONGO_USERNAME=longgggwww
MONGO_PASSWORD=your_secure_password
MONGO_DATABASE=logs
MONGO_URL=mongodb://longgggwww:your_secure_password@mongodb:27017/logs?authSource=admin

# Redis
REDIS_URL=redis://redis:6379

# Kafka
KAFKA_EXTERNAL_HOST=your.vps.domain.com

# Keycloak
KEYCLOAK_URL=https://your-keycloak-url.com
KEYCLOAK_BE_CLIENT_ID=your-backend-client-id
KEYCLOAK_FE_CLIENT_ID=web-app-client
KEYCLOAK_REALM=master
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Session
SESSION_SECRET=your-session-secret-here

# Discord (optional)
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_GUILD_ID=your-guild-id
DISCORD_CLIENT_ID=your-client-id

# Web App
API_BASE_URL=https://api.your-domain.com
WEBSOCKET_URL=https://ws.your-domain.com
WEBSOCKET_CORS_ORIGIN=https://your-domain.com
```

### Bước 3: Cấu hình GitHub Secrets

Vào repository GitHub → Settings → Secrets and variables → Actions → New repository secret

Tạo các secrets sau:

1. **VPS_SSH_PRIVATE_KEY**
   ```bash
   # Copy toàn bộ nội dung của file ~/.ssh/github-actions (private key)
   cat ~/.ssh/github-actions
   ```
   Paste toàn bộ nội dung (bao gồm cả `-----BEGIN/END PRIVATE KEY-----`)

2. **VPS_HOST**
   ```
   # IP hoặc domain của VPS
   Ví dụ: 192.168.1.100 hoặc your-vps.com
   ```

3. **VPS_USER**
   ```
   # Username trên VPS (ví dụ: deploy hoặc root)
   deploy
   ```

### Bước 4: Test SSH Connection

Trên máy local, test kết nối SSH:

```bash
ssh -i ~/.ssh/github-actions deploy@your-vps-ip

# Nếu kết nối thành công, test Docker:
docker ps
docker compose version
```

## Workflow Files

Hệ thống có 2 workflows:

### 1. `ci-cd.yml` - Complete CI/CD Pipeline
- Chạy cho cả Pull Request và Push to main
- Bao gồm testing và validation
- Build và deploy đầy đủ

### 2. `deploy.yml` - Optimized Deployment (Recommended)
- Chỉ chạy khi push to main
- Tối ưu hóa cho tốc độ
- Phát hiện thay đổi thông minh
- Build song song
- Deploy nhanh chóng

## Cách hoạt động

### Khi bạn push code lên main branch:

1. **Detect Changes** (10-15 giây)
   - Phân tích files đã thay đổi
   - Xác định services cần rebuild
   - Tạo danh sách deploy

2. **Build** (2-5 phút mỗi service, song song)
   - Build Docker images cho services đã thay đổi
   - Sử dụng cache để tăng tốc
   - Export images thành .tar files
   - Upload artifacts

3. **Deploy** (1-3 phút)
   - Download artifacts
   - Transfer files lên VPS qua rsync
   - Load Docker images
   - Restart chỉ các services đã thay đổi
   - Cleanup old images

### Ví dụ thời gian deploy:

- **1 service thay đổi**: ~3-5 phút
- **2-3 services**: ~5-7 phút (build song song)
- **Tất cả services**: ~8-12 phút (build song song)

## Monitoring và Debugging

### Xem logs của workflow:
1. Vào repository GitHub
2. Click tab "Actions"
3. Click vào workflow run muốn xem
4. Click vào job cụ thể để xem logs

### Debug trên VPS:

```bash
# Xem logs của service
docker compose logs -f <service-name>

# Ví dụ:
docker compose logs -f api
docker compose logs -f processor

# Xem status các services
docker compose ps

# Restart service thủ công
docker compose restart <service-name>

# Xem toàn bộ container
docker ps -a

# Xem images
docker images
```

### Common Issues và Solutions:

#### 1. SSH Connection Failed
```bash
# Check firewall
sudo ufw status
sudo ufw allow ssh

# Check SSH service
sudo systemctl status ssh

# Test từ GitHub Actions
# Thêm step này vào workflow để debug:
- name: Debug SSH
  run: |
    ssh -vvv ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "echo 'Connected!'"
```

#### 2. Docker Permission Denied
```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER
newgrp docker

# Test
docker ps
```

#### 3. Service không start
```bash
# Check logs
docker compose logs <service-name>

# Check .env file
cat .env

# Rebuild service
docker compose up -d --force-recreate <service-name>
```

## Tối ưu hóa

### 1. Sử dụng Docker Layer Caching
Workflows đã được cấu hình với GitHub Actions cache:
```yaml
cache-from: type=gha,scope=${{ matrix.service }}
cache-to: type=gha,mode=max,scope=${{ matrix.service }}
```

### 2. Build chỉ khi cần
Thay đổi trong các thư mục này sẽ trigger build:
- `services/api/**` → build api
- `services/processor/**` → build processor
- `web-app/**` → build web-app
- etc.

### 3. Parallel builds
Tất cả services được build đồng thời, không tuần tự.

### 4. Optimized image transfer
- Sử dụng rsync thay vì scp
- Chỉ transfer images cần thiết
- Auto cleanup sau deploy

## Best Practices

1. **Luôn test local trước khi push**
   ```bash
   docker compose build <service-name>
   docker compose up -d <service-name>
   ```

2. **Sử dụng feature branches**
   - Tạo branch cho feature mới
   - Test kỹ trước khi merge vào main
   - CI/CD chỉ deploy từ main branch

3. **Monitor sau khi deploy**
   ```bash
   # Xem logs real-time
   ssh deploy@your-vps
   cd ~/log-monitoring
   docker compose logs -f
   ```

4. **Backup trước khi deploy lớn**
   ```bash
   # Backup database
   docker compose exec postgres pg_dump -U longgggwww kafka > backup.sql
   docker compose exec mongodb mongodump --out /backup
   ```

5. **Rolling updates cho production**
   - Deploy services theo batch
   - Monitor health sau mỗi batch
   - Có rollback plan

## Rollback Strategy

Nếu deploy có vấn đề:

```bash
# SSH vào VPS
ssh deploy@your-vps
cd ~/log-monitoring

# Option 1: Restart service
docker compose restart <service-name>

# Option 2: Rollback to previous image
docker compose down <service-name>
docker images  # Tìm image tag cũ
docker tag <old-image-id> <service-name>:latest
docker compose up -d <service-name>

# Option 3: Redeploy từ commit trước đó
# Trên GitHub, chọn commit cũ và re-run workflow
```

## Security Checklist

- ✅ SSH key không có passphrase (cho automation)
- ✅ Private key chỉ lưu trong GitHub Secrets
- ✅ Public key chỉ trên VPS
- ✅ Firewall cấu hình đúng
- ✅ User deploy có quyền hạn phù hợp
- ✅ Environment variables trong .env trên VPS
- ✅ Không commit secrets vào Git
- ✅ Sử dụng HTTPS cho external services
- ✅ Regular security updates

## Next Steps

1. **Setup monitoring**
   - Thêm health checks
   - Setup alerts (Prometheus, Grafana)
   - Log aggregation

2. **Improve CI/CD**
   - Thêm automated tests
   - Integration tests
   - Performance tests
   - Security scanning

3. **Scale**
   - Multi-VPS deployment
   - Load balancing
   - Database replication
   - CDN cho static assets

## Liên hệ & Support

Nếu có vấn đề, check:
1. GitHub Actions logs
2. VPS system logs: `sudo journalctl -xe`
3. Docker logs: `docker compose logs`
4. Service-specific logs trong container

---

**Lưu ý**: File này mô tả setup cho production deployment. Đảm bảo đã test kỹ trên staging environment trước.
