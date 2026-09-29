# Write Tool API — Backend Service

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="90" alt="Nest Logo" />
</p>

<p align="center">
  <strong>Hệ thống Backend API cho nền tảng viết lách và biên soạn tài liệu/tiểu thuyết số (Write Tool).</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon%20DB-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI%203.0-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
</p>

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu & Biến môi trường](#yêu-cầu--biến-môi-trường)
- [Cài đặt & Khởi chạy](#cài-đặt--khởi-chạy)
- [Tài liệu API (Endpoints)](#tài-liệu-api-endpoints)
  - [1. Authentication (/api/v1/auth)](#1-authentication-apiv1auth)
  - [2. Documents (/api/v1/documents)](#2-documents-apiv1documents)
  - [3. Chapters (/api/v1/chapters)](#3-chapters-apiv1chapters)
  - [4. Payments & Webhooks (/api/v1/payments, /api/v1/webhooks)](#4-payments--webhooks)
- [Kiến trúc bảo mật & Luồng xử lý](#kiến-trúc-bảo-mật--luồng-xử-lý)
  - [Cơ chế Token & CSRF](#cơ-chế-token--csrf)
  - [State Machine & Webhook SePay](#state-machine--webhook-sepay)
- [Kiểm thử & Linter](#kiểm-thử--linter)
- [Giấy phép](#giấy-phép)

---

## Giới thiệu

**Write Tool API** là dịch vụ backend trung tâm cho hệ sinh thái công cụ hỗ trợ người viết văn, tác giả và nhà sáng tạo nội dung. Dự án kết hợp cùng frontend [write-tool-ui](../write-tool-ui) (Next.js, TipTap Editor, IndexedDB offline) nhằm mang đến trải nghiệm viết mượt mà, lưu trữ an toàn và phân tích tiến độ theo thời gian thực.

Hệ thống được thiết kế theo kiến trúc module hóa của **NestJS 12**, đảm bảo độ bảo mật cao, khả năng mở rộng linh hoạt, đồng bộ hóa tự động thống kê số từ/ký tự, và tích hợp cổng thanh toán **SePay VietQR** tự động hoá việc nâng cấp tài khoản PRO.

---

## Tính năng chính

### 1. Xác thực & Bảo mật nâng cao (Authentication & Security)
- **Cơ chế Dual-Token an toàn**: Access Token ngắn hạn (JWT) mang theo request; Refresh Token dài hạn lưu trong Cookie `HttpOnly`, `SameSite=Lax`.
- **Phòng chống CSRF**: Triển khai cơ chế Double-Submit CSRF Token (`x-csrf-token` header đối chiếu cookie).
- **Quy trình định danh đầy đủ**:
  - Đăng ký tài khoản và gửi mã xác thực email (6 số, hết hạn sau 24h).
  - Quên mật khẩu & Đặt lại mật khẩu an toàn qua email với token có chữ ký thời hạn (15 phút).
  - Phân quyền người dùng theo vai trò (`user`, `admin`) và hạng thành viên (`FREE`, `PRO`).
- **Bảo mật hạ tầng**: Tích hợp `Helmet` bảo vệ HTTP headers và `@nestjs/throttler` chống brute-force / DDoS rate limiting (60 req/phút).

### 2. Quản lý Tài liệu & Chương sách (Documents & Chapters)
- **Tài liệu (Document)**: Quản lý các dự án sách/truyện với thông tin tiêu đề, tóm tắt, ngôn ngữ, ghi chú. Hỗ trợ tìm kiếm, phân trang và sắp xếp linh hoạt.
- **Chương sách (Chapter)**:
  - Hỗ trợ lưu trữ cấu trúc rich-text TipTap (`content` định dạng JSON) và văn bản thuần (`contentText`).
  - Hỗ trợ cả chương thuộc tài liệu lẫn chương viết độc lập (`documentId = null`).
  - **Tự động đồng bộ số từ & ký tự**: Khi cập nhật/autosave chương, hệ thống tự động tính toán lại diff số từ và cập nhật tổng `wordCount` của cả tài liệu tương ứng thông qua database transactions.

### 3. Cổng thanh toán SePay VietQR & Nâng cấp PRO
- **Tạo mã VietQR động**: Sinh mã QR chuyển khoản ngân hàng chính xác đến từng giao dịch qua SePay/VietQR API với cú pháp định danh duy nhất theo từng user.
- **Idempotency Protection**: Chống gửi trùng lặp giao dịch với `idempotencyKey` do client sinh.
- **Payment State Machine**: Quản lý vòng đời trạng thái chặt chẽ: `PENDING` -> `PROCESSING` -> `SUCCESS` / `FAILED` / `EXPIRED` / `CANCELLED`.
- **Webhook bảo mật cao**:
  - Hỗ trợ xác thực kép: API Key hoặc HMAC-SHA256 signature với timing-safe comparison chống timing attack.
  - Ngăn ngừa Replay Attack qua giới hạn thời gian timestamp (300s).
  - Khóa trùng lặp (Concurrency & Race Condition check) qua `PaymentWebhookLog`.
  - Tự động nâng cấp tài khoản sang gói `PRO` ngay khi nhận tiền thành công.
- **Tác vụ nền tự động (Cron Scheduler)**:
  - Quét và tự động đánh dấu `EXPIRED` các đơn nợ quá hạn mỗi phút.
  - Tiến trình Reconciliation định kỳ mỗi giờ đối soát trực tiếp với SePay API.

### 4. Tài liệu hoá API & Giám sát
- **Swagger OpenAPI 3.0**: Giao diện tương tác và thử nghiệm API tại `/api`.
- **NestJS Observe**: Tích hợp sẵn instrumentation phục vụ tracing, performance waterfall và telemetry.

---

## Công nghệ sử dụng

| Lĩnh vực | Công nghệ | Chi tiết sử dụng |
|---|---|---|
| **Framework** | [NestJS 12](https://nestjs.com/) | Express adapter, Module-driven architecture, ESM |
| **Ngôn ngữ** | [TypeScript 5+](https://www.typescriptlang.org/) | Type-safety, Clean interfaces & DTOs |
| **Compiler** | [SWC](https://swc.rs/) (`unplugin-swc`) | Biên dịch TypeScript tốc độ cao |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma 6](https://www.prisma.io/) | Multi-file schema (`prisma.config.ts`), Neon Serverless Postgres |
| **Bảo mật** | Passport JWT, Helmet, bcrypt, cookie-parser | Mã hóa mật khẩu, CSRF token, JWT Cookie |
| **Email Service** | [Nodemailer](https://nodemailer.com/) | Gmail SMTP gửi mã xác thực & link đặt lại mật khẩu |
| **Thanh toán** | [SePay](https://sepay.vn/) + VietQR | Cổng thanh toán chuyển khoản quét mã tự động |
| **Testing & Quality** | Vitest, Jest, Oxlint, Prettier | Unit test, e2e test, siêu tốc với oxlint |

---

## Cấu trúc thư mục

```text
write-tool-api/
├── prisma/
│   ├── models/                    # Multi-file Prisma schemas
│   │   ├── user.prisma            # Model User, PlanType enum
│   │   ├── document.prisma        # Model Document
│   │   ├── chapter.prisma         # Model Chapter
│   │   ├── writingSession.prisma  # Phiên viết & thống kê
│   │   └── payment.prisma         # Model Payment, Event, WebhookLog
│   ├── migrations/                # Lịch sử migration Prisma
│   └── schema.prisma              # Config datasource & client generator
├── src/
│   ├── auth/                      # Module Xác thực (Register, Login, Token, Password)
│   │   ├── dto/                   # DTO xác thực request
│   │   ├── auth.controller.ts     # Các endpoints xác thực
│   │   └── auth.service.ts        # Logic cấp phát token, mã hoá, mail
│   ├── chapters/                  # Module Chương sách
│   │   ├── dto/                   # Create/Update Chapter DTO
│   │   ├── chapters.controller.ts # CRUD & Autosave endpoints
│   │   └── chapters.service.ts    # Logic nghiệp vụ & sync wordCount
│   ├── documents/                 # Module Tài liệu/Dự án sách
│   │   ├── dto/                   # Query & Body DTO
│   │   ├── documents.controller.ts# Endpoints danh sách & chi tiết tài liệu
│   │   └── documents.service.ts   # Xử lý phân trang & quan hệ chương
│   ├── payments/                  # Module Thanh toán & Cổng SePay
│   │   ├── domain/                # State machine & Kiểu dữ liệu nghiệp vụ
│   │   ├── guards/                # WebhookSignatureGuard (HMAC/API Key)
│   │   ├── provider/              # SePayProvider, MockProvider, Interface
│   │   ├── payment.scheduler.ts   # Cron jobs: Hết hạn đơn & Đối soát
│   │   ├── payments.controller.ts # API khởi tạo đơn & kiểm tra trạng thái
│   │   ├── sepay.controller.ts    # Webhook receiver từ SePay
│   │   └── payments.service.ts    # Xử lý vòng đời đơn hàng & nâng cấp PRO
│   ├── email/                     # Dịch vụ gửi thư điện tử (Nodemailer)
│   ├── common/                    # Tiện ích dùng chung
│   │   ├── decorators/            # @CurrentUser()
│   │   ├── filters/               # HttpExceptionFilter
│   │   ├── interceptors/          # ResponseInterceptor (chuẩn hóa JSON)
│   │   ├── strategies/            # Passport JwtStrategy, JwtAuthGuard
│   │   └── utils/                 # Đếm số từ, đếm ký tự
│   ├── prisma/                    # PrismaModule & PrismaService
│   ├── app.module.ts              # Root Module cấu hình App
│   └── main.ts                    # Điểm khởi chạy (Bootstrap, Middlewares, Swagger)
├── .env.example                   # Mẫu cấu hình môi trường
├── package.json                   # Dependencies & Scripts
├── prisma.config.ts               # Cấu hình Prisma multi-schema
└── tsconfig.json                  # Cấu hình TypeScript
```

---

## Yêu cầu & Biến môi trường

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản `>= 20.x` (khuyến nghị `22.x` hoặc `24.x`)
- **NPM** hoặc **PNPM**
- Một cơ sở dữ liệu **PostgreSQL** (Neon DB hoặc PostgreSQL local)

### Thiết lập tệp `.env`

Tạo file `.env` tại thư mục gốc dựa trên mẫu `.env.example`:

```bash
cp .env.example .env
```

Toàn bộ các biến môi trường cấu hình (Port, Database, JWT, Nodemailer, SePay...) đã được liệt kê sẵn kèm giá trị mẫu trong tệp [.env.example](.env.example). Vui lòng mở tệp để tham khảo và điền các thông tin tương ứng.

---

## Cài đặt & Khởi chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình Cơ sở dữ liệu (Prisma)
Đồng bộ hóa schema cơ sở dữ liệu và sinh mã nguồn Prisma Client:
```bash


### 3. Khởi chạy ứng dụng
```bash
# Chế độ phát triển (hot-reload với Nest CLI & SWC)
npm run start:dev

# Chế độ debug
npm run start:debug

# Biên dịch sản phẩm
npm run build

# Chạy bản production sau khi build
npm run start:prod
```

- Server URL: `http://localhost:3000`  
- Swagger API Docs: `http://localhost:3000/api`

---

## Tài liệu API (Endpoints)

Tất cả các route ngoại trừ Swagger và webhook đều có tiền tố: `/api/v1`

### 1. Authentication (`/api/v1/auth`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|:---:|---|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản mới & gửi email xác thực |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập; nhận `accessToken`, cookie `refreshToken`, `csrfToken` |
| `POST` | `/api/v1/auth/verify-email` | Public | Xác thực email bằng OTP 6 chữ số |
| `POST` | `/api/v1/auth/resend-verification` | Public | Gửi lại mã xác thực email |
| `POST` | `/api/v1/auth/forgot-password` | Public | Yêu cầu gửi email link đặt lại mật khẩu |
| `POST` | `/api/v1/auth/reset-password` | Public | Đặt lại mật khẩu mới bằng token đã nhận |
| `POST` | `/api/v1/auth/refresh` | Cookie + CSRF | Cấp `accessToken` mới từ Refresh Token hợp lệ |
| `POST` | `/api/v1/auth/logout` | Cookie + CSRF | Xóa cookie phiên đăng nhập |
| `GET` | `/api/v1/auth/me` | Bearer Token | Lấy thông tin user hiện tại, vai trò và quyền hạn |

---

### 2. Documents (`/api/v1/documents`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|:---:|---|
| `GET` | `/api/v1/documents` | Bearer Token | Lấy danh sách tài liệu (hỗ trợ `search`, `page`, `limit`, `sortBy`) |
| `POST` | `/api/v1/documents` | Bearer Token | Tạo tài liệu/cuốn sách mới |
| `GET` | `/api/v1/documents/:id` | Bearer Token | Lấy chi tiết tài liệu kèm danh sách các chương thuộc tài liệu |
| `PATCH` | `/api/v1/documents/:id` | Bearer Token | Cập nhật thông tin tài liệu (tiêu đề, tóm tắt, ghi chú, ngôn ngữ) |
| `DELETE` | `/api/v1/documents/:id` | Bearer Token | Xóa tài liệu và các chương liên kết (Cascade) |

---

### 3. Chapters (`/api/v1/chapters`)

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|:---:|---|
| `GET` | `/api/v1/chapters` | Bearer Token | Lấy danh sách chương (truyền `?documentId=` hoặc lấy chương độc lập) |
| `POST` | `/api/v1/chapters` | Bearer Token | Tạo chương mới (tự động cộng `wordCount` vào tài liệu cha) |
| `GET` | `/api/v1/chapters/:id` | Bearer Token | Lấy nội dung chi tiết của một chương |
| `PATCH` | `/api/v1/chapters/:id` | Bearer Token | Cập nhật tiêu đề hoặc số thứ tự sắp xếp (`order`) |
| `PATCH` | `/api/v1/chapters/:id/content` | Bearer Token | Autosave: Cập nhật rich-text `content` & `contentText`, tự động tính diff số từ |
| `DELETE` | `/api/v1/chapters/:id` | Bearer Token | Xóa chương (tự động giảm `wordCount` tương ứng của tài liệu) |

---

### 4. Payments & Webhooks

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|:---:|---|
| `POST` | `/api/v1/payments` | Bearer Token | Khởi tạo đơn thanh toán nâng cấp `PRO` kèm link VietQR và nội dung chuyển khoản |
| `GET` | `/api/v1/payments/:id` | Bearer Token | Tra cứu trạng thái giao dịch (`PENDING`, `SUCCESS`, ...) |
| `POST` | `/api/v1/webhooks/sepay` | Webhook Signature | Nhận thông báo biến động số dư từ SePay, kiểm tra chữ ký & tự động nâng cấp user lên `PRO` |

---

## Kiến trúc bảo mật & Luồng xử lý

### Cơ chế Token & CSRF
```text
[ Client (Browser) ]
       │
       │ 1. POST /auth/login (email, password)
       ▼
[ Write Tool API ]
       │
       ├─► Trả về Body: { accessToken, csrfToken, user }
       ├─► Set HttpOnly Cookie: refreshToken (/api/v1/auth)
       └─► Set Standard Cookie: csrfToken (/)
       │
[ Client lưu accessToken trong Memory ]
       │
       │ 2. Khi gọi API nghiệp vụ (/documents, /chapters):
       ├─► Header: "Authorization: Bearer <accessToken>"
       │
       │ 3. Khi gọi /auth/refresh hoặc /auth/logout:
       ├─► Header: "x-csrf-token: <csrfToken>"
       └─► Cookie: "refreshToken=..." (tự động đính kèm)
```

### State Machine & Webhook SePay
```text
  [ Client gửi yêu cầu mua PRO ]
                │
                ▼
        ┌───────────────┐
        │    PENDING    │ <─── Sinh VietQR động & Transfer Content duy nhất
        └───────┬───────┘
                │
     ┌──────────┴──────────┐
     ▼                     ▼
[ Hết hạn sau 15p ]   [ SePay Webhook tới ]
     │                     │
     ▼                     ▼
┌─────────┐       ┌─────────────────┐
│ EXPIRED │       │   PROCESSING    │ (Kiểm tra chữ ký HMAC & số tiền)
└─────────┘       └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │     SUCCESS     │ ──► User PlanType cập nhật lên 'PRO'
                  └─────────────────┘
```

---

## Kiểm thử & Linter

Hệ thống được thiết lập kiểm thử đơn vị, kiểm tra định dạng và phân tích tĩnh:

```bash
# Chạy Unit Tests với Vitest
npm run test

# Chạy kiểm thử chế độ Watch
npm run test:watch

# Chạy kiểm thử kèm báo cáo độ phủ (Coverage)
npm run test:cov

# Chạy kiểm thử End-to-End (E2E)
npm run test:e2e

# Phân tích tĩnh code bằng Oxlint
npm run lint

# Định dạng mã nguồn với Prettier
npm run format
```

---

## Giấy phép

Dự án được phát triển dưới bản quyền cá nhân / nội bộ [UNLICENSED]. Mọi quyền được bảo lưu.
