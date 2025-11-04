# GitHub Actions CI/CD - Setup Checklist

Sử dụng checklist này để đảm bảo bạn đã setup đầy đủ CI/CD pipeline.

## 📋 Pre-deployment Checklist

### ☐ Local Setup

- [ ] **Generate SSH Keys**
  ```bash
  cd /home/ad/log-monitoring
  ./scripts/generate-ssh-keys.sh
  ```
  - [ ] Private key created: `~/.ssh/github-actions`
  - [ ] Public key created: `~/.ssh/github-actions.pub`

- [ ] **Backup Keys** (Important!)
  ```bash
  cp ~/.ssh/github-actions ~/backup-github-actions-key
  ```

### ☐ VPS Setup

- [ ] **Access VPS**
  ```bash
  ssh user@your-vps-ip
  ```

- [ ] **Install Docker**
  ```bash
  # Option 1: Use setup script
  scp scripts/setup-vps.sh user@your-vps:/tmp/
  ssh user@your-vps "bash /tmp/setup-vps.sh"
  
  # Option 2: Manual install
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```
  - [ ] Docker installed
  - [ ] User added to docker group
  - [ ] Docker Compose installed

- [ ] **Setup SSH Access**
  ```bash
  # On VPS
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  
  # Add your public key (from local ~/.ssh/github-actions.pub)
  nano ~/.ssh/authorized_keys
  # Paste public key
  chmod 600 ~/.ssh/authorized_keys
  ```
  - [ ] SSH directory created
  - [ ] Public key added to authorized_keys
  - [ ] Permissions set correctly

- [ ] **Test SSH Connection**
  ```bash
  # From local machine
  ssh -i ~/.ssh/github-actions user@your-vps
  ```
  - [ ] Can connect without password

- [ ] **Create Project Directory**
  ```bash
  # On VPS
  mkdir -p ~/log-monitoring
  cd ~/log-monitoring
  ```

- [ ] **Setup Environment File**
  ```bash
  # On VPS
  nano ~/log-monitoring/.env
  ```
  - [ ] Copy from `.env.example`
  - [ ] Update all CHANGE_ME values
  - [ ] Set POSTGRES_PASSWORD
  - [ ] Set MONGO_PASSWORD
  - [ ] Set KEYCLOAK_URL
  - [ ] Set KEYCLOAK_BE_CLIENT_ID
  - [ ] Set SESSION_SECRET
  - [ ] Set API_BASE_URL (if using domain)
  - [ ] Set WEBSOCKET_URL (if using domain)

- [ ] **Test Docker**
  ```bash
  # On VPS
  docker ps
  docker compose version
  ```

### ☐ GitHub Setup

- [ ] **Add Repository Secrets**
  
  Go to: `Repository → Settings → Secrets and variables → Actions`
  
  - [ ] **VPS_SSH_PRIVATE_KEY**
    ```bash
    # Copy entire content of private key
    cat ~/.ssh/github-actions
    # Include -----BEGIN/END PRIVATE KEY----- lines
    ```
  
  - [ ] **VPS_HOST**
    ```bash
    # Your VPS IP or domain
    # Example: 192.168.1.100 or vps.example.com
    ```
  
  - [ ] **VPS_USER**
    ```bash
    # Your VPS username
    # Example: deploy, ubuntu, or root
    ```

- [ ] **Verify Secrets**
  - [ ] VPS_SSH_PRIVATE_KEY has complete key (including headers)
  - [ ] VPS_HOST is correct IP/domain
  - [ ] VPS_USER matches VPS username

### ☐ Test Deployment

- [ ] **Initial Manual Deploy** (Optional but recommended)
  ```bash
  # On VPS
  cd ~/log-monitoring
  
  # Create initial docker-compose.yml
  # (You can copy from repository)
  
  # Start infrastructure first
  docker compose up -d postgres mongodb redis kafka-1 kafka-2 kafka-3
  
  # Wait for services to be healthy
  docker compose ps
  ```

- [ ] **First CI/CD Deploy**
  ```bash
  # On local machine
  git add .
  git commit -m "Setup CI/CD"
  git push origin main
  ```
  
  - [ ] GitHub Actions workflow triggered
  - [ ] Check workflow in Actions tab
  - [ ] Wait for completion
  - [ ] Verify no errors

- [ ] **Verify Deployment on VPS**
  ```bash
  # SSH to VPS
  ssh user@your-vps
  cd ~/log-monitoring
  
  # Check running services
  docker compose ps
  
  # Check logs
  docker compose logs -f
  ```

## ✅ Post-deployment Checklist

### ☐ Verify Services

- [ ] **Check All Services Running**
  ```bash
  docker compose ps
  ```
  Expected services:
  - [ ] postgres (healthy)
  - [ ] mongodb (healthy)
  - [ ] redis (healthy)
  - [ ] kafka-1 (healthy)
  - [ ] kafka-2 (healthy)
  - [ ] kafka-3 (healthy)
  - [ ] api (running)
  - [ ] processor (running)
  - [ ] realtime (running)
  - [ ] web-app (running)
  - [ ] discord-bot (running, if enabled)
  - [ ] fcm (running, if enabled)

- [ ] **Test API Endpoints**
  ```bash
  curl http://your-vps:3000/health
  curl http://your-vps:3000/api/logs
  ```

- [ ] **Test Web Application**
  - [ ] Open browser: `http://your-vps:8000`
  - [ ] Login works
  - [ ] Dashboard loads
  - [ ] Real-time logs work

- [ ] **Check Logs**
  ```bash
  # Check for errors
  docker compose logs --tail=100
  
  # Check specific service
  docker compose logs api
  docker compose logs processor
  ```

### ☐ Test CI/CD Pipeline

- [ ] **Test Change Detection**
  ```bash
  # Make a small change in one service
  echo "// Test change" >> services/api/src/app.ts
  git add .
  git commit -m "Test: trigger api rebuild"
  git push origin main
  ```
  
  - [ ] Workflow triggered
  - [ ] Only `api` service detected as changed
  - [ ] Only `api` rebuilt
  - [ ] Only `api` restarted on VPS
  - [ ] Other services unchanged

- [ ] **Test Multiple Services**
  ```bash
  # Change multiple services
  echo "// Test" >> services/api/src/app.ts
  echo "// Test" >> web-app/src/app.tsx
  git add .
  git commit -m "Test: trigger api and web-app rebuild"
  git push origin main
  ```
  
  - [ ] Both services detected
  - [ ] Parallel builds
  - [ ] Both services restarted
  - [ ] Other services unchanged

- [ ] **Verify Build Cache**
  ```bash
  # Push again without changes
  git commit --allow-empty -m "Test: cache"
  git push origin main
  ```
  
  - [ ] No services detected as changed
  - [ ] No builds triggered
  - [ ] Workflow completes quickly

### ☐ Monitoring Setup

- [ ] **Setup Monitoring** (Optional)
  - [ ] Install monitoring tools (Prometheus, Grafana)
  - [ ] Configure alerts
  - [ ] Setup log aggregation

- [ ] **Setup Notifications** (Optional)
  - [ ] Discord webhook for deployment notifications
  - [ ] Slack integration
  - [ ] Email alerts

### ☐ Documentation

- [ ] **Update README**
  - [ ] Add deployment section
  - [ ] Document environment variables
  - [ ] Add troubleshooting section

- [ ] **Document Custom Settings**
  - [ ] VPS details (for team)
  - [ ] Domain configuration
  - [ ] SSL/TLS setup (if applicable)

## 🔧 Troubleshooting Checklist

### ☐ If SSH Connection Fails

- [ ] Check VPS is online: `ping your-vps-ip`
- [ ] Check SSH service: `sudo systemctl status ssh`
- [ ] Check firewall: `sudo ufw status` (allow SSH)
- [ ] Verify SSH key in GitHub Secrets
- [ ] Test manual SSH: `ssh -i ~/.ssh/github-actions user@vps`

### ☐ If Docker Build Fails

- [ ] Check Dockerfile syntax
- [ ] Verify all dependencies in package.json
- [ ] Check for TypeScript errors locally
- [ ] Review workflow logs in GitHub Actions

### ☐ If Deployment Fails

- [ ] Check VPS disk space: `df -h`
- [ ] Check VPS memory: `free -h`
- [ ] Check Docker daemon: `sudo systemctl status docker`
- [ ] Check .env file on VPS
- [ ] Review deployment logs

### ☐ If Service Won't Start

- [ ] Check service logs: `docker compose logs <service>`
- [ ] Check dependencies: `docker compose ps`
- [ ] Check environment variables
- [ ] Check port conflicts
- [ ] Try manual restart: `docker compose restart <service>`

## 📊 Performance Checklist

### ☐ Optimize Build Time

- [ ] Docker layer caching enabled ✅ (already in workflows)
- [ ] Multi-stage builds in Dockerfiles
- [ ] Minimize image size (use Alpine)
- [ ] .dockerignore configured
- [ ] Parallel builds enabled ✅ (already in workflows)

### ☐ Optimize Deployment Time

- [ ] Selective service restart ✅ (already in workflows)
- [ ] rsync for file transfer ✅ (already in workflows)
- [ ] Minimal artifact size
- [ ] Fast network connection to VPS

### ☐ Optimize Runtime

- [ ] Services properly scaled
- [ ] Resource limits configured
- [ ] Database indexes optimized
- [ ] Caching configured (Redis)

## 🔒 Security Checklist

### ☐ Secrets Management

- [ ] No secrets in repository
- [ ] All secrets in GitHub Secrets
- [ ] .env file on VPS only
- [ ] .env in .gitignore
- [ ] Strong passwords used

### ☐ Access Control

- [ ] Dedicated user for deployment
- [ ] SSH key-based auth only
- [ ] Firewall configured
- [ ] Minimal privileges for deploy user
- [ ] Regular key rotation plan

### ☐ Application Security

- [ ] HTTPS enabled (if production)
- [ ] CORS properly configured
- [ ] Authentication working
- [ ] Database secured
- [ ] API rate limiting (if needed)

## 📝 Maintenance Checklist

### ☐ Regular Tasks

- [ ] **Weekly**
  - [ ] Check service logs
  - [ ] Monitor disk usage
  - [ ] Review failed deployments

- [ ] **Monthly**
  - [ ] Update dependencies
  - [ ] Rotate secrets/keys
  - [ ] Review security logs
  - [ ] Backup databases

- [ ] **Quarterly**
  - [ ] Review and optimize Dockerfiles
  - [ ] Update base images
  - [ ] Performance audit
  - [ ] Security audit

## 🎯 Success Criteria

Your CI/CD is successfully set up when:

- [x] Push to main automatically deploys
- [x] Only changed services are rebuilt
- [x] Deployment completes in < 10 minutes
- [x] No manual intervention needed
- [x] Services restart with zero downtime
- [x] Rollback is available
- [x] Monitoring shows all services healthy

## 📞 Need Help?

- 📖 [CICD_SETUP.md](./CICD_SETUP.md) - Detailed guide
- 📊 [CICD_DIAGRAM.md](./CICD_DIAGRAM.md) - Visual diagrams
- 🚀 [CICD_QUICK_START.md](./CICD_QUICK_START.md) - Quick reference
- ⚙️ [.github/workflows/README.md](../.github/workflows/README.md) - Workflow docs

---

**Tip**: Print this checklist and check off items as you complete them!
