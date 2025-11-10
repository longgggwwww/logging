# GitLab CI/CD - Quick Reference Card

## 🎯 Pipeline Overview

| Stage | Jobs | Duration | Runs When |
|-------|------|----------|-----------|
| **detect** | detect-changes | ~20s | Always |
| **build** | 6 parallel jobs | ~4-10 min | On changes |
| **deploy** | deploy-to-vps | ~2-3 min | On main only |

## 📝 Configuration Checklist

### GitLab Variables (Settings → CI/CD → Variables)

| Variable | Type | Protected | Masked | Example |
|----------|------|-----------|--------|---------|
| `VPS_SSH_PRIVATE_KEY` | Variable | ✅ | ✅ | `-----BEGIN RSA...` |
| `VPS_BASTION_HOST` | Variable | ✅ | ❌ | `bastion.example.com` |
| `VPS_BASTION_USER` | Variable | ✅ | ❌ | `ubuntu` |
| `VPS_HOST` | Variable | ✅ | ❌ | `192.168.1.100` |
| `VPS_USER` | Variable | ✅ | ❌ | `deploy` |
| `KEYCLOAK_CLIENT_SECRET` | Variable | ✅ | ✅ | `secret-value` |

## 🚀 Common Commands

### SSH Setup
```bash
# Generate key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gitlab-ci-key

# Copy to bastion
ssh-copy-id -i ~/.ssh/gitlab-ci-key.pub user@bastion

# Copy to VPS (via bastion)
ssh-copy-id -i ~/.ssh/gitlab-ci-key.pub -J user@bastion user@vps

# Test connection
ssh -i ~/.ssh/gitlab-ci-key -J user@bastion user@vps
```

### Trigger Rebuild
```bash
# Single service
touch services/api/.rebuild && git add . && git commit -m "Rebuild API" && git push

# Multiple services
touch services/{api,processor,realtime}/.rebuild && git add . && git commit -m "Rebuild services" && git push

# All services
touch services/*/.rebuild web-app/.rebuild && git add . && git commit -m "Rebuild all" && git push
```

### VPS Management
```bash
# SSH to VPS
ssh -J user@bastion user@vps

# Check services
cd ~/log-monitoring
docker compose ps

# View logs
docker compose logs -f api
docker compose logs --tail=50 processor

# Restart service
docker compose restart api

# Rebuild & restart
docker compose up -d --force-recreate api

# Check disk space
docker system df

# Cleanup
docker system prune -af
```

## 🔍 Troubleshooting Quick Guide

### Issue: SSH Connection Failed
```bash
# Test connection
ssh -vvv -i ~/.ssh/gitlab-ci-key user@bastion

# Check key permissions
chmod 600 ~/.ssh/gitlab-ci-key
ls -la ~/.ssh/

# Verify authorized_keys on server
ssh user@bastion "cat ~/.ssh/authorized_keys"
```

### Issue: Build Failed
```bash
# Check locally
docker build -t test -f services/api/Dockerfile .

# With no cache
docker build --no-cache -t test -f services/api/Dockerfile .

# Check logs in GitLab UI
# CI/CD → Pipelines → Click job → View logs
```

### Issue: Service Won't Start
```bash
# SSH to VPS
ssh -J user@bastion user@vps
cd ~/log-monitoring

# Check logs
docker compose logs api

# Check dependencies
docker compose ps postgres mongodb redis

# Restart infrastructure
docker compose up -d postgres mongodb redis kafka-1 kafka-2 kafka-3
sleep 30
docker compose up -d api processor realtime
```

### Issue: Out of Disk Space
```bash
# Check disk usage
df -h
docker system df -v

# Cleanup (aggressive)
docker system prune -af --volumes

# Stop all and cleanup
docker compose down
docker system prune -af
docker compose up -d
```

## 📊 Pipeline Status

### Success Indicators
- ✅ All stages green
- ✅ Services running on VPS
- ✅ `docker compose ps` shows healthy containers
- ✅ Application accessible

### Failure Indicators
- ❌ Red X on any stage
- ❌ Services not running
- ❌ Error logs in GitLab UI
- ❌ Application not accessible

## 🎨 GitLab CI/CD Syntax Quick Reference

### Job Structure
```yaml
job-name:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  variables:
    VAR: value
  before_script:
    - setup commands
  script:
    - main commands
  after_script:
    - cleanup commands
  artifacts:
    paths:
      - file.tar
    expire_in: 1 hour
  dependencies:
    - other-job
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: always
  only:
    - main
```

### Conditional Execution
```yaml
# Using rules (recommended)
rules:
  - if: '$CI_COMMIT_BRANCH == "main"'
    changes:
      - services/api/**/*
    when: always
  - when: never

# Using only/except
only:
  - main
  - merge_requests
except:
  - tags
```

### Variables
```yaml
# Global
variables:
  GLOBAL_VAR: value

# Job level
job:
  variables:
    JOB_VAR: value
  script:
    - echo $GLOBAL_VAR
    - echo $JOB_VAR
```

## 🔄 GitHub Actions vs GitLab CI/CD

| Feature | GitHub Actions | GitLab CI/CD |
|---------|---------------|--------------|
| Config file | `.github/workflows/*.yml` | `.gitlab-ci.yml` |
| Checkout | `actions/checkout@v4` | Automatic |
| Artifacts | `actions/upload-artifact@v4` | `artifacts:` keyword |
| Variables | `${{ secrets.VAR }}` | `$VAR` |
| Conditions | `if: condition` | `rules:` or `only:` |
| Docker | `docker/build-push-action` | `docker:dind` service |

## 📦 Service Build Matrix

| Service | Context | Dockerfile | Build Args | Cache |
|---------|---------|------------|------------|-------|
| api | `.` | `services/api/Dockerfile` | ✅ Keycloak | ✅ |
| processor | `.` | `services/processor/Dockerfile` | ❌ | ✅ |
| realtime | `.` | `services/realtime/Dockerfile` | ❌ | ✅ |
| discord-bot | `.` | `services/discord-bot/Dockerfile` | ❌ | ✅ |
| fcm | `.` | `services/fcm/Dockerfile` | ❌ | ✅ |
| web-app | `./web-app` | `web-app/Dockerfile` | ✅ All | ❌ |

## 🎯 File Structure

```
.
├── .gitlab-ci.yml                      # Pipeline config
├── docker-compose.yml                   # Services definition
├── services/
│   ├── api/
│   │   ├── Dockerfile
│   │   └── .rebuild                    # Touch to rebuild
│   ├── processor/
│   ├── realtime/
│   ├── discord-bot/
│   └── fcm/
├── web-app/
│   ├── Dockerfile
│   └── .rebuild
└── docs/
    ├── GITLAB_CICD_SUMMARY.md          # Complete summary
    ├── GITLAB_CICD_QUICK_START.md      # Quick start
    ├── GITLAB_CICD_SETUP.md            # Detailed setup
    ├── GITLAB_CICD_DIAGRAM.md          # Diagrams
    └── GITHUB_VS_GITLAB_CICD.md        # Comparison
```

## 🌐 Network Flow

```
GitLab Runner → Bastion Host → VPS Server → Docker Containers
    (SSH)         (ProxyJump)      (Deploy)     (Services)
```

## ⏱️ Pipeline Timeline

```
0:00  ─┬─ detect-changes (20s)
       │
0:20  ─┼─ build-api (180s)
       ├─ build-processor (150s)
       ├─ build-realtime (140s)
       ├─ build-discord-bot (120s)
       ├─ build-fcm (90s)
       └─ build-web-app (240s)
       │
4:20  ─┼─ deploy-to-vps (120s)
       │
6:20  ─┴─ ✓ Done
```

## 📋 Pre-flight Checklist

- [ ] SSH keys generated
- [ ] Public keys on bastion & VPS
- [ ] Test SSH connection works
- [ ] GitLab variables configured
- [ ] Docker installed on VPS
- [ ] `~/log-monitoring` directory exists
- [ ] `.gitlab-ci.yml` in repository
- [ ] Push to main to trigger

## 🎓 Learning Resources

### GitLab Docs
- [GitLab CI/CD](https://docs.gitlab.com/ee/ci/)
- [CI/CD Variables](https://docs.gitlab.com/ee/ci/variables/)
- [Docker-in-Docker](https://docs.gitlab.com/ee/ci/docker/using_docker_build.html)

### Internal Docs
- `docs/GITLAB_CICD_SETUP.md` - Full guide
- `docs/GITLAB_CICD_QUICK_START.md` - Quick start
- `docs/GITHUB_VS_GITLAB_CICD.md` - Comparison

## 💡 Pro Tips

1. **Use `.rebuild` files** to force rebuild without code changes
2. **Check logs immediately** if pipeline fails
3. **Test locally first** with Docker before pushing
4. **Monitor disk space** on VPS regularly
5. **Keep SSH keys secure** - never commit them
6. **Use protected variables** for sensitive data
7. **Tag important commits** for easy rollback
8. **Document custom changes** in commit messages

## 🆘 Emergency Procedures

### Rollback Deployment
```bash
# SSH to VPS
ssh -J user@bastion user@vps
cd ~/log-monitoring

# Find old image
docker images | grep api

# Tag old image as latest
docker tag api:old-sha api:latest

# Restart
docker compose up -d --force-recreate api
```

### Stop Pipeline
```
GitLab UI → CI/CD → Pipelines → Click pipeline → Cancel
```

### Manual Deploy
```bash
# Build locally
docker build -t api:latest -f services/api/Dockerfile .
docker save api:latest -o api.tar

# Transfer
scp -J user@bastion api.tar user@vps:~/log-monitoring/deployment/

# Deploy on VPS
ssh -J user@bastion user@vps
cd ~/log-monitoring
docker load -i deployment/api.tar
docker compose up -d --force-recreate api
```

## 📞 Support

For issues:
1. Check pipeline logs in GitLab UI
2. Check Docker logs on VPS
3. Review documentation files
4. Compare with GitHub Actions workflow

---

**Last Updated**: 2025-11-10  
**Version**: 1.0.0  
**Status**: Production Ready ✅
