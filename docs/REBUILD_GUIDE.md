# Hướng dẫn Rebuild Services

Tài liệu này hướng dẫn cách rebuild các services và web-app trong hệ thống.

## Tổng quan

Hệ thống sử dụng cơ chế `.rebuild` flag để trigger CI/CD rebuild cho từng service. Khi file `.rebuild` thay đổi giá trị, GitHub Actions sẽ tự động build và deploy service tương ứng.

## Cấu trúc Services

Hệ thống bao gồm các services sau:

1. **API Service** - REST API và WebSocket server
2. **Processor Service** - Xử lý log từ Kafka
3. **Realtime Service** - WebSocket realtime updates
4. **Discord Bot Service** - Bot Discord để nhận thông báo
5. **FCM Service** - Firebase Cloud Messaging cho mobile notifications
6. **Web App** - Giao diện người dùng

## Cách sử dụng

### 1. Script Tương tác (Khuyên dùng)

Script `rebuild-interactive.sh` cung cấp giao diện menu tương tác, dễ sử dụng:

```bash
./scripts/rebuild-interactive.sh
```

**Quy trình:**

1. Hiển thị menu chọn service:
   ```
   Available services:
     1. api
     2. processor
     3. realtime
     4. discord-bot
     5. fcm
     6. web-app
     7. All services
     0. Exit
   ```

2. Chọn số tương ứng với service cần rebuild (1-7)

3. Xác nhận action:
   ```
   You are about to rebuild: api
   Are you sure? [y/N]:
   ```

4. Script tự động toggle flag `.rebuild`

5. Hỏi có muốn commit và push không:
   ```
   Push to remote and trigger CI/CD? [y/N]:
   ```

6. Nếu chọn `y`, script sẽ:
   - Commit thay đổi với message phù hợp
   - Push lên remote repository
   - Trigger CI/CD pipeline tự động

### 2. Script Thủ công

Sử dụng `trigger-rebuild.sh` để rebuild một service cụ thể:

```bash
# Rebuild một service
./scripts/trigger-rebuild.sh api

# Rebuild web-app
./scripts/trigger-rebuild.sh web-app

# Rebuild tất cả services
./scripts/trigger-rebuild.sh all
```

Script này tự động commit và push thay đổi.

### 3. Thao tác thủ công

Nếu muốn kiểm soát hoàn toàn, bạn có thể:

```bash
# 1. Chỉnh sửa file .rebuild
echo "true" > services/api/.rebuild

# 2. Commit thay đổi
git add services/api/.rebuild
git commit -m "ci: trigger rebuild for api"

# 3. Push lên remote
git push
```

## CI/CD Workflow

Khi `.rebuild` flag thay đổi:

1. **GitHub Actions phát hiện thay đổi** trong file `.rebuild`
2. **Workflow tương ứng được trigger:**
   - `services/api/.rebuild` → API build workflow
   - `services/processor/.rebuild` → Processor build workflow
   - `web-app/.rebuild` → Web App build workflow
   - v.v.

3. **Build và deploy tự động:**
   - Build Docker image
   - Push lên Docker registry
   - Deploy lên server (nếu cấu hình)

## Ví dụ Sử dụng

### Ví dụ 1: Rebuild API sau khi sửa code

```bash
./scripts/rebuild-interactive.sh
# Chọn: 1 (api)
# Xác nhận: y
# Push: y
```

### Ví dụ 2: Rebuild nhiều services

Rebuild từng service riêng lẻ:

```bash
./scripts/rebuild-interactive.sh  # Chọn api
./scripts/rebuild-interactive.sh  # Chọn processor
```

Hoặc rebuild tất cả cùng lúc:

```bash
./scripts/rebuild-interactive.sh
# Chọn: 7 (All services)
# Xác nhận: y
# Push: y
```

### Ví dụ 3: Rebuild nhưng chưa push ngay

```bash
./scripts/rebuild-interactive.sh
# Chọn service
# Xác nhận: y
# Push: n  ← Không push ngay

# Sau đó push thủ công khi cần
git push
```

## Troubleshooting

### Script không chạy được

Đảm bảo script có quyền thực thi:

```bash
chmod +x scripts/rebuild-interactive.sh
chmod +x scripts/trigger-rebuild.sh
```

### File .rebuild không tồn tại

Tạo file `.rebuild` cho service:

```bash
echo "false" > services/api/.rebuild
echo "false" > services/processor/.rebuild
echo "false" > services/realtime/.rebuild
echo "false" > services/discord-bot/.rebuild
echo "false" > services/fcm/.rebuild
echo "false" > web-app/.rebuild
```

### CI/CD không chạy sau khi push

Kiểm tra:

1. **GitHub Actions có được enable** trong repository settings
2. **Workflow files** tồn tại trong `.github/workflows/`
3. **Secrets** được cấu hình đúng (xem `GITHUB_SECRETS_SETUP.md`)
4. **Logs** trong GitHub Actions tab để xem lỗi

### Muốn rollback

Nếu build gặp vấn đề, rollback bằng cách:

```bash
# Revert commit
git revert HEAD

# Push
git push
```

## Best Practices

1. **Rebuild từng service riêng** khi có thay đổi nhỏ
2. **Test local** trước khi rebuild trên production
3. **Kiểm tra logs** sau khi deploy
4. **Sử dụng interactive script** để tránh nhầm lẫn
5. **Đọc output** của script để đảm bảo không có lỗi

## Tham khảo

- [CI/CD Setup](./CICD_SETUP.md) - Cấu hình CI/CD chi tiết
- [CI/CD Quick Start](./CICD_QUICK_START.md) - Bắt đầu nhanh với CI/CD
- [GitHub Secrets Setup](./GITHUB_SECRETS_SETUP.md) - Cấu hình secrets
- [Architecture](./ARCHITECTURE.md) - Kiến trúc tổng thể hệ thống
