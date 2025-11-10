# So Sánh GitHub Actions vs GitLab CI/CD

## Tổng Quan Khác Biệt

| Aspect | GitHub Actions | GitLab CI/CD |
|--------|---------------|--------------|
| **Config File** | `.github/workflows/ci-cd.yml` | `.gitlab-ci.yml` |
| **Syntax** | YAML với jobs + steps | YAML với stages + jobs + scripts |
| **Parallelism** | Jobs chạy parallel mặc định | Jobs trong cùng stage chạy parallel |
| **Change Detection** | Sử dụng action `dorny/paths-filter` | Tự implement bằng git diff |
| **Artifacts** | `actions/upload-artifact` | Built-in `artifacts` keyword |
| **Variables/Secrets** | GitHub Secrets | GitLab Variables |
| **Conditional Execution** | `if` conditions | `rules` hoặc `only/except` |
| **Docker** | Docker Buildx Actions | Docker-in-Docker service |

## Chi Tiết Từng Phần

### 1. Change Detection

#### GitHub Actions
```yaml
- name: Check for changes
  uses: dorny/paths-filter@v3
  id: filter
  with:
    filters: |
      api:
        - 'services/api/**'
        - 'services/api/.rebuild'
```

**Ưu điểm**: 
- Sử dụng action có sẵn, đơn giản
- Tự động parse patterns

**Nhược điểm**:
- Phụ thuộc vào third-party action
- Ít linh hoạt trong customization

#### GitLab CI/CD
```yaml
detect-changes:
  stage: detect
  script:
    - |
      if git diff --name-only $BASE_SHA $CI_COMMIT_SHA | grep -E '^services/api/'; then
        echo "API_CHANGED=true" >> changes.env
      fi
  artifacts:
    reports:
      dotenv: changes.env
```

**Ưu điểm**:
- Control hoàn toàn logic detection
- Không phụ thuộc external dependencies
- Linh hoạt customize

**Nhược điểm**:
- Phải tự implement logic
- Code dài hơn

### 2. Build Configuration

#### GitHub Actions
```yaml
build:
  strategy:
    matrix:
      include:
        - service: api
          changed: ${{ needs.detect-changes.outputs.api }}
          context: .
          dockerfile: ./services/api/Dockerfile
  steps:
    - name: Build Docker image
      if: matrix.changed == 'true'
      uses: docker/build-push-action@v5
      with:
        context: ${{ matrix.context }}
        file: ${{ matrix.dockerfile }}
```

**Ưu điểm**:
- Matrix strategy cho multiple services
- Build cache tự động với GitHub Actions
- Sử dụng Docker Buildx natively

**Nhược điểm**:
- Phức tạp với matrix syntax
- Skip logic cần if conditions

#### GitLab CI/CD
```yaml
build-api:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  script:
    - |
      if [ "$API_CHANGED" = "true" ]; then
        docker build -t api:latest -f ./services/api/Dockerfile .
        docker save api:latest -o api.tar
      fi
  artifacts:
    paths:
      - api.tar
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      changes:
        - services/api/**/*
```

**Ưu điểm**:
- Mỗi service có job riêng, dễ debug
- Rules cho conditional execution rõ ràng
- Docker-in-Docker service integration tốt

**Nhược điểm**:
- Duplicate code cho mỗi service
- Cache configuration phức tạp hơn

### 3. Artifacts Management

#### GitHub Actions
```yaml
- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: ${{ matrix.service }}-image
    path: /tmp/${{ matrix.service }}.tar
    retention-days: 1

- name: Download artifacts
  uses: actions/download-artifact@v4
  with:
    path: /tmp/images
```

**Ưu điểm**:
- Actions handle upload/download
- Syntax đơn giản

**Nhược điểm**:
- Cần 2 actions riêng biệt
- Path management phức tạp hơn

#### GitLab CI/CD
```yaml
build-api:
  artifacts:
    paths:
      - api.tar
    expire_in: 1 hour

deploy-to-vps:
  dependencies:
    - build-api
  script:
    - scp api.tar vps:~/deployment/
```

**Ưu điểm**:
- Built-in, không cần external actions
- Dependencies tự động download artifacts
- Expiration time linh hoạt

**Nhược điểm**:
- Phải manual list dependencies

### 4. SSH Deployment

#### GitHub Actions
```yaml
- name: Setup SSH
  uses: webfactory/ssh-agent@v0.9.0
  with:
    ssh-private-key: ${{ secrets.VPS_SSH_PRIVATE_KEY }}

- name: Configure SSH
  run: |
    cat >> ~/.ssh/config << EOF
    Host bastion
      HostName ${{ secrets.VPS_BASTION_HOST }}
      User ${{ secrets.VPS_BASTION_USER }}
    EOF
```

**Ưu điểm**:
- SSH agent action quản lý keys
- Secrets management tốt

**Nhược điểm**:
- Phụ thuộc vào third-party action
- Setup phức tạp

#### GitLab CI/CD
```yaml
deploy-to-vps:
  before_script:
    - apk add --no-cache openssh-client
    - echo "$VPS_SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - cat >> ~/.ssh/config << EOF
      Host bastion
        HostName $VPS_BASTION_HOST
        User $VPS_BASTION_USER
      EOF
```

**Ưu điểm**:
- Control hoàn toàn SSH setup
- Không phụ thuộc external actions
- Customization dễ dàng

**Nhược điểm**:
- Phải manual setup SSH
- Code dài hơn

### 5. Conditional Execution

#### GitHub Actions
```yaml
deploy:
  if: |
    github.event_name == 'push' && 
    github.ref == 'refs/heads/main' && 
    needs.detect-changes.outputs.any-service == 'true'
  steps:
    - name: Deploy
      if: matrix.changed == 'true'
```

**Ưu điểm**:
- If conditions dễ đọc
- Hỗ trợ expressions phức tạp

**Nhược điểm**:
- If conditions ở nhiều levels (job + step)
- Syntax verbose với `${{ }}`

#### GitLab CI/CD
```yaml
deploy-to-vps:
  only:
    - main
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      changes:
        - services/api/**/*
      when: always
```

**Ưu điểm**:
- Rules syntax clear và concise
- Changes detection built-in
- only/except keywords đơn giản

**Nhược điểm**:
- Rules có thể conflict với only/except
- Learning curve với rules syntax

### 6. Variables và Secrets

#### GitHub Actions
```yaml
env:
  DOCKER_BUILDKIT: 1
  
jobs:
  build:
    env:
      API_URL: ${{ secrets.API_URL }}
    steps:
      - name: Build
        run: echo $API_URL
        env:
          LOCAL_VAR: value
```

**Ưu điểm**:
- Scoping rõ ràng (workflow/job/step level)
- Secrets có UI quản lý tốt
- Environment variables inheritance

**Nhược điểm**:
- Syntax `${{ secrets.VAR }}` verbose
- Cần define ở nhiều levels

#### GitLab CI/CD
```yaml
variables:
  DOCKER_BUILDKIT: 1
  
job:
  variables:
    LOCAL_VAR: value
  script:
    - echo $API_URL
    - echo $LOCAL_VAR
```

**Ưu điểm**:
- Syntax đơn giản `$VAR`
- Variables có thể define ở nhiều levels (global, job)
- Group/project level variables

**Nhược điểm**:
- Protected/masked configuration cần manual setup
- Ít type safety hơn

### 7. Caching

#### GitHub Actions
```yaml
- name: Setup Buildx
  uses: docker/setup-buildx-action@v3
  
- name: Build
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Ưu điểm**:
- Docker layer cache tự động
- Cache với GitHub Actions cache service
- No configuration needed

**Nhược điểm**:
- Giới hạn storage
- Cache hit rate có thể thấp

#### GitLab CI/CD
```yaml
job:
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/
  script:
    - npm ci
```

**Ưu điểm**:
- Control cache keys linh hoạt
- Cache theo branch/tag/commit
- Per-job cache config

**Nhược điểm**:
- Docker cache phức tạp hơn
- Cần manual configuration

## Performance Comparison

| Metric | GitHub Actions | GitLab CI/CD |
|--------|---------------|--------------|
| **Cold Start** | ~30-60s (shared runners) | ~20-40s (shared runners) |
| **Build Time** | Similar | Similar |
| **Cache Speed** | Fast (GitHub cache) | Depends on runner |
| **Artifact Upload** | Moderate | Fast (built-in) |
| **Total Pipeline** | ~15-20 min | ~15-20 min |

## Feature Comparison

### GitHub Actions có nhưng GitLab không có sẵn:
- ✅ Marketplace với thousands of actions
- ✅ Matrix strategy built-in
- ✅ Reusable workflows
- ✅ GitHub environment protection rules
- ✅ Native Docker Buildx integration

### GitLab CI/CD có nhưng GitHub Actions không có sẵn:
- ✅ Built-in Docker-in-Docker
- ✅ Auto DevOps
- ✅ Review Apps
- ✅ Dynamic environments
- ✅ Pipeline triggers & schedules (more flexible)
- ✅ Built-in container registry

## Cost Comparison

### GitHub Actions
- **Free tier**: 2,000 minutes/month for private repos
- **Public repos**: Unlimited
- **Pricing**: $0.008/minute for private repos (Linux)

### GitLab CI/CD
- **Free tier**: 400 CI/CD minutes/month (GitLab.com)
- **Self-hosted**: Unlimited với GitLab Runner riêng
- **Pricing**: $10/user/month (Premium) - 10,000 minutes

## Khi Nào Nên Dùng Cái Nào?

### Chọn GitHub Actions khi:
- ✅ Repository đã host trên GitHub
- ✅ Cần integrate với GitHub ecosystem (Issues, PRs, etc.)
- ✅ Muốn sử dụng marketplace actions
- ✅ Team quen với GitHub workflow
- ✅ Public open source project (unlimited minutes)

### Chọn GitLab CI/CD khi:
- ✅ Repository đã host trên GitLab
- ✅ Cần self-hosted CI/CD (GitLab Runner)
- ✅ Muốn control hoàn toàn infrastructure
- ✅ Cần built-in container registry
- ✅ Team quen với GitLab workflow
- ✅ Cần Auto DevOps features

## Migration Tips

### Từ GitHub Actions sang GitLab CI/CD:

1. **Replace actions với scripts**:
   ```yaml
   # GitHub Actions
   - uses: actions/checkout@v4
   
   # GitLab CI/CD  
   # Không cần - GitLab tự động checkout
   ```

2. **Convert matrix sang multiple jobs**:
   ```yaml
   # GitHub Actions
   strategy:
     matrix:
       service: [api, processor]
   
   # GitLab CI/CD
   build-api: ...
   build-processor: ...
   ```

3. **Change variables syntax**:
   ```yaml
   # GitHub Actions
   ${{ secrets.VAR }}
   
   # GitLab CI/CD
   $VAR
   ```

4. **Convert if conditions sang rules**:
   ```yaml
   # GitHub Actions
   if: github.ref == 'refs/heads/main'
   
   # GitLab CI/CD
   only:
     - main
   ```

## Kết Luận

Cả hai platforms đều mạnh mẽ và đáp ứng được nhu cầu CI/CD. Lựa chọn phụ thuộc vào:
- Nơi host code (GitHub vs GitLab)
- Team expertise
- Budget và pricing model
- Self-hosted requirements
- Ecosystem integration needs

Trong project này, chúng ta đã implement cả hai để có flexibility khi cần migrate hoặc sử dụng cả hai platforms.
