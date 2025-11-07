# GitHub Workflows

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### 🚀 `deploy.yml` (Recommended)
**Optimized deployment workflow for production**

**Triggers:**
- Push to `main` branch

**Features:**
- ✅ Smart change detection (only build what changed)
- ✅ Parallel builds for multiple services
- ✅ GitHub Actions cache for faster builds
- ✅ Optimized deployment (only restart changed services)
- ✅ No downtime deployment
- ✅ Automatic cleanup

**Typical Runtime:**
- Single service: 3-5 minutes
- Multiple services: 5-8 minutes
- All services: 8-12 minutes

---

### 🔬 `ci-cd.yml` (Full Pipeline)
**Complete CI/CD pipeline with testing**

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Features:**
- ✅ All features from `deploy.yml`
- ✅ PR validation
- ✅ Testing stage (when tests are added)
- ✅ Build verification

**Use when:**
- You want to test PRs before merging
- You need full validation pipeline
- You're setting up testing infrastructure

---

## Configuration

### Required GitHub Secrets

Add these in: **Repository → Settings → Secrets and variables → Actions**

| Secret | Description | Example |
|--------|-------------|---------|
| `VPS_SSH_PRIVATE_KEY` | Private SSH key for VPS access | Content of `~/.ssh/github-actions` |
| `VPS_HOST` | VPS IP address or domain | `192.168.1.100` or `your-vps.com` |
| `VPS_USER` | VPS username | `deploy` or `ubuntu` |

### Setup Instructions

1. **Generate SSH keys:**
   ```bash
   cd /home/ad/log-monitoring
   ./scripts/generate-ssh-keys.sh
   ```

2. **Add public key to VPS:**
   ```bash
   # On VPS
   mkdir -p ~/.ssh
   echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Add secrets to GitHub:**
   - Go to repository settings
   - Add the 3 required secrets
   - Copy exact values (including BEGIN/END markers for private key)

4. **Push to main:**
   ```bash
   git push origin main
   ```

---

## How It Works

### Change Detection

The workflows automatically detect which services changed:

```yaml
services/api/**         → Rebuild api
services/processor/**   → Rebuild processor
services/realtime/**    → Rebuild realtime
services/discord-bot/** → Rebuild discord-bot
services/fcm/**         → Rebuild fcm
web-app/**             → Rebuild web-app
```

### Build Process

1. **Detect changes** - Which services need to be rebuilt?
2. **Parallel build** - Build all changed services simultaneously
3. **Cache utilization** - Reuse layers from previous builds
4. **Artifact upload** - Save Docker images as artifacts

### Deployment Process

1. **Download artifacts** - Get built Docker images
2. **Transfer to VPS** - Upload via rsync (optimized)
3. **Load images** - Import Docker images on VPS
4. **Smart restart** - Only restart changed services
5. **Cleanup** - Remove old images and artifacts

---

## Monitoring

### View Workflow Status

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. View individual job logs

### Check Deployment on VPS

```bash
# SSH to VPS
ssh user@your-vps

# Check running services
cd ~/log-monitoring
docker compose ps

# View logs
docker compose logs -f <service-name>

# View all logs
docker compose logs -f
```

---

## Customization

### Change Deployment Branch

To deploy from a different branch:

```yaml
on:
  push:
    branches:
      - main        # Change this
      - production  # Add more branches
```

### Add Environment-Specific Deployments

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    # ... deploy to staging VPS

  deploy-production:
    if: github.ref == 'refs/heads/main'
    # ... deploy to production VPS
```

### Add Slack/Discord Notifications

```yaml
- name: Notify deployment
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Testing Stage

```yaml
test:
  name: Run Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run tests
      run: npm test
```

---

## Troubleshooting

### ❌ SSH Connection Failed

**Problem:** Cannot connect to VPS

**Solutions:**
1. Check VPS is accessible: `ping your-vps-ip`
2. Verify SSH service: `ssh user@your-vps`
3. Check firewall: `sudo ufw status`
4. Verify SSH key in secrets (include BEGIN/END lines)

### ❌ Docker Permission Denied

**Problem:** User cannot run docker commands

**Solution:**
```bash
# On VPS
sudo usermod -aG docker $USER
newgrp docker
```

### ❌ Service Won't Start

**Problem:** Service fails to start after deployment

**Solutions:**
1. Check logs: `docker compose logs <service>`
2. Verify .env file on VPS
3. Check dependencies: `docker compose ps`
4. Restart: `docker compose restart <service>`

### ❌ Build Timeout

**Problem:** Build takes too long

**Solutions:**
1. Check if cache is working
2. Optimize Dockerfile (multi-stage builds)
3. Increase timeout in workflow
4. Build locally first to warm cache

---

## Performance Tips

### 1. Optimize Docker Builds

```dockerfile
# Good: Copy package files first (cached layer)
COPY package*.json ./
RUN npm install

# Then copy source code (changes frequently)
COPY . .
```

### 2. Use Build Cache

Workflows already configured with:
```yaml
cache-from: type=gha,scope=${{ matrix.service }}
cache-to: type=gha,mode=max,scope=${{ matrix.service }}
```

### 3. Minimize Image Size

- Use Alpine-based images
- Multi-stage builds
- Remove dev dependencies in production
- Use .dockerignore

---

## Security Best Practices

- ✅ Use dedicated SSH keys for CI/CD
- ✅ Never commit secrets to repository
- ✅ Rotate SSH keys periodically
- ✅ Use least-privilege user on VPS
- ✅ Enable firewall on VPS
- ✅ Use HTTPS for all external services
- ✅ Keep dependencies updated

---

## Related Documentation

- [CICD_SETUP.md](../docs/CICD_SETUP.md) - Detailed setup guide (Vietnamese)
- [CICD_QUICK_START.md](../docs/CICD_QUICK_START.md) - Quick reference
- [DOCKER_COMPOSE_ARCHITECTURE.md](../docs/DOCKER_COMPOSE_ARCHITECTURE.md) - Infrastructure docs

---

**Questions?** Check the [CICD_SETUP.md](../docs/CICD_SETUP.md) for detailed troubleshooting.
