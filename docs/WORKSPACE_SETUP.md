# NPM Workspaces Setup

## Tổng quan

Project này sử dụng **npm workspaces** để quản lý dependencies chung giữa các services. Điều này giúp:

- ✅ Tiết kiệm dung lượng đĩa (~60-70%)
- ✅ Cài đặt nhanh hơn (chỉ cần `npm install` một lần)
- ✅ Đồng bộ version của các dependencies chung
- ✅ Dễ dàng quản lý và update dependencies

## Cấu trúc

```
/home/ad/log-monitoring/
├── package.json                 # Root workspace config
├── node_modules/                # Shared node_modules cho tất cả services
│   ├── typescript/              # Common: tất cả services dùng
│   ├── eslint/                  # Common: tất cả services dùng
│   ├── kafkajs/                 # Common: discord-bot, fcm, processor, realtime
│   └── ...
├── services/
│   ├── api/
│   │   ├── package.json         # Chỉ chứa dependencies riêng của api
│   │   └── node_modules/        # Chỉ có dependencies riêng (compression, express...)
│   ├── discord-bot/
│   │   ├── package.json         # Chỉ chứa dependencies riêng
│   │   └── node_modules/        # Chỉ có discord.js
│   └── ...
└── test-producer/
    ├── package.json
    └── node_modules/
```

## Dependencies được chia sẻ

### Ở Root (`/home/ad/log-monitoring/package.json`)

**Common dependencies:**
- `kafkajs` - Dùng bởi discord-bot, fcm, processor, realtime
- `dotenv` - Dùng bởi discord-bot, fcm

**Common devDependencies:**
- `typescript` - Tất cả services
- `eslint` + plugins - Tất cả services
- `prettier` - Tất cả services
- `@types/node` - Tất cả services

### Ở Services (riêng biệt)

Mỗi service chỉ khai báo dependencies **đặc thù** của nó:

- **api**: `express`, `redis`, `mongoose`, `keycloak-connect`...
- **discord-bot**: `discord.js`
- **fcm**: `firebase-admin`
- **processor**: `mongoose`, `redis`
- **realtime**: `socket.io`, `cors`

## Cách sử dụng

### 1. Cài đặt tất cả dependencies

```bash
# Từ root directory
cd /home/ad/log-monitoring
npm install
```

Lệnh này sẽ:
- Cài đặt dependencies chung vào `/home/ad/log-monitoring/node_modules/`
- Tự động cài đặt dependencies riêng cho từng service
- Tạo symlinks giữa workspace packages

### 2. Build tất cả services

```bash
npm run build:all
```

### 3. Lint/Format toàn bộ code

```bash
npm run lint:all
npm run lint:fix:all
npm run format:all
```

### 4. Làm việc với service cụ thể

```bash
# Chạy script cho một service cụ thể
npm run build --workspace=services/discord-bot
npm run dev --workspace=services/api

# Hoặc cd vào service
cd services/discord-bot
npm run build
npm run dev
```

### 5. Thêm dependency mới

**Thêm vào ROOT (nếu nhiều services dùng chung):**
```bash
npm install kafkajs --save
npm install typescript --save-dev
```

**Thêm vào service cụ thể:**
```bash
npm install express --workspace=services/api
npm install discord.js --workspace=services/discord-bot
```

### 6. Update dependencies

```bash
# Update tất cả
npm update

# Update một package cụ thể
npm update typescript

# Update trong một workspace
npm update --workspace=services/api
```

## Docker Build với Workspaces

Dockerfiles đã được cập nhật để tối ưu với workspaces:

```dockerfile
# Build từ root context
FROM node:20-alpine AS builder
WORKDIR /workspace

# Copy tất cả package.json files (để npm workspaces hoạt động)
COPY package*.json ./
COPY services/*/package*.json ./services/

# Cài đặt (npm ci sẽ tự động xử lý workspaces)
RUN npm ci

# Copy source và build service cụ thể
COPY services/discord-bot ./services/discord-bot
WORKDIR /workspace/services/discord-bot
RUN npm run build
```

**Lưu ý:** Docker compose phải build từ root context:

```yaml
discord-bot:
  build:
    context: .  # Root directory, không phải ./services/discord-bot
    dockerfile: ./services/discord-bot/Dockerfile
```

## Lợi ích cụ thể

### Trước khi dùng workspaces:
```bash
# Phải cài đặt từng service
cd services/api && npm install
cd services/discord-bot && npm install
cd services/fcm && npm install
cd services/processor && npm install
cd services/realtime && npm install
cd test-producer && npm install

# Tổng node_modules: ~800MB
# Thời gian: ~5 phút
```

### Sau khi dùng workspaces:
```bash
# Chỉ cần một lần
npm install

# Tổng node_modules: ~250MB (giảm 70%)
# Thời gian: ~1 phút (nhanh hơn 5x)
```

## Troubleshooting

### Lỗi: "Cannot find module"

Thử xóa tất cả `node_modules` và cài lại:
```bash
rm -rf node_modules services/*/node_modules test-producer/node_modules
npm install
```

### Lỗi Docker build

Đảm bảo `docker-compose.yml` build từ root context:
```yaml
build:
  context: .  # NOT ./services/xxx
  dockerfile: ./services/xxx/Dockerfile
```

### Dependency conflict

Kiểm tra version trong root `package.json` và service `package.json`. Nếu cần version khác nhau, để riêng trong service package.json.

## Migration từ cấu trúc cũ

Nếu đang có `node_modules` cũ trong các service:

```bash
# 1. Xóa tất cả node_modules cũ
rm -rf services/*/node_modules test-producer/node_modules

# 2. Cài đặt lại với workspaces
npm install

# 3. Verify
npm list --workspaces
```

## Best Practices

1. **Luôn cài đặt từ root**: `cd /home/ad/log-monitoring && npm install`
2. **Đưa common deps lên root**: Nếu 2+ services dùng chung một package
3. **Keep service-specific deps riêng**: Ví dụ `discord.js` chỉ trong discord-bot
4. **Version consistency**: Sử dụng cùng version cho common dependencies
5. **Lock file**: Commit `package-lock.json` để đảm bảo consistency

## Tham khảo

- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Monorepo Best Practices](https://monorepo.tools/)
