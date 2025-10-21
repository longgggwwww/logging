# FCM Service (Tiếng Việt)

## Giới thiệu
FCM Service là dịch vụ microservice nhận log lỗi từ Kafka, lọc và gửi thông báo qua Firebase Cloud Messaging (FCM). Hỗ trợ retry, DLQ, metrics, cấu hình động.

## Tính năng
- Nhận log từ Kafka, gửi FCM (topic/device)
- Lọc message theo loại lỗi, mã lỗi
- Retry, gửi vào DLQ nếu lỗi
- Thống kê metrics
- Cấu hình qua biến môi trường

## Hướng dẫn sử dụng
1. Chuẩn bị file `service-account.json` của Firebase
2. Cài đặt:
```bash
cd fcm-service
npm install
npm run build
npm start
```
3. Cấu hình các biến môi trường phù hợp

## Cấu trúc thư mục
- `src/`: mã nguồn
- `service-account.json`: cấu hình Firebase
- `README.md`, `README-vi.md`: tài liệu
- `docs/`: tài liệu chi tiết

## Đóng góp
Mọi ý kiến đóng góp, PR, issue đều được chào đón!
