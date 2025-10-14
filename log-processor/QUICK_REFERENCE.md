# 🚀 Log Processor - Quick Reference Card

## ⚡ Quick Commands

### Setup
```bash
./setup-log-processor.sh                    # One-time setup
docker-compose up -d                        # Start all services
```

### Running
```bash
cd log-processor && npm run dev             # Local development
docker logs -f log-processor                # View Docker logs
```

### Testing
```bash
./test-log-processor.sh                     # Quick test (1 message)
./test-log-processor-suite.sh               # Full test suite (5+ messages)
```

### Database Management
```bash
cd log-processor
npm run prisma:studio                       # Open Web GUI (localhost:5555)
npm run prisma:push                         # Push schema changes
npm run prisma:migrate                      # Create migration
node examples.js                            # Run query examples
```

## 📊 Database Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `projects` | Projects/Apps | `id`, `name` (unique) |
| `functions` | Functions/Endpoints | `id`, `name`, `projectId` |
| `logs` | Log Entries | `id`, `projectId`, `functionId`, `type`, `method` |

## 🔍 Common Queries

### Get All Projects
```javascript
const projects = await prisma.project.findMany({
  include: { _count: { select: { logs: true, functions: true } } }
});
```

### Get Recent Errors
```javascript
import { getRecentErrors } from './queries.js';
const errors = await getRecentErrors(50);
```

### Get Logs by Project
```javascript
import { getLogsByProject } from './queries.js';
const logs = await getLogsByProject(projectId, 1, 20);
```

### Get Stats by Type
```javascript
import { getLogStatsByType } from './queries.js';
const stats = await getLogStatsByType();
```

## 📨 Message Format

### Required Fields
```json
{
  "projectName": "string",
  "function": "string",
  "method": "GET|POST|PUT|PATCH|DELETE",
  "type": "ERROR|WARNING|INFO|SUCCESS|DEBUG",
  "createdAt": "ISO 8601 timestamp",
  "latency": 123
}
```

### Optional Fields
- `request`: { headers, userAgent, url, params, body }
- `response`: { code, success, message, data }
- `consoleLog`: string
- `createdBy`: { id, fullname, emplCode }
- `additionalData`: object

## 🐳 Docker Commands

```bash
# Start service
docker-compose up -d log-processor

# View logs
docker logs -f log-processor

# Restart service
docker-compose restart log-processor

# Stop service
docker-compose stop log-processor

# Rebuild service
docker-compose up -d --build log-processor

# Remove service
docker-compose down log-processor
```

## 🔧 Configuration

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
KAFKA_BROKERS=localhost:19092,localhost:29092,localhost:39092
KAFKA_GROUP_ID=log-processor-group
KAFKA_TOPIC=logs.error.dlq
```

## 📈 Monitoring

### Check Service Status
```bash
docker ps | grep log-processor              # Is it running?
docker logs --tail 50 log-processor         # Recent logs
```

### Database Stats
```sql
-- Via Prisma Studio or psql
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM functions;
SELECT COUNT(*) FROM logs;

-- Logs by type
SELECT type, COUNT(*) FROM logs GROUP BY type;

-- Logs by project
SELECT p.name, COUNT(l.id) 
FROM projects p 
LEFT JOIN logs l ON p.id = l.project_id 
GROUP BY p.name;
```

## 🛠️ Troubleshooting

### Service Won't Start
```bash
# Check dependencies
docker ps | grep postgres
docker ps | grep kafka

# Check logs
docker logs log-processor

# Restart dependencies
docker-compose restart postgres kafka-controller-1
```

### Can't Connect to Database
```bash
# Test connection
docker exec postgres psql -U kafka_user -d kafka_db -c "SELECT 1"

# Regenerate Prisma Client
cd log-processor
npm run prisma:generate
```

### No Messages Being Processed
```bash
# Check Kafka topic
docker exec kafka-controller-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --describe --topic logs.error.dlq

# Check consumer group
docker exec kafka-controller-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group log-processor-group

# Send test message
./test-log-processor.sh
```

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `index.js` | Main consumer service |
| `queries.js` | Query utility functions |
| `examples.js` | Query usage examples |
| `prisma/schema.prisma` | Database schema |
| `Dockerfile` | Docker container config |
| `.env` | Environment variables |
| `README.md` | Basic documentation |
| `SETUP_GUIDE.md` | Complete setup guide |
| `ARCHITECTURE_DIAGRAM.md` | System architecture |

## 🎯 Performance Tips

✅ Use indexes - Already configured in schema  
✅ Paginate results - Use `page` and `limit` in queries  
✅ Filter early - Use WHERE clauses effectively  
✅ Use composite indexes - For multi-column queries  
✅ Monitor query performance - Use Prisma query logging  

## 🔐 Security Notes

- `.env` file is gitignored
- Database credentials secured
- Input validation on messages
- Prepared statements via Prisma
- Cascade deletes configured

## ✨ Pro Tips

💡 Use Prisma Studio for quick data inspection  
💡 Run `examples.js` to see all query patterns  
💡 Check Docker logs if messages aren't processing  
💡 Use composite indexes for complex filters  
💡 Set up log retention policy (see `deleteOldLogs()`)  

## 📞 Help

- Full documentation: `log-processor/SETUP_GUIDE.md`
- Architecture: `log-processor/ARCHITECTURE_DIAGRAM.md`
- Prisma docs: https://www.prisma.io/docs
- KafkaJS docs: https://kafka.js.org/
