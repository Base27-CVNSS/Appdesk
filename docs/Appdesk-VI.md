# Appdesk — Giao diện Web tiếng Việt

Appdesk sử dụng nền tảng Pake, Rust và Tauri hiện có trong repository. Giao diện ở thư mục web, không sửa mã nguồn lõi Pake.

## Chạy giao diện

- Máy cá nhân: python -m http.server 8080 --directory web
- Truy cập http://localhost:8080
- Triển khai GitHub Pages: vào Settings > Pages, chọn Source: GitHub Actions. Workflow appdesk-pages.yml chạy kiểm thử và phát hành thư mục web.

## Quy trình đóng gói

1. Nhập URL HTTP/HTTPS, tên ứng dụng, hệ điều hành và tuỳ chọn cửa sổ.
2. Bấm Tạo cấu hình Desktop để sinh tham số và lệnh đóng gói.
3. Chọn GitHub Actions, mở workflow Build App With Pake CLI và bấm Run workflow. Điền thông số đang hiển thị, sau đó tải file cài đặt ở Artifacts. GitHub Actions yêu cầu quyền chạy workflow trong repo.
4. Hoặc dùng lệnh npx pake-cli do giao diện sinh ra hay tải tập lệnh PowerShell/bash để chạy trên máy cài Node.js 20.9+, Rust và các yêu cầu của Tauri.
5. Tệp JSON là manifest cho Appdesk/GitHub Actions, KHÔNG phải tệp cấu hình Pake CLI.

## Giới hạn

- Web UI không thể biên dịch trực tiếp file MSI/DMG trong trình duyệt và không lưu hay yêu cầu GitHub token.
- Xem trước là minh hoạ, không nhúng nội dung website để tránh giới hạn X-Frame-Options/CSP.
- Ứng dụng WebView mở website từ URL; website không tự biến thành ứng dụng offline. Cần tuân thủ điều khoản, bản quyền, đăng nhập và bảo mật của website nguồn.
- Chạy GitHub Actions theo từng nền tảng; build thành công còn phụ thuộc vào URL, gói phụ thuộc và môi trường runner.
- Các bản cài đặt chưa ký số hoặc chưa notarize có thể bị cảnh báo bảo mật trên máy người dùng.

## Kiểm thử

node --test web/core.test.mjs
