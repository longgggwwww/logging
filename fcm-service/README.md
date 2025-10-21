# FCM Service

FCM Service là microservice dùng để gửi thông báo (notification) qua Firebase Cloud Messaging (FCM) dựa trên log lỗi từ hệ thống, tích hợp Kafka để nhận message và hỗ trợ retry, DLQ, metrics.

## Tính năng chính

- Nhận log lỗi từ Kafka topic, xử lý và gửi notification qua FCM (topic hoặc device token)
- Lọc message theo loại lỗi, mã lỗi (filter)
- Hỗ trợ retry với backoff, gửi vào DLQ nếu thất bại
- Thống kê metrics: số lượng gửi thành công/thất bại, retry, DLQ, filtered
- Cấu hình động qua biến môi trường

## Cấu trúc thư mục

- `src/`: mã nguồn chính
  - `main.ts`: entry point, khởi tạo consumer/producer
  - `kafka.ts`: cấu hình Kafka
  - `fcm.ts`: gửi notification FCM
  - `processor.ts`: xử lý message
  - `retry-queue.ts`, `dlq.ts`: retry & DLQ
  - `metrics.ts`: thống kê
  - `filter.ts`: filter message
  - `config.ts`, `types.ts`: cấu hình & type
  - `firebase.ts`: khởi tạo Firebase Admin
- `service-account.json`: file cấu hình Firebase
- `README.md`, `README-vi.md`: tài liệu
- `docs/`: tài liệu chi tiết

## Cài đặt & chạy thử

```bash
cd fcm-service
cp ../service-account.json ./ # copy file cấu hình Firebase
npm install
npm run build
npm start
```

## Cấu hình qua biến môi trường

- `KAFKA_BROKERS`, `KAFKA_MAIN_TOPIC`, `KAFKA_DLQ_TOPIC`, `KAFKA_RETRY_TOPIC`
- `FCM_TOPICS`, `FCM_DEVICE_TOKENS`, `FCM_MIN_SEVERITY_CODE`, `FCM_CRITICAL_TYPES`
- `SERVICE_ACCOUNT_PATH`

## Đóng góp

PR, issue, góp ý đều được hoan nghênh!
