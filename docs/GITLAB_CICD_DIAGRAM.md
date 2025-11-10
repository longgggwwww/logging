# GitLab CI/CD Pipeline Diagram

## Overview Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GITLAB CI/CD PIPELINE                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           STAGE 1: DETECT                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │  detect-changes   │
                        │  (git diff)       │
                        └─────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Create changes.env      │
                    │   API_CHANGED=true/false  │
                    │   PROCESSOR_CHANGED=...   │
                    │   REALTIME_CHANGED=...    │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           STAGE 2: BUILD                             │
│                        (Parallel Execution)                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────┬───────────┼───────────┬─────────────┬─────────┐
        ▼             ▼           ▼           ▼             ▼         ▼
   ┌────────┐   ┌──────────┐  ┌──────┐  ┌──────────┐  ┌─────┐  ┌─────────┐
   │build   │   │build     │  │build │  │build     │  │build│  │build    │
   │-api    │   │-processor│  │-real │  │-discord  │  │-fcm │  │-web-app │
   │        │   │          │  │time  │  │-bot      │  │     │  │         │
   └───┬────┘   └────┬─────┘  └──┬───┘  └────┬─────┘  └──┬──┘  └────┬────┘
       │             │           │           │           │          │
       │  Docker     │  Docker   │  Docker   │  Docker   │  Docker  │  Docker
       │  Build      │  Build    │  Build    │  Build    │  Build   │  Build
       │             │           │           │           │          │
       ▼             ▼           ▼           ▼           ▼          ▼
   ┌────────┐   ┌──────────┐  ┌──────┐  ┌──────────┐  ┌─────┐  ┌─────────┐
   │api.tar │   │processor │  │real  │  │discord   │  │fcm  │  │web-app  │
   │        │   │.tar      │  │time  │  │-bot.tar  │  │.tar │  │.tar     │
   └───┬────┘   └────┬─────┘  └──┬───┘  └────┬─────┘  └──┬──┘  └────┬────┘
       │             │           │           │           │          │
       └─────────────┴───────────┴───────────┴───────────┴──────────┘
                                  │
                           Artifacts Stored
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          STAGE 3: DEPLOY                             │
│                        (Only on main branch)                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │  deploy-to-vps    │
                        │                   │
                        └─────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Download Artifacts      │
                    │   (api.tar, *.tar)        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Setup SSH               │
                    │   - Configure SSH agent   │
                    │   - Setup ProxyJump       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Transfer Files          │
                    │   via Bastion Host        │
                    └─────────────┬─────────────┘
                                  │
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                         VPS Server                         │
    │  ┌─────────────────────────▼─────────────────────────┐   │
    │  │         Load Docker Images                        │   │
    │  │  - docker load -i api.tar                         │   │
    │  │  - docker load -i processor.tar                   │   │
    │  │  - ... (only changed services)                    │   │
    │  └─────────────────────────┬─────────────────────────┘   │
    │                            │                              │
    │  ┌─────────────────────────▼─────────────────────────┐   │
    │  │  Stop & Remove Old Containers                     │   │
    │  │  - docker compose stop <service>                  │   │
    │  │  - docker compose rm -f <service>                 │   │
    │  └─────────────────────────┬─────────────────────────┘   │
    │                            │                              │
    │  ┌─────────────────────────▼─────────────────────────┐   │
    │  │  Ensure Infrastructure Running                    │   │
    │  │  - postgres, mongodb, redis                       │   │
    │  │  - kafka-1, kafka-2, kafka-3                      │   │
    │  └─────────────────────────┬─────────────────────────┘   │
    │                            │                              │
    │  ┌─────────────────────────▼─────────────────────────┐   │
    │  │  Deploy Application Services                      │   │
    │  │  docker compose up -d --force-recreate            │   │
    │  │  - api, processor, realtime, etc.                 │   │
    │  └─────────────────────────┬─────────────────────────┘   │
    │                            │                              │
    │  ┌─────────────────────────▼─────────────────────────┐   │
    │  │  Verify Deployment                                │   │
    │  │  - docker compose ps                              │   │
    │  │  - Check service status                           │   │
    │  └─────────────────────────┬─────────────────────────┘   │
    │                            │                              │
    │  ┌─────────────────────────▼─────────────────────────┐   │
    │  │  Cleanup                                          │   │
    │  │  - docker image prune -f                          │   │
    │  │  - Remove .tar files                              │   │
    │  └───────────────────────────────────────────────────┘   │
    └───────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │   SUCCESS ✓   │
                          └───────────────┘
```

## Network Diagram

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  GitLab Runner   │────────▶│  Bastion Host    │────────▶│   VPS Server     │
│                  │  SSH    │                  │  SSH    │                  │
│  (CI/CD Job)     │ Port 22 │  Jump Server     │ Port 22 │  Docker Host     │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
         │                           │                            │
         │ Transfer:                 │ Forward:                   │ Deploy:
         │ - *.tar files             │ - SSH connection           │ - Load images
         │ - docker-compose.yml      │ - SCP transfers            │ - Start services
         │ - init-scripts/           │                            │ - Run containers
         │                           │                            │
         └───────────────────────────┴────────────────────────────┘
                            ProxyJump Configuration
```

## Service Dependencies

```
                        ┌──────────────────────────┐
                        │  Infrastructure Layer    │
                        └──────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   PostgreSQL  │          │    MongoDB    │          │     Redis     │
│   Port: 5432  │          │  Port: 27017  │          │  Port: 6379   │
└───────┬───────┘          └───────────────┘          └───────┬───────┘
        │                                                      │
        └──────────────────────┬───────────────────────────────┘
                               │
                        ┌──────▼───────┐
                        │ Kafka Cluster │
                        │  (3 brokers)  │
                        └──────┬────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐     ┌───────────────┐
│   kafka-1     │      │   kafka-2     │     │   kafka-3     │
│  Port: 19092  │      │  Port: 19093  │     │  Port: 19094  │
└───────┬───────┘      └───────┬───────┘     └───────┬───────┘
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                               │
                        ┌──────▼──────────────────────┐
                        │   Application Layer         │
                        └─────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐     ┌───────────────┐
│      API      │      │   Processor   │     │   Realtime    │
│  Port: 3000   │      │   (Kafka)     │     │  Port: 3000   │
└───────┬───────┘      └───────┬───────┘     └───────┬───────┘
        │                      │                      │
        │              ┌───────▼───────┐              │
        │              │  Discord Bot  │              │
        │              │    (Kafka)    │              │
        │              └───────┬───────┘              │
        │                      │                      │
        │              ┌───────▼───────┐              │
        │              │      FCM      │              │
        │              │   (Kafka)     │              │
        │              └───────────────┘              │
        │                                             │
        └──────────────────────┬──────────────────────┘
                               │
                        ┌──────▼───────┐
                        │   Web App    │
                        │  Port: 80    │
                        └──────────────┘
```

## Change Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Changes Detection                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Get Base SHA     │
                    │  - MR: target     │
                    │  - Push: prev     │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  git diff         │
                    │  --name-only      │
                    │  BASE..HEAD       │
                    └─────────┬─────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌────────▼───────┐
        │  Check Pattern │         │  Check Pattern │
        │  services/api/ │         │  web-app/      │
        └───────┬────────┘         └────────┬───────┘
                │                           │
        ┌───────▼────────┐         ┌────────▼───────┐
        │  Match Found?  │         │  Match Found?  │
        └───────┬────────┘         └────────┬───────┘
                │                           │
        Yes ─────┤                   Yes ────┤
                │                           │
        ┌───────▼────────┐         ┌────────▼───────┐
        │  API_CHANGED   │         │  WEB_APP_      │
        │  = true        │         │  CHANGED=true  │
        └───────┬────────┘         └────────┬───────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Write to         │
                    │  changes.env      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Upload Artifact  │
                    │  (dotenv report)  │
                    └───────────────────┘
```

## Build Job Dependencies

```
detect-changes (Stage: detect)
        │
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
build-api (Stage: build)              build-processor (Stage: build)
  depends_on: detect-changes            depends_on: detect-changes
  needs: API_CHANGED=true               needs: PROCESSOR_CHANGED=true
        │                                      │
        ▼                                      ▼
   [api.tar]                            [processor.tar]
   (artifact)                           (artifact)
        │                                      │
        └──────────────────┬───────────────────┘
                           │
                           ▼
                 deploy-to-vps (Stage: deploy)
                   depends_on: 
                     - detect-changes
                     - build-api
                     - build-processor
                     - build-realtime
                     - build-discord-bot
                     - build-fcm
                     - build-web-app
                   needs: ANY_SERVICE_CHANGED=true
```

## Timeline Example

```
Time    Stage       Jobs
─────────────────────────────────────────────────────────────
0:00    detect      detect-changes ████████ (20s)
        
0:20    build       build-api ███████████████████ (180s)
                    build-processor █████████████ (150s)
                    build-realtime ████████████ (140s)
                    build-discord-bot ██████████ (120s)
                    build-fcm ████████ (90s)
                    build-web-app ██████████████████████ (240s)
                    
4:20    deploy      deploy-to-vps ████████████ (120s)
        
6:20    ✓ SUCCESS
```

## Conditional Execution Logic

```
┌─────────────────────────────────────────────────────────────┐
│                      Job Execution Rules                    │
└─────────────────────────────────────────────────────────────┘

build-api:
  rules:
    ┌────────────────────────────────┐
    │ if: CI_COMMIT_BRANCH == "main" │
    │     OR                         │
    │     CI_PIPELINE_SOURCE == "MR" │
    └────────────┬───────────────────┘
                 │
         ┌───────▼────────┐
         │  Check Changes │
         │  services/api/ │
         └───────┬────────┘
                 │
        ┌────────▼─────────┐
        │   Changed?       │
        └────────┬─────────┘
                 │
        Yes ─────┼───── No
                 │       │
         ┌───────▼────┐  └──▶ Skip Job
         │  Run Job   │
         └────────────┘

deploy-to-vps:
  only:
    ┌────────────────────────────────┐
    │ Branch: main                   │
    └────────────┬───────────────────┘
                 │
         ┌───────▼────────┐
         │  Any Service   │
         │  Changed?      │
         └───────┬────────┘
                 │
        Yes ─────┼───── No
                 │       │
         ┌───────▼────┐  └──▶ Skip Job
         │  Run Job   │
         └────────────┘
```

## Key Features

### 1. Parallel Builds
- All build jobs run in parallel
- Reduces total pipeline time
- Each service builds independently

### 2. Selective Deployment
- Only changed services are deployed
- Reduces deployment time
- Minimizes service disruption

### 3. Artifact Sharing
- Docker images saved as .tar files
- Transferred between stages
- Automatic cleanup after use

### 4. SSH Security
- Private key stored in GitLab variables
- ProxyJump through bastion host
- No direct VPS access from runner

### 5. Health Checks
- Infrastructure dependencies verified
- Service status monitored
- Automatic cleanup of old images
