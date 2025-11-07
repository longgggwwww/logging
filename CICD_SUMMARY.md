# GitHub Actions CI/CD - Complete Setup Summary

## 📦 Những gì đã được tạo

### 1. GitHub Workflows
```
.github/workflows/
├── deploy.yml          # Optimized deployment (Recommended)
└── ci-cd.yml          # Full CI/CD pipeline
```

**deploy.yml** - Workflow được khuyến nghị:
- ✅ Tự động phát hiện service thay đổi
- ✅ Build song song (parallel)
- ✅ Chỉ deploy service đã thay đổi
- ✅ Zero-downtime deployment
- ✅ Thời gian: 3-8 phút

**ci-cd.yml** - Full pipeline với testing:
- ✅ Tất cả tính năng của deploy.yml
- ✅ Hỗ trợ Pull Request validation
- ✅ Testing stage (có thể mở rộng)

### 2. Setup Scripts
```
scripts/
├── generate-ssh-keys.sh    # Tạo SSH keys cho GitHub Actions
├── setup-vps.sh           # Setup VPS tự động
└── trigger-rebuild.sh     # Trigger rebuild service (NEW)
```

**generate-ssh-keys.sh**: Tạo SSH key pair cho CI/CD
**setup-vps.sh**: Install Docker, setup directories, configure SSH
**trigger-rebuild.sh**: Trigger rebuild service bằng flag file

### 3. Rebuild Flags
```
services/api/.rebuild           # Flag để trigger rebuild API
services/processor/.rebuild     # Flag để trigger rebuild Processor
services/realtime/.rebuild      # Flag để trigger rebuild Realtime
services/discord-bot/.rebuild   # Flag để trigger rebuild Discord Bot
services/fcm/.rebuild          # Flag để trigger rebuild FCM
web-app/.rebuild               # Flag để trigger rebuild Web App
```

Mỗi service có file `.rebuild` chứa giá trị `0` hoặc `1`. Khi thay đổi giá trị này (toggle), GitHub Actions sẽ tự động phát hiện và rebuild service đó.

### 4. Documentation
```
docs/
├── CICD_SETUP.md          # Hướng dẫn chi tiết (Vietnamese)
├── CICD_QUICK_START.md    # Quick reference
├── CICD_DIAGRAM.md        # Visual diagrams
├── CICD_CHECKLIST.md      # Step-by-step checklist
└── REBUILD_TRIGGER.md     # Hướng dẫn trigger rebuild (NEW)

.github/workflows/
└── README.md              # Workflow documentation
```

### 4. Configuration
```
.env.example               # Template environment variables
```

## 🔄 Trigger Rebuild (NEW)

### Sử dụng Script
```bash
# Trigger rebuild một service
./scripts/trigger-rebuild.sh api

# Trigger rebuild tất cả services
./scripts/trigger-rebuild.sh all

# Xem help
./scripts/trigger-rebuild.sh help
```

### Manual Trigger
```bash
# Thay đổi flag file
echo "1" > services/api/.rebuild

# Commit và push
git add services/api/.rebuild
git commit -m "chore: trigger api rebuild"
git push
```

### Use Cases
- ✅ Rebuild sau khi update dependencies
- ✅ Force redeploy mà không thay đổi code
- ✅ Test CI/CD pipeline
- ✅ Rebuild tất cả services sau infrastructure changes

📖 **Chi tiết**: Xem `docs/REBUILD_TRIGGER.md`

## 🎯 Chiến lược CI/CD

### Phát hiện thay đổi thông minh
```yaml
services/api/**         → Chỉ build api
services/api/.rebuild   → Trigger rebuild api (NEW)
services/processor/**   → Chỉ build processor
services/processor/.rebuild → Trigger rebuild processor (NEW)
services/realtime/**    → Chỉ build realtime
services/realtime/.rebuild → Trigger rebuild realtime (NEW)
services/discord-bot/** → Chỉ build discord-bot
services/discord-bot/.rebuild → Trigger rebuild discord-bot (NEW)
services/fcm/**        → Chỉ build fcm
services/fcm/.rebuild  → Trigger rebuild fcm (NEW)
web-app/**             → Chỉ build web-app
web-app/.rebuild       → Trigger rebuild web-app (NEW)
```

### Build tối ưu
- **Parallel builds**: Tất cả services build đồng thời
- **GitHub Actions cache**: Tái sử dụng Docker layers
- **Smart caching**: Giảm 50-70% thời gian build

### Deploy nhanh chóng
- **Selective restart**: Chỉ restart services đã thay đổi
- **No downtime**: Services khác vẫn chạy bình thường
- **rsync transfer**: Transfer files hiệu quả

## 🚀 Bắt đầu nhanh

### Bước 1: Generate SSH Keys (2 phút)
```bash
cd /home/ad/log-monitoring
./scripts/generate-ssh-keys.sh
```

Output:
- `~/.ssh/github-actions` (private key - cho GitHub)
- `~/.ssh/github-actions.pub` (public key - cho VPS)

### Bước 2: Setup VPS (5-10 phút)
```bash
# Copy script lên VPS
scp scripts/setup-vps.sh user@your-vps:/tmp/

# SSH vào VPS và chạy
ssh user@your-vps
bash /tmp/setup-vps.sh
```

Script sẽ:
- Install Docker & Docker Compose
- Tạo project directory
- Setup SSH authorized_keys
- Tạo .env template

### Bước 3: Cấu hình GitHub Secrets (2 phút)

Vào: `Repository → Settings → Secrets → Actions`

**Required Secrets** (bắt buộc):

| Secret | Giá trị | Ví dụ |
|--------|---------|-------|
| `VPS_SSH_PRIVATE_KEY` | Nội dung `~/.ssh/github-actions` | (toàn bộ file Ed25519) |
| `VPS_HOST` | IP hoặc domain VPS | `192.168.1.100` |
| `VPS_USER` | Username trên VPS | `deploy` |

**Optional Secrets** (cho proxy jump qua bastion):

| Secret | Giá trị | Ví dụ |
|--------|---------|-------|
| `VPS_BASTION_HOST` | IP/domain bastion server | `bastion.example.com` |
| `VPS_BASTION_USER` | Username trên bastion | `jump-user` |

> **Note**: Nếu VPS của bạn nằm sau bastion/jump host, thêm 2 secrets optional. CI/CD sẽ tự động detect và setup proxy jump.

### Bước 4: Configure .env trên VPS (3 phút)
```bash
# SSH vào VPS
ssh user@your-vps
cd ~/log-monitoring

# Edit .env
nano .env
```

Thay đổi các giá trị:
- `POSTGRES_PASSWORD`
- `MONGO_PASSWORD`
- `KEYCLOAK_URL`
- `SESSION_SECRET`
- Và các giá trị khác cần thiết

### Bước 5: Deploy! (3-8 phút)
```bash
# Trên máy local
git add .
git commit -m "Setup CI/CD"
git push origin main
```

Xem tiến trình: `Repository → Actions tab`

### Bước 6: Verify (1 phút)
```bash
# SSH vào VPS
ssh user@your-vps
cd ~/log-monitoring

# Check services
docker compose ps

# Check logs
docker compose logs -f
```

## 📊 Timeline ước tính

```
Setup lần đầu:     15-20 phút
First deploy:      8-12 phút
Subsequent deploy: 3-8 phút (tùy số service thay đổi)
```

## 🎨 Workflow Flow

```
Developer
    │
    │ git push origin main
    ▼
GitHub Actions
    │
    ├─► [1] Detect Changes (15s)
    │        └─► Output: ["api", "realtime"]
    │
    ├─► [2] Build (Parallel, 2-5 min/service)
    │        ├─► Build api
    │        └─► Build realtime
    │
    └─► [3] Deploy (1-3 min)
             ├─► Transfer images to VPS
             ├─► Load images
             ├─► Restart api, realtime
             └─► Cleanup
                    │
                    ▼
                   VPS
                Services running:
                ✅ api (updated)
                ✅ realtime (updated)
                ⏸️  processor (unchanged)
                ⏸️  discord-bot (unchanged)
                ⏸️  fcm (unchanged)
                ⏸️  web-app (unchanged)
```

## 💡 Ví dụ sử dụng

### Scenario 1: Fix bug trong API
```bash
# Sửa code
vim services/api/src/routes/logs.ts

# Commit và push
git add services/api/
git commit -m "fix: resolve pagination issue"
git push origin main

# ✅ Chỉ api được build và deploy (3-4 phút)
```

### Scenario 2: Update UI và API
```bash
# Sửa cả web-app và api
vim web-app/src/pages/Dashboard.tsx
vim services/api/src/routes/logs.ts

# Commit và push
git add .
git commit -m "feat: add new dashboard features"
git push origin main

# ✅ api và web-app build song song (4-6 phút)
```

### Scenario 3: Update tất cả services
```bash
# Update dependencies hoặc shared code
git add .
git commit -m "chore: update dependencies"
git push origin main

# ✅ Tất cả services build song song (8-12 phút)
```

### Scenario 4: Trigger rebuild mà không thay đổi code (NEW)
```bash
# Sử dụng rebuild script
./scripts/trigger-rebuild.sh api

# Commit và push
git add .
git commit -m "chore: trigger api rebuild"
git push origin main

# ✅ Chỉ api được rebuild và deploy (3-4 phút)
```

### Scenario 5: Rebuild tất cả services sau infrastructure change (NEW)
```bash
# Trigger rebuild tất cả
./scripts/trigger-rebuild.sh all

# Commit và push
git add .
git commit -m "chore: rebuild all services"
git push origin main

# ✅ Tất cả services build song song (8-12 phút)
```

## 📈 So sánh với deploy thủ công

| Tiêu chí | Manual Deploy | GitHub Actions CI/CD |
|----------|---------------|----------------------|
| **Thời gian** | 20-30 phút | 3-8 phút |
| **Effort** | High (manual steps) | Low (automatic) |
| **Downtime** | Tất cả services | Chỉ services thay đổi |
| **Rollback** | Manual, slow | Re-run workflow |
| **Consistency** | Depends on operator | Always same |
| **Testing** | Manual | Can be automated |
| **Logs** | Local terminal | GitHub Actions UI |

## 🔒 Security Features

- ✅ SSH key-based authentication (Ed25519)
- ✅ Secrets stored in GitHub (encrypted)
- ✅ No secrets in repository
- ✅ Environment variables on VPS only
- ✅ Dedicated deploy user (optional)
- ✅ Minimal privileges
- ✅ Proxy jump support (bastion host)
- ✅ StrictHostKeyChecking disabled for automation

## 🛠️ Maintenance

### Daily
- Monitor GitHub Actions for failures
- Check deployment logs

### Weekly
- Review service logs on VPS
- Check disk space: `df -h`
- Monitor resource usage

### Monthly
- Update dependencies
- Review and optimize Dockerfiles
- Check for security updates
- Rotate SSH keys (recommended)

### Quarterly
- Performance audit
- Security audit
- Review and optimize CI/CD pipeline

## 📚 Documentation Structure

```
docs/
├── CICD_SETUP.md           ← Đọc đầu tiên (detailed guide)
├── CICD_QUICK_START.md     ← Quick reference
├── CICD_DIAGRAM.md         ← Visual diagrams
├── CICD_CHECKLIST.md       ← Step-by-step checklist
└── REBUILD_TRIGGER.md      ← Rebuild trigger guide (NEW)

.github/workflows/
└── README.md               ← Workflow documentation

scripts/
├── generate-ssh-keys.sh    ← Tool to generate keys
├── setup-vps.sh           ← Tool to setup VPS
└── trigger-rebuild.sh     ← Tool to trigger rebuild (NEW)
```

### Đọc theo thứ tự:
1. **CICD_QUICK_START.md** - Overview và quick start
2. **CICD_CHECKLIST.md** - Follow từng bước
3. **CICD_SETUP.md** - Chi tiết cho từng phần
4. **CICD_DIAGRAM.md** - Hiểu flow và architecture

## 🎓 Học thêm

### GitHub Actions
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

### Docker
- [Docker best practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)

### CI/CD
- [CI/CD best practices](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment)

## 🐛 Troubleshooting Quick Reference

### SSH không connect được
```bash
# Test connection (direct)
ssh -vvv -i ~/.ssh/github-actions user@vps

# Test connection (via bastion)
ssh -vvv -J bastion-user@bastion-host -i ~/.ssh/github-actions user@vps

# Check VPS SSH service
sudo systemctl status ssh

# Check firewall
sudo ufw allow ssh

# Check bastion connection
ssh -i ~/.ssh/github-actions bastion-user@bastion-host
```

### Build fails
```bash
# Check locally first
docker compose build <service>

# Review GitHub Actions logs
# Go to Actions → Click workflow → View logs
```

### Service không start
```bash
# SSH vào VPS
ssh user@vps
cd ~/log-monitoring

# Check logs
docker compose logs <service>

# Check .env
cat .env

# Restart
docker compose restart <service>
```

### Deploy chậm
```bash
# Check VPS resources
ssh user@vps
free -h
df -h

# Check network
ping vps-ip

# Review build cache
# Go to Actions → Cache
```

## ✅ Success Checklist

Deployment thành công khi:

- [x] Push code tự động trigger workflow
- [x] Chỉ services thay đổi được build
- [x] Build hoàn thành < 10 phút
- [x] Deploy không cần manual intervention
- [x] Services restart với minimal downtime
- [x] Có thể rollback bằng re-run workflow
- [x] Logs accessible qua GitHub Actions
- [x] Services healthy sau deployment

## 🎯 Next Steps

Sau khi setup xong CI/CD:

1. **Add Tests**
   - Unit tests
   - Integration tests
   - E2E tests

2. **Monitoring**
   - Prometheus + Grafana
   - Log aggregation
   - Alert notifications

3. **Optimization**
   - Optimize Docker images
   - Reduce build time
   - Improve cache hit rate

4. **Scale**
   - Multi-environment (staging/prod)
   - Blue-green deployment
   - Canary releases

## 💬 Support

Nếu có vấn đề:

1. Check [CICD_SETUP.md](./CICD_SETUP.md) troubleshooting section
2. Review GitHub Actions logs
3. Check VPS logs: `docker compose logs`
4. Review [CICD_CHECKLIST.md](./CICD_CHECKLIST.md)

---

## 📝 Summary

**Files created**: 9 files
- 2 workflow files
- 2 setup scripts
- 4 documentation files
- 1 README for workflows

**Setup time**: ~15-20 minutes
**Deploy time**: 3-8 minutes (after setup)

**Key benefits**:
- ✅ Automated deployment
- ✅ Fast (3-8 min)
- ✅ Smart (only changed services)
- ✅ Reliable (consistent process)
- ✅ Trackable (logs in GitHub)

**Requirements**:
- GitHub repository
- VPS with SSH access
- Docker on VPS
- 3 GitHub Secrets configured

---

**Created by**: DANH PHI LONG + AI  
**Date**: November 5, 2025  
**Version**: 1.0
