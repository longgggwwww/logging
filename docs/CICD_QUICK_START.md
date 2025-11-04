# GitHub Actions CI/CD for Log Monitoring System

Hệ thống CI/CD tự động cho việc build và deploy các microservices lên VPS.

## 📁 Files đã tạo

```
.github/workflows/
├── ci-cd.yml      # Complete CI/CD pipeline (with PR testing)
└── deploy.yml     # Optimized deployment workflow (recommended)

scripts/
├── generate-ssh-keys.sh   # Generate SSH keys for GitHub Actions
└── setup-vps.sh          # Setup VPS for deployment

docs/
└── CICD_SETUP.md         # Hướng dẫn chi tiết (Vietnamese)

.env.example              # Template environment variables
```

## 🚀 Quick Start

### 1. Setup trên máy local

```bash
# Generate SSH keys cho GitHub Actions
cd /home/ad/log-monitoring
./scripts/generate-ssh-keys.sh

# Script sẽ tạo:
# - ~/.ssh/github-actions (private key)
# - ~/.ssh/github-actions.pub (public key)
```

### 2. Setup VPS

```bash
# Copy script lên VPS
scp scripts/setup-vps.sh user@your-vps:/tmp/

# SSH vào VPS và chạy script
ssh user@your-vps
bash /tmp/setup-vps.sh

# Hoặc manual setup:
# 1. Install Docker
# 2. Create ~/log-monitoring directory
# 3. Add SSH public key to ~/.ssh/authorized_keys
# 4. Create .env file
```

### 3. Cấu hình GitHub Secrets

Vào GitHub Repository → Settings → Secrets and variables → Actions

Thêm 3 secrets:

1. **VPS_SSH_PRIVATE_KEY**: Nội dung của `~/.ssh/github-actions`
2. **VPS_HOST**: IP hoặc domain của VPS (ví dụ: `192.168.1.100`)
3. **VPS_USER**: Username trên VPS (ví dụ: `deploy` hoặc `ubuntu`)

### 4. Push code lên main branch

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

## 💡 Cách hoạt động

### Workflow: `deploy.yml` (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│  Push to main branch                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  1. DETECT CHANGES (10-15s)                                 │
│     - services/api/**        → api                          │
│     - services/processor/**  → processor                    │
│     - services/realtime/**   → realtime                     │
│     - services/discord-bot/** → discord-bot                 │
│     - services/fcm/**        → fcm                          │
│     - web-app/**            → web-app                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. BUILD (Parallel - 2-5 min/service)                      │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│     │   API    │  │Processor │  │ Web-app  │  ...         │
│     └──────────┘  └──────────┘  └──────────┘              │
│     - Use GitHub Actions cache                             │
│     - Export as .tar files                                 │
│     - Upload as artifacts                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. DEPLOY (1-3 min)                                        │
│     - Download artifacts                                    │
│     - Transfer to VPS via rsync                            │
│     - Load Docker images                                   │
│     - Restart only changed services                        │
│     - Cleanup old images                                   │
└─────────────────────────────────────────────────────────────┘
```

### Ví dụ scenarios

**Scenario 1: Chỉ sửa API**
```
Files changed: services/api/src/routes/logs.ts
→ Build: api only (2-3 min)
→ Deploy: api only (1 min)
→ Total: ~3-4 min
```

**Scenario 2: Sửa API và Web-app**
```
Files changed:
  - services/api/src/app.ts
  - web-app/src/pages/Dashboard.tsx
→ Build: api, web-app (parallel, ~3-4 min)
→ Deploy: api, web-app (1-2 min)
→ Total: ~4-6 min
```

**Scenario 3: Sửa tất cả services**
```
Files changed: Multiple services
→ Build: All services (parallel, ~5-8 min)
→ Deploy: All services (2-3 min)
→ Total: ~7-11 min
```

## 📊 Chiến lược tối ưu

### 1. Change Detection
- Chỉ build services thực sự thay đổi
- Sử dụng `dorny/paths-filter` action
- Tự động phát hiện dependencies

### 2. Parallel Building
- Build nhiều services cùng lúc
- Sử dụng GitHub Actions matrix strategy
- Tối đa hóa CPU usage

### 3. Caching
- Cache Docker layers (GitHub Actions cache)
- Cache npm/yarn dependencies
- Giảm 50-70% thời gian build lần sau

### 4. Smart Deployment
- Chỉ restart services đã thay đổi
- Không downtime cho services khác
- Rollback nhanh chóng nếu cần

### 5. Transfer Optimization
- Sử dụng rsync thay vì scp
- Chỉ transfer images cần thiết
- Compress artifacts

## 🔧 Troubleshooting

### Lỗi SSH Connection
```bash
# Check trên VPS
sudo systemctl status ssh
sudo ufw allow ssh

# Test từ local
ssh -i ~/.ssh/github-actions user@vps-ip
```

### Lỗi Docker Permission
```bash
# Trên VPS
sudo usermod -aG docker $USER
newgrp docker
```

### Service không start
```bash
# Trên VPS
cd ~/log-monitoring
docker compose logs <service-name>
docker compose ps
```

### Xem workflow logs
1. GitHub → Actions tab
2. Click vào workflow run
3. Xem logs của từng job

## 📝 Best Practices

1. **Test local trước khi push**
   ```bash
   docker compose build <service>
   docker compose up -d <service>
   ```

2. **Sử dụng feature branches**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR, review, then merge to main
   ```

3. **Monitor deployment**
   ```bash
   ssh user@vps
   cd ~/log-monitoring
   docker compose logs -f
   ```

4. **Backup trước khi deploy**
   ```bash
   # Backup databases
   docker compose exec postgres pg_dump > backup.sql
   docker compose exec mongodb mongodump
   ```

## 🔄 Rollback

Nếu deployment có vấn đề:

```bash
# SSH vào VPS
ssh user@vps
cd ~/log-monitoring

# Option 1: Restart service
docker compose restart <service>

# Option 2: Re-run previous workflow
# Vào GitHub Actions → Chọn commit cũ → Re-run workflow
```

## 📖 Documentation

- Chi tiết: [docs/CICD_SETUP.md](./CICD_SETUP.md)
- Docker Compose: [docs/DOCKER_COMPOSE_ARCHITECTURE.md](./DOCKER_COMPOSE_ARCHITECTURE.md)
- Quick Start: [docs/QUICK_START.md](./QUICK_START.md)

## ⚡ Performance

- **First deploy**: ~10-15 phút (build everything)
- **Incremental deploy (1 service)**: ~3-5 phút
- **Incremental deploy (multiple)**: ~5-8 phút
- **Build cache hit**: Giảm ~50-70% thời gian

## 🔒 Security

- ✅ SSH keys riêng biệt cho CI/CD
- ✅ Private keys chỉ trong GitHub Secrets
- ✅ Environment variables trong .env (không commit)
- ✅ User có quyền hạn phù hợp
- ✅ Firewall configured

## 🎯 Next Steps

1. ✅ Setup CI/CD (Done)
2. 📝 Add automated tests
3. 📊 Add monitoring (Prometheus/Grafana)
4. 🔔 Add deployment notifications (Slack/Discord)
5. 🌐 Multi-environment (staging/production)
6. 🔄 Blue-green deployment

---

**Created by**: DANH PHI LONG + AI
**Last updated**: November 5, 2025
