# Docker Compose Architecture - Refactored

## 📋 Tổng quan

File `docker-compose.yml` đã được refactor và tối ưu hóa với:
- ✅ Cấu trúc phân tầng rõ ràng (3 layers)
- ✅ Dependencies được định nghĩa chính xác với healthcheck
- ✅ Thứ tự services logic theo dependency hierarchy
- ✅ Healthcheck cho tất cả infrastructure services
- ✅ Key ordering nhất quán trong mọi service

## 🏗️ Kiến trúc 3 Layers

```
┌─────────────────────────────────────────────────┐
│         APPLICATION LAYER                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   API    │ │Processor │ │ Realtime │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐                     │
│  │Discord   │ │   FCM    │                     │
│  │   Bot    │ │          │                     │
│  └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────┘
               ↓ depends_on ↓
┌─────────────────────────────────────────────────┐
│           KAFKA CLUSTER                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Kafka-1  │ │ Kafka-2  │ │ Kafka-3  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐                     │
│  │Kafka Init│ │Kafka UI  │                     │
│  └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────┘
               ↓ depends_on ↓
┌─────────────────────────────────────────────────┐
│        INFRASTRUCTURE LAYER                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │PostgreSQL│ │ MongoDB  │ │  Redis   │        │
│  └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────┘
```

## 📊 Service Dependencies Matrix

| Service | Depends On | Condition |
|---------|-----------|-----------|
| **Infrastructure Layer** |
| `postgres` | - | - |
| `mongodb` | - | - |
| `redis` | - | - |
| **Kafka Cluster** |
| `kafka-1` | postgres | service_healthy |
| `kafka-2` | postgres | service_healthy |
| `kafka-3` | postgres | service_healthy |
| `kafka-init` | kafka-1, kafka-2, kafka-3 | service_healthy |
| `kafka-ui` | kafka-init | service_completed_successfully |
| **Application Layer** |
| `processor` | mongodb, redis, kafka-init | service_healthy / completed |
| `api` | mongodb, redis | service_healthy |
| `realtime` | kafka-init | service_completed_successfully |
| `discord-bot` | kafka-init | service_completed_successfully |
| `fcm` | kafka-init | service_completed_successfully |

## 🔍 Dependency Details

### Infrastructure Layer (Base)
```yaml
postgres (healthcheck: pg_isready)
  └── No dependencies

mongodb (healthcheck: mongosh ping)
  └── No dependencies

redis (healthcheck: redis-cli ping)
  └── No dependencies
```

### Kafka Cluster Layer
```yaml
kafka-1/2/3 (healthcheck: kafka-broker-api-versions)
  └── postgres [service_healthy]

kafka-init (one-time task)
  └── kafka-1 [service_healthy]
  └── kafka-2 [service_healthy]
  └── kafka-3 [service_healthy]

kafka-ui
  └── kafka-init [service_completed_successfully]
```

### Application Layer
```yaml
processor (Kafka consumer + DB writer)
  └── mongodb [service_healthy]
  └── redis [service_healthy]
  └── kafka-init [service_completed_successfully]

api (REST API)
  └── mongodb [service_healthy]
  └── redis [service_healthy]

realtime (WebSocket)
  └── kafka-init [service_completed_successfully]

discord-bot (Kafka consumer)
  └── kafka-init [service_completed_successfully]

fcm (Kafka consumer)
  └── kafka-init [service_completed_successfully]
```

## 🎯 Startup Sequence

Khi chạy `docker-compose up -d`, services sẽ start theo thứ tự:

```
1️⃣ INFRASTRUCTURE LAYER (parallel)
   ├── postgres    [wait for healthy]
   ├── mongodb     [wait for healthy]
   └── redis       [wait for healthy]

2️⃣ KAFKA CLUSTER (after infrastructure)
   ├── kafka-1     [wait for postgres healthy → wait for kafka-1 healthy]
   ├── kafka-2     [wait for postgres healthy → wait for kafka-2 healthy]
   ├── kafka-3     [wait for postgres healthy → wait for kafka-3 healthy]
   ├── kafka-init  [wait for all kafka nodes healthy → run once → complete]
   └── kafka-ui    [wait for kafka-init completed]

3️⃣ APPLICATION LAYER (after kafka ready)
   ├── processor   [wait for mongodb, redis, kafka-init]
   ├── api         [wait for mongodb, redis]
   ├── realtime    [wait for kafka-init]
   ├── discord-bot [wait for kafka-init]
   └── fcm         [wait for kafka-init]
```

## ✨ Key Improvements

### 1. Healthcheck Added
Tất cả infrastructure services có healthcheck:
```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5

mongodb:
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
    interval: 10s
    timeout: 5s
    retries: 5

redis:
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

Kafka brokers cũng có healthcheck:
```yaml
kafka-1/2/3:
  healthcheck:
    test: ["CMD-SHELL", "kafka-broker-api-versions.sh --bootstrap-server localhost:9092 || exit 1"]
    interval: 10s
    timeout: 10s
    retries: 10
    start_period: 30s
```

### 2. Smart Dependencies với Conditions
```yaml
# Trước (không chờ service ready):
depends_on:
  - postgres
  - mongodb

# Sau (chờ service healthy):
depends_on:
  postgres:
    condition: service_healthy
  mongodb:
    condition: service_healthy
```

### 3. Kafka Init Improvement
```yaml
# Trước:
depends_on:
  - kafka-1  # Chỉ list name, không đảm bảo ready

# Sau:
depends_on:
  kafka-1:
    condition: service_healthy  # Chờ broker thực sự ready
  kafka-2:
    condition: service_healthy
  kafka-3:
    condition: service_healthy
```

### 4. Port Format Consistency
```yaml
# Tất cả ports đều dùng quoted string format
ports:
  - "3000:3000"
  - "5000:3000"
  - "8080:8080"
```

### 5. Key Ordering Nhất quán
Mọi service đều follow thứ tự:
1. `image` / `build`
2. `container_name`
3. `environment`
4. `ports`
5. `volumes`
6. `networks`
7. `depends_on`
8. `healthcheck`
9. `restart`
10. `entrypoint` / `command`

## 🚀 Usage

### Start tất cả services
```bash
docker-compose up -d
```

Với healthcheck và smart dependencies, services sẽ tự động:
1. Chờ infrastructure ready (postgres, mongodb, redis)
2. Khởi động Kafka cluster
3. Tạo topics (kafka-init)
4. Khởi động application services khi mọi thứ sẵn sàng

### Start từng layer
```bash
# Infrastructure only
docker-compose up -d postgres mongodb redis

# Kafka cluster only
docker-compose up -d kafka-1 kafka-2 kafka-3 kafka-init kafka-ui

# Application only (requires infra + kafka ready)
docker-compose up -d processor api realtime discord-bot fcm
```

### Monitor startup progress
```bash
# Xem logs của healthcheck
docker-compose logs -f postgres mongodb redis

# Xem kafka init
docker-compose logs -f kafka-init

# Xem tất cả
docker-compose logs -f
```

### Check service health
```bash
# Tất cả services
docker-compose ps

# Specific service
docker inspect --format='{{.State.Health.Status}}' mongodb
```

## 🔧 Troubleshooting

### Service không start
```bash
# Check dependencies
docker-compose config --services

# Check health status
docker-compose ps

# Check logs
docker-compose logs <service-name>
```

### Kafka init failed
```bash
# Restart kafka-init
docker-compose up -d kafka-init

# Check topics
docker exec kafka-1 kafka-topics.sh --list --bootstrap-server localhost:9092
```

### Healthcheck timeout
Nếu service bị timeout healthcheck:
```bash
# Tăng timeout trong docker-compose.yml
healthcheck:
  timeout: 10s  # Increase this
  retries: 10   # Or increase retries
```

## 📈 Benefits

✅ **Reliable Startup**: Services chờ dependencies thực sự ready  
✅ **Fail Fast**: Healthcheck phát hiện vấn đề sớm  
✅ **Clear Structure**: Code dễ đọc, dễ maintain  
✅ **Logical Ordering**: Dependencies rõ ràng  
✅ **Production Ready**: Robust error handling  
✅ **Better Logging**: Mỗi layer có thể monitor riêng  

## 🎓 Best Practices Applied

1. ✅ **Separation of Concerns**: 3 layers riêng biệt
2. ✅ **Health Checks**: Mọi critical service đều có healthcheck
3. ✅ **Smart Dependencies**: Sử dụng conditions thay vì chỉ list names
4. ✅ **Consistent Formatting**: Key ordering và style nhất quán
5. ✅ **Documentation**: Comments và structure rõ ràng
6. ✅ **Restart Policies**: Appropriate restart cho từng service type
7. ✅ **Network Isolation**: Tất cả services trong cùng network

---

**Version:** Refactored & Optimized  
**Last Updated:** November 5, 2025  
**Status:** Production Ready ✅
