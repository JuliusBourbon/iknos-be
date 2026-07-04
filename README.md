# Iknos Backend

Backend service untuk **Iknos**. Aplikasi pemantauan lokasi real-time berbasis Room. Dibangun dengan Node.js (Express), PostgreSQL (Prisma ORM), Socket.IO untuk komunikasi real-time, dan Cloudinary untuk penyimpanan media.

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup & Instalasi](#setup--instalasi)
- [Menjalankan Server](#menjalankan-server)
- [Struktur Folder](#struktur-folder)
- [API Documentation](#api-documentation)
  - [Auth](#auth)
  - [Users](#users)
  - [Rooms](#rooms)
  - [Notes](#insta-note)
  - [Admin (Development Only)](#admin-development-only)
- [WebSocket Documentation](#websocket-documentation)
- [Dependencies](#dependencies)
- [Catatan Arsitektur Penting](#catatan-arsitektur-penting)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js (ESM) |
| Web Framework | Express 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 (dengan driver adapter `@prisma/adapter-pg`) |
| Real-time | Socket.IO |
| File Storage | Cloudinary |
| Auth | JWT (access token) |
| Scheduler | node-cron |

---

## Prerequisites

Pastikan tools berikut sudah terpasang di mesin kamu sebelum memulai:

- **Node.js** v20 atau lebih baru
- **npm** v10 atau lebih baru
- **PostgreSQL** v14 atau lebih baru
- **Postman** atau **Insomnia**

---

## Setup & Instalasi

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/JuliusBourbon/iknos-be.git
cd iknos-be
npm install
```

### 2. Konfigurasi Environment Variables

Duplikat file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi seluruh variabel berikut:

```env
# Server
PORT=

# Database (PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/iknos_db?schema=public"

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Room Config
ROOM_CODE_LENGTH=
MAX_ROOM_PER_USER=
MAX_MEMBER_PER_ROOM=
LOCATION_UPDATE_INTERVAL_SEC=
ROOM_EMPTY_GRACE_PERIOD_MIN=
```


### 3. Setup Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Verifikasi skema berhasil dibuat dengan membuka Prisma Studio:

---

## Menjalankan Server

**Mode development** (auto-reload dengan nodemon):

```bash
npm run dev
```



Server berjalan di `http://localhost:3000` (atau sesuai `PORT` di `.env`).

**Cek server berjalan dengan benar:**

```bash
http://localhost:3000/health
```

Response yang diharapkan:
```json
{ "success": true, "message": "IKNOS IS RUNNING!!!", "data": { "status": "ok" } }
```

---

## Struktur Folder

```
iknos-be/
├── postman/                   # Collection dan Environment untuk di import ke postman
│
├── prisma/
│   ├── schema.prisma          # Skema database (models & enum)
│   └── migrations/            # History migration
├── prisma.config.ts           # Konfigurasi koneksi DB untuk Prisma CLI (v7+)
├── src/
│   ├── config/                # Koneksi DB, Cloudinary, env
│   ├── modules/                # 1 folder = 1 domain fitur
│   │   ├── auth/
│   │   ├── users/
│   │   ├── rooms/
│   │   └── notes/
│   ├── websocket/              # Socket.IO: auth, handlers, rate limiter
│   │   └── handlers/
│   ├── middlewares/            # Auth guard, error handler, upload (multer)
│   ├── jobs/                    # Cron job (room cleanup)
│   ├── utils/                   # JWT, password hash, response formatter, dll
│   ├── generated/prisma/        # Auto-generated Prisma Client (jangan diedit manual)
│   ├── app.js                   # Setup Express app & routing
│   └── server.js                # Entry point (HTTP server + Socket.IO + cron)
├── tests/                       # Automated test & script testing manual
└── .env.example
```


---

## API Documentation

**Base URL:** `http://localhost:3000/api`

Seluruh endpoint (kecuali `register` & `login`) membutuhkan header:
```
Authorization: Bearer <access_token>
```

Format response konsisten di seluruh endpoint:

```json
// Sukses
{ "success": true, "message": "...", "data": { ... } }

// Gagal
{ "success": false, "message": "...", "errors": [ ... ] }
```

### Auth

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registrasi akun baru | ❌ |
| POST | `/auth/login` | Login, mengembalikan JWT | ❌ |

**POST `/auth/register`**
```json
// Request Body
{
  "username": "budi123",
  "email": "budi@example.com",
  "password": "rahasia123"
}
```

**POST `/auth/login`**
```json
// Request Body
{ "email": "budi@example.com", "password": "rahasia123" }

// Response
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "...", "email": "...", "avatarUrl": null },
    "token": "eyJhbGciOi..."
  }
}
```

---

### Users

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/users/me` | Ambil profil user login | ✅ |
| PUT | `/users/me/avatar` | Upload/update foto profil | ✅ |

**PUT `/users/me/avatar`** — `multipart/form-data`
| Field | Tipe | Wajib |
|---|---|---|
| `avatar` | File (JPEG/PNG/WEBP, max 5MB) | ✅ |

---

### Rooms

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/rooms` | Buat Room baru | ✅ |
| GET | `/rooms` | List seluruh Room milik user | ✅ |
| GET | `/rooms/:roomId` | Detail Room + daftar member | ✅ |
| POST | `/rooms/join` | Request bergabung via kode Room | ✅ |
| DELETE | `/rooms/:roomId/leave` | Keluar dari Room | ✅ |
| GET | `/rooms/:roomId/requests` | List pending join request (owner only) | ✅ |
| PATCH | `/rooms/requests/:requestId` | Approve/reject join request (owner only) | ✅ |

**POST `/rooms`**
```json
// Request Body
{ "name": "Trip Bandung" }

// Response
{ "success": true, "data": { "id": "...", "name": "Trip Bandung", "code": "X7K2P9", "ownerId": "..." } }
```

**POST `/rooms/join`**
```json
{ "code": "X7K2P9" }
```

**PATCH `/rooms/requests/:requestId`**
```json
{ "action": "approve" }   // atau "reject"
```

**Aturan bisnis penting:**
- Maksimal **5 Room aktif** per user (baik sebagai owner maupun member).
- Maksimal **10 member** per Room.
- Join Room wajib melalui **approval owner** — tidak langsung masuk hanya dengan kode.
- Saat owner keluar, kepemilikan **otomatis berpindah** ke member dengan `joinedAt` paling lama.
- Room yang kosong (`0 member`) otomatis dihapus setelah grace period (default 30 menit) oleh cron job.

---

### Insta Note

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| PUT | `/notes/:roomId` | Buat/update (overwrite) note di Room | ✅ |
| GET | `/notes/:roomId` | List seluruh note member di Room | ✅ |
| DELETE | `/notes/:roomId` | Hapus note milik user di Room | ✅ |

**PUT `/notes/:roomId`** — `multipart/form-data`
| Field | Tipe | Wajib |
|---|---|---|
| `text` | String (max 280 char) | Salah satu wajib (text/image) |
| `image` | File (JPEG/PNG/WEBP, max 5MB) | Salah satu wajib (text/image) |

**Aturan bisnis penting:**
- 1 user hanya boleh punya **1 note aktif per Room** — submit baru otomatis **overwrite** (tidak perlu hapus manual dulu).
- Kalau update hanya mengirim `text` tanpa `image` baru, `imageUrl` lama tetap dipertahankan.
- Note antar-Room bersifat independen.

---

### Admin (Development Only)

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/admin/trigger-room-cleanup` | Trigger manual cron cleanup room kosong | ❌ |

> ⚠️ Endpoint ini hanya aktif saat `NODE_ENV=development` dan **wajib dinonaktifkan/dihapus sebelum deploy ke production**. Fungsinya murni membantu testing tanpa perlu menunggu cron interval atau grace period sungguhan.

---

## WebSocket Documentation

**Koneksi:** `ws://localhost:3000` (Socket.IO)

**Autentikasi** dikirim lewat handshake, bukan header biasa:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: '<JWT_ACCESS_TOKEN>' }
});
```

### Events yang Di-emit oleh Client

| Event | Payload | Deskripsi |
|---|---|---|
| `join_room` | `{ roomId }` | Subscribe socket ke channel Room (harus sudah jadi member approved) |
| `leave_room` | `{ roomId }` | Unsubscribe socket dari channel Room |
| `location_update` | `{ roomId, lat, lng }` | Kirim update lokasi (di-throttle 10 detik di server) |
| `toggle_hide` | `{ roomId, isHidden }` | Sembunyikan/tampilkan lokasi diri sendiri di Room |

### Events yang Diterima Client (Broadcast dari Server)

| Event | Payload | Deskripsi |
|---|---|---|
| `location_broadcast` | `{ userId, roomId, lat, lng, timestamp }` | Update lokasi dari member lain di Room |
| `user_online` | `{ userId, roomId }` | Member lain baru saja join_room |
| `user_offline` | `{ userId, roomId }` | Member lain leave_room |
| `user_visibility_changed` | `{ userId, roomId, isHidden }` | Member lain toggle hide/unhide |

**Catatan penting:**
- Rate-limit **10 detik per user per Room** divalidasi di server (`src/websocket/rateLimiter.js`), bukan hanya dipercaya dari client.
- Saat `join_room` berhasil, client menerima `snapshot` (array posisi member lain yang sedang tidak hidden) via acknowledgment callback — supaya map langsung terisi tanpa menunggu update berikutnya.
- User dengan status `isHidden = true` tetap tersimpan lokasinya di database, tapi **tidak** ikut di-broadcast ke member lain.
- Disconnect socket (app di-background/sinyal putus) **tidak** otomatis mengeluarkan user dari Room secara permanen — itu hanya bisa dilakukan lewat REST `DELETE /api/rooms/:roomId/leave`.

---

## Dependencies

### Production

| Package | Fungsi |
|---|---|
| `express` | Web framework untuk REST API |
| `@prisma/client` + `@prisma/adapter-pg` | ORM & driver adapter PostgreSQL |
| `pg` | Native PostgreSQL driver (dipakai oleh Prisma adapter) |
| `socket.io` | Komunikasi real-time (WebSocket) |
| `cloudinary` | Upload & manajemen media (foto profil, gambar note) |
| `multer` | Parsing `multipart/form-data` untuk upload file |
| `jsonwebtoken` | Generate & verifikasi JWT |
| `bcrypt` | Hashing password |
| `dotenv` | Load environment variables dari `.env` |
| `cors` | Handling Cross-Origin Resource Sharing |
| `helmet` | Menambahkan HTTP security headers |
| `morgan` | HTTP request logger |
| `node-cron` | Scheduler untuk cron job (room cleanup) |

### Development

| Package | Fungsi |
|---|---|
| `nodemon` | Auto-reload server saat development |
| `prisma` | Prisma CLI (migration, generate, studio) |
| `socket.io-client` | Client Socket.IO untuk keperluan testing manual tanpa frontend |

---

## Catatan


1. **Prisma 7 (ESM-only + driver adapter)** — project ini menggunakan `"type": "module"` di `package.json`. Seluruh import lokal **wajib** menyertakan ekstensi `.js`, contoh: `import prisma from '../config/db.js'`. Koneksi database untuk keperluan CLI/migration dikonfigurasi di `prisma.config.ts`, **bukan** di `schema.prisma`.

2. **1 koneksi Socket.IO per user, multi-room subscription** — client tidak perlu membuka koneksi socket terpisah untuk tiap Room. Cukup 1 koneksi, lalu `emit('join_room', ...)` untuk tiap Room yang ingin diikuti.

3. **Rate limiter in-memory** — implementasi saat ini (`src/websocket/rateLimiter.js`) menyimpan state di memory server. Ini cukup untuk single-instance deployment. Kalau nanti di-scale ke multiple server instance (horizontal scaling), rate limiter ini **perlu dipindah ke Redis** agar tetap konsisten lintas instance.

4. **Room cleanup bersifat eventual, bukan instan** — room yang kosong tidak langsung dihapus, melainkan ditandai `emptiedAt` lalu dihapus oleh cron job (interval 5 menit) setelah melewati grace period. Ada mekanisme double-check untuk menghindari race condition (room terhapus padahal baru saja ada yang join lagi).

5. **Upload gambar lama tidak otomatis terhapus dari Cloudinary** saat Insta Note di-overwrite dengan gambar baru. Ini keterbatasan MVP yang disengaja untuk menjaga kesederhanaan — optimisasi storage (hapus asset lama via `public_id`) bisa ditambahkan di iterasi berikutnya.

6. **Side feature (Jejak, Radius Notification) belum diimplementasikan** — skema database saat ini fokus pada MVP. Untuk fitur *Jejak* (histori lokasi) dan *Radius Notification*, kemungkinan akan membutuhkan tabel riwayat lokasi terpisah dan ekstensi PostGIS di PostgreSQL untuk query geospasial.

---
