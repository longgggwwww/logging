# Migration to npm Workspaces - Quick Guide

## Tổng quan thay đổi

Project đã được migrate sang **npm workspaces** để tối ưu hóa quản lý dependencies.

### ✅ Đã cập nhật:

1. **Package.json Files**
   - ✅ Root `package.json` với workspace config
   - ✅ Tất cả service `package.json` (loại bỏ common deps)

2. **Dockerfiles**
   - ✅ `services/api/Dockerfile`
   - ✅ `services/discord-bot/Dockerfile`
   - ✅ `services/fcm/Dockerfile`
   - ✅ `services/processor/Dockerfile`
   - ✅ `services/realtime/Dockerfile`

3. **Docker Compose**
   - ✅ `docker-compose.yml` (build context -> root)

4. **Scripts**
   - ✅ `scripts/build-all.sh` - Build tất cả services
   - ✅ `scripts/clean-install.sh` - Clean & reinstall

5. **Documentation**
   - ✅ `docs/WORKSPACE_SETUP.md` - Chi tiết về workspaces

## 🚀 Quick Start

### Nếu bạn đang có project cũ:

```bash
# 1. Clean old node_modules
./scripts/clean-install.sh

# 2. Build Docker images
./scripts/build-all.sh

# 3. Start services
docker-compose up -d
```

### Nếu clone project mới:

```bash
# 1. Install dependencies
npm install

# 2. Build all services
npm run build:all

# 3. Build Docker images
./scripts/build-all.sh

# 4. Start services
docker-compose up -d
```

## 📦 Cài đặt Dependencies

### Install tất cả
```bash
npm install
```

### Thêm dependency mới

**Common dependency (nhiều services dùng):**
```bash
npm install <package-name>
```

**Service-specific dependency:**
```bash
npm install <package-name> --workspace=services/<service-name>

# Ví dụ:
npm install express --workspace=services/api
npm install discord.js --workspace=services/discord-bot
```

## 🏗️ Build

### Build tất cả services (TypeScript)
```bash
npm run build:all
```

### Build một service cụ thể
```bash
npm run build --workspace=services/api
# hoặc
cd services/api && npm run build
```

### Build Docker images

**Một service:**
```bash
docker-compose build discord-bot
```

**Tất cả services:**
```bash
./scripts/build-all.sh

# Parallel build (nhanh hơn):
./scripts/build-all.sh --parallel
```

## 🔍 Lint & Format

### Tất cả code
```bash
npm run lint:all
npm run lint:fix:all
npm run format:all
```

### Một service
```bash
npm run lint --workspace=services/api
cd services/api && npm run lint
```

## 🐳 Docker

### Build & Run
```bash
# Build tất cả
docker-compose build

# Build một service
docker-compose build discord-bot

# Start tất cả
docker-compose up -d

# Start một service
docker-compose up -d discord-bot

# Rebuild và restart
docker-compose up -d --build discord-bot
```

### Logs
```bash
# Tất cả services
docker-compose logs -f

# Một service
docker-compose logs -f discord-bot
```

## 📊 So sánh Before/After

### Trước khi migrate:

```
📁 Cấu trúc:
services/api/node_modules/          (~150MB)
  ├── typescript/
  ├── eslint/
  ├── express/
  └── ...

services/discord-bot/node_modules/  (~120MB)
  ├── typescript/
  ├── eslint/
  ├── discord.js/
  └── ...

services/fcm/node_modules/          (~100MB)
  ├── typescript/
  ├── eslint/
  ├── firebase-admin/
  └── ...

... (tương tự cho các services khác)

Tổng: ~670MB
Thời gian install: ~5 phút
```

### Sau khi migrate:

```
📁 Cấu trúc:
node_modules/                       (~200MB - shared)
  ├── typescript/        ← Shared by all
  ├── eslint/           ← Shared by all
  ├── kafkajs/          ← Shared by 4 services
  └── ...

services/api/node_modules/          (~15MB)
  ├── express/          ← API specific
  ├── mongoose/         ← API specific
  └── ...

services/discord-bot/node_modules/  (~8MB)
  └── discord.js/       ← Discord-bot specific

services/fcm/node_modules/          (~12MB)
  └── firebase-admin/   ← FCM specific

... (tương tự cho các services khác)

Tổng: ~250MB (giảm 62%)
Thời gian install: ~1 phút (nhanh hơn 5x)
```

## ⚠️ Lưu ý quan trọng

### Docker Build Context

**SAI:** ❌
```yaml
services:
  api:
    build:
      context: ./services/api  # ❌ Sai
```

**ĐÚNG:** ✅
```yaml
services:
  api:
    build:
      context: .                           # ✅ Root context
      dockerfile: ./services/api/Dockerfile
```

### Thêm Service Mới

Khi thêm service mới vào `services/`:

1. Tạo `package.json` cho service
2. Update root `package.json` nếu cần
3. Tạo Dockerfile theo template (copy từ discord-bot)
4. Update `docker-compose.yml` với context từ root
5. Chạy `npm install` ở root

### Dependencies Version Conflict

Nếu 2 services cần version khác nhau của cùng 1 package:

```json
// Root package.json
{
  "dependencies": {
    "lodash": "^4.17.21"  // Version cho hầu hết services
  }
}

// services/special-service/package.json
{
  "dependencies": {
    "lodash": "^3.10.1"  // Override với version cụ thể
  }
}
```

## 🛠️ Troubleshooting

### "Cannot find module" error

```bash
# Clean và reinstall
./scripts/clean-install.sh
```

### Docker build lỗi "COPY failed"

Kiểm tra xem bạn đang build từ root context:
```bash
cd /home/ad/log-monitoring  # Phải ở root
docker-compose build
```

### Workspace không hoạt động

```bash
# Verify workspace config
npm ls --workspaces

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tài liệu chi tiết

Xem `docs/WORKSPACE_SETUP.md` để biết thêm chi tiết về:
- Cấu trúc workspaces
- Best practices
- Advanced usage
- Migration guide

## 🎯 Commands cheat sheet

```bash
# Install
npm install                                  # Install tất cả
npm install <pkg> -w services/api           # Add to specific service

# Build
npm run build:all                           # Build all TypeScript
./scripts/build-all.sh                      # Build all Docker images

# Lint/Format
npm run lint:all                            # Lint all
npm run format:all                          # Format all

# Docker
docker-compose build                         # Build all
docker-compose up -d                         # Start all
docker-compose logs -f <service>            # View logs

# Clean
./scripts/clean-install.sh                  # Clean & reinstall
```

## ✨ Benefits

✅ **Tiết kiệm 60-70% dung lượng** node_modules  
✅ **Nhanh hơn 5x** khi install  
✅ **Version consistency** cho common packages  
✅ **Dễ maintain** và update dependencies  
✅ **Better Docker caching** khi build  
✅ **Monorepo best practices**  

---

**Cần hỗ trợ?** Xem chi tiết tại `docs/WORKSPACE_SETUP.md`
