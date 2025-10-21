# FCM Service - Quick Start Guide

## 1. Overview
FCM Service nhận log lỗi từ Kafka, lọc và gửi thông báo qua Firebase Cloud Messaging (FCM). Hỗ trợ retry, DLQ, metrics.

## 2. Setup
- Clone repo, chuyển vào thư mục `fcm-service`
- Đảm bảo có file `service-account.json` (Firebase Admin)
- Cài đặt dependencies:
```bash
npm install
```
- Build project:
```bash
npm run build
```
- Chạy service:
```bash
npm start
```

## 3. Environment Variables
- `KAFKA_BROKERS`: Danh sách broker Kafka (phân cách bằng dấu phẩy)
- `KAFKA_MAIN_TOPIC`, `KAFKA_DLQ_TOPIC`, `KAFKA_RETRY_TOPIC`: tên các topic
- `FCM_TOPICS`: danh sách FCM topic
- `FCM_DEVICE_TOKENS`: danh sách device token
- `FCM_MIN_SEVERITY_CODE`, `FCM_CRITICAL_TYPES`: filter lỗi
- `SERVICE_ACCOUNT_PATH`: đường dẫn file service-account.json

## 4. Message Structure
- Message Kafka cần có trường `projectName`, `type`, `response.code`...
- Xem thêm ở `src/types.ts`

## 5. Metrics
- Metrics log ra console mỗi 30s: processed, failed, retry, DLQ, filtered...

## 6. Retry & DLQ
- Message lỗi sẽ retry tối đa N lần, sau đó đẩy vào DLQ

## 7. Mở rộng
- Có thể chỉnh sửa filter, cấu hình, thêm topic/device, mở rộng metrics...

## 8. Liên hệ
- Đóng góp, issue: tạo PR hoặc liên hệ maintainer.
