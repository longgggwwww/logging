# Trigger Rebuild cho CI/CD

## Tổng quan

Mỗi service hiện có một file `.rebuild` để trigger CI/CD rebuild mà không cần thay đổi code. File này chứa giá trị `0` hoặc `1` - khi bạn thay đổi giá trị này, GitHub Actions sẽ tự động phát hiện và rebuild service đó.

## Cấu trúc

Mỗi service có file `.rebuild`:
```
services/api/.rebuild              # Flag cho API service
services/processor/.rebuild        # Flag cho Processor service
services/realtime/.rebuild         # Flag cho Realtime service
services/discord-bot/.rebuild      # Flag cho Discord Bot service
services/fcm/.rebuild              # Flag cho FCM service
web-app/.rebuild                   # Flag cho Web App
```

## Cách sử dụng

### Method 1: Sử dụng script (Khuyến nghị)

Script `trigger-rebuild.sh` sẽ tự động toggle giá trị flag:

```bash
# Trigger rebuild cho một service
./scripts/trigger-rebuild.sh api

# Trigger rebuild cho web-app
./scripts/trigger-rebuild.sh web-app

# Trigger rebuild cho TẤT CẢ services
./scripts/trigger-rebuild.sh all

# Xem help
./scripts/trigger-rebuild.sh help
```

**Output:**
```
Triggering rebuild for api...

✓ Toggled api: 0 → 1

✓ api flagged for rebuild

Next steps:
  1. Commit the changes: git add .
  2. Push to trigger CI/CD: git commit -m 'chore: trigger api rebuild' && git push
```

### Method 2: Thay đổi thủ công

Bạn cũng có thể tự thay đổi file:

```bash
# Thay đổi từ 0 → 1
echo "1" > services/api/.rebuild

# Hoặc từ 1 → 0
echo "0" > services/api/.rebuild

# Commit và push
git add services/api/.rebuild
git commit -m "chore: trigger api rebuild"
git push
```

## Workflow

1. **Chạy script hoặc sửa file flag**
   ```bash
   ./scripts/trigger-rebuild.sh api
   ```

2. **Commit changes**
   ```bash
   git add .
   git commit -m "chore: trigger api rebuild"
   ```

3. **Push to GitHub**
   ```bash
   git push
   ```

4. **GitHub Actions tự động:**
   - Phát hiện thay đổi trong `services/api/.rebuild`
   - Trigger rebuild cho API service
   - Build Docker image mới
   - Deploy lên VPS

## Use Cases

### 1. Rebuild sau khi update dependencies

Khi bạn update dependencies trong `package.json` nhưng chưa có code changes:

```bash
./scripts/trigger-rebuild.sh api
git add .
git commit -m "chore: rebuild api after dependency update"
git push
```

### 2. Rebuild tất cả services

Sau khi update shared config hoặc infrastructure:

```bash
./scripts/trigger-rebuild.sh all
git add .
git commit -m "chore: rebuild all services"
git push
```

### 3. Force rebuild một service

Khi cần redeploy service mà không có code changes:

```bash
./scripts/trigger-rebuild.sh processor
git add .
git commit -m "chore: force rebuild processor"
git push
```

### 4. Debug CI/CD

Test CI/CD pipeline cho một service cụ thể:

```bash
./scripts/trigger-rebuild.sh web-app
git add .
git commit -m "test: verify web-app ci/cd"
git push
```

## Lưu ý quan trọng

1. **File luôn toggle**: Script sẽ tự động chuyển `0` → `1` hoặc `1` → `0`, bạn không cần quan tâm giá trị hiện tại

2. **Mỗi lần push chỉ trigger 1 lần**: Sau khi CI/CD chạy, giá trị flag vẫn giữ nguyên. Lần sau muốn rebuild lại, cần toggle lại

3. **Safe to commit**: File `.rebuild` đã được thiết kế để commit vào git

4. **Không ảnh hưởng code**: Thay đổi flag file không ảnh hưởng đến code logic của service

## Technical Details

### GitHub Actions Configuration

Workflow đã được cập nhật để watch `.rebuild` files:

```yaml
filters: |
  api:
    - 'services/api/**'
    - 'services/api/.rebuild'     # ← Thêm dòng này
  processor:
    - 'services/processor/**'
    - 'services/processor/.rebuild'
  # ... tương tự cho các services khác
```

### Cách hoạt động

1. GitHub Actions sử dụng `dorny/paths-filter@v3` để detect changes
2. Khi `.rebuild` file thay đổi, output của filter sẽ là `true`
3. Build job cho service đó sẽ được trigger
4. Service được rebuild và deploy

## Troubleshooting

### Script không chạy được

Đảm bảo script có quyền execute:
```bash
chmod +x scripts/trigger-rebuild.sh
```

### CI/CD không trigger

1. Kiểm tra file đã được commit và push chưa:
   ```bash
   git status
   git log -1
   ```

2. Kiểm tra GitHub Actions workflow:
   - Vào repository → Actions tab
   - Xem workflow runs

3. Kiểm tra branch:
   ```bash
   git branch  # Phải là main branch
   ```

### Service không được deploy

Nếu workflow chạy nhưng service không deploy:
1. Check VPS logs
2. Verify SSH connection
3. Check Docker containers trên VPS

## Examples

### Example 1: Update API dependencies
```bash
# Update package.json
cd services/api
npm install some-new-package

# Trigger rebuild
cd ../..
./scripts/trigger-rebuild.sh api

# Commit all changes
git add .
git commit -m "feat(api): add new package and trigger rebuild"
git push
```

### Example 2: Redeploy after infrastructure change
```bash
# Sau khi update docker-compose.yml hoặc .env
./scripts/trigger-rebuild.sh all

git add .
git commit -m "chore: rebuild all services after infra update"
git push
```

### Example 3: Test deployment
```bash
# Test deploy một service cụ thể
./scripts/trigger-rebuild.sh realtime

git add .
git commit -m "test: verify realtime deployment"
git push

# Xem logs
# Vào GitHub Actions để theo dõi
```

## Integration với Git Workflow

### Pre-push hook (Optional)

Có thể tạo git hook để tự động chạy script:

```bash
# .git/hooks/pre-push
#!/bin/bash

# Tự động trigger rebuild nếu package.json thay đổi
if git diff --name-only HEAD | grep -q "services/.*/package.json"; then
  echo "📦 Detected package.json changes, triggering rebuild..."
  ./scripts/trigger-rebuild.sh all
fi
```

## Best Practices

1. ✅ **Luôn dùng script** thay vì edit thủ công (tránh nhầm lẫn)
2. ✅ **Commit message rõ ràng** để dễ track rebuild history
3. ✅ **Rebuild all** sau infrastructure changes
4. ✅ **Test rebuild** trước khi merge PR quan trọng
5. ❌ **Không rebuild** quá thường xuyên (tốn resources)
6. ❌ **Không commit** nhiều flag changes cùng lúc (khó debug)
