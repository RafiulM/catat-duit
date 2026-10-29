# Catat Duit — Aplikasi Mobile

Frontend React Native + Expo untuk **Catat Duit**, dibangun dari
[`catat-duit-PRD.md`](../catat-duit-PRD.md) dan halaman utama prototipe
DesainPakeAI **“Catat Duit — Beranda”** (`src/pages/catat.page.jsx`) pada
foundation **Progress Weave**.

- Expo SDK 58 · React Native 0.88 · TypeScript
- Expo Router (tabs: Catat, Riwayat, Analisis, Pengaturan)
- SQLite lokal + antrian sinkronisasi (`expo-sqlite`)
- Zustand + TanStack Query
- react-hook-form + Zod
- react-native-svg untuk grafik
- Bearer token Better Auth di `expo-secure-store`

## Menjalankan full stack

Terminal 1 — backend:

```bash
cd backend
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Terminal 2 — frontend:

```bash
cd frontend
npm install
cp .env.example .env
npx expo start
```

Buka di Expo Go / simulator. `EXPO_PUBLIC_API_URL` **harus sama dengan port backend**:

- iOS simulator / web: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`
- Perangkat fisik: `http://<IP-LAN-komputer>:4000`
- API production: `https://api.domainmu.com`

Pastikan `EXPO_PUBLIC_API_URL` menunjuk ke port yang sama dengan `PORT` di
`backend/.env` (default 4000). Setelah mengubah `.env`, restart Metro.

Tanpa akun, aplikasi tetap bisa dipakai penuh secara lokal; masuk hanya dibutuhkan
untuk pencadangan server, kategori buatan sendiri, dan sinkronisasi antarperangkat.
Data lokal (SQLite + antrian `outbox`) otomatis dikirim ke backend setelah
sign-up/login, dan data server ditarik kembali saat aplikasi dibuka.

## Yang sudah diimplementasikan

| Area | Detail |
|---|---|
| **Catat (beranda)** | Sapaan + ringkasan bulan, kartu saldo, batas belanja, catat cepat, tren 7 hari, transaksi hari ini, tanggal lain, status sinkron |
| **Form transaksi** | Pengeluaran/pemasukan, nominal Rupiah, nominal cepat, kategori 3 kolom, catatan, pemilih tanggal, edit, hapus dengan konfirmasi |
| **Riwayat** | Pencarian, filter jenis/kategori/periode, grup per tanggal, detail, edit, hapus |
| **Analisis** | Pemilih bulan, rekap masuk/keluar/sisa, peringatan boncos 80%/100%, donut per kategori, tren harian, perbandingan masuk vs keluar |
| **Pengaturan** | Profil + edit nama/email, reset kata sandi, batas harian/bulanan, ekspor CSV, kategori, status & sinkronisasi manual |
| **Akun** | Halaman Masuk, Daftar, dan Lupa Kata Sandi sesuai prototipe, plus reset kata sandi lewat deep link `catatduit://auth/reset-password` |
| **Offline-first** | Transaksi disimpan ke SQLite dulu, antrian `outbox`, idempotensi lewat `clientId`, retry otomatis saat online/foreground |
| **Kategori** | 13 kategori bawaan dengan ID yang sama dengan backend; tambah/arsipkan kategori saat masuk |

## Integrasi backend

Frontend memakai API di `EXPO_PUBLIC_API_URL` dan menyimpan session token Better Auth
di `expo-secure-store` (web: `expo-sqlite/kv-store`). Semua request data mengirim
`Authorization: Bearer <token>`.

| Alur | Endpoint backend |
|---|---|
| Daftar / login | `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email` |
| Logout | `POST /api/auth/sign-out` |
| Reset password | `POST /api/auth/request-password-reset`, `POST /api/auth/reset-password` |
| Profil | `GET/PATCH /api/v1/me`, `POST /api/v1/me/email` |
| Kategori | `GET/POST/PATCH /api/v1/categories` |
| Transaksi | `GET/POST/PATCH/DELETE /api/v1/transactions` |
| Batas belanja | `GET/POST/PATCH/DELETE /api/v1/budgets` |

- **Local-first:** transaksi ditulis ke SQLite dulu, lalu masuk `outbox`. Setiap
  `clientId` unik dan dikirim ke backend sehingga retry tidak membuat duplikat.
- **Sinkronisasi:** saat login, buka aplikasi, kembali online, atau pull-to-refresh,
  frontend menarik kategori/transaksi/batas dari server lalu mengirim antrian lokal.
- **Analitik & CSV** dihitung dari cache SQLite supaya tetap jalan offline; angka
  yang tampil selalu konsisten dengan transaksi lokal yang juga dipakai untuk sync.
- **Deep link:** `catatduit://auth/reset-password?token=...` dan
  `catatduit://auth/email-verified` ditangani Expo Router. Tautan email memakai
  custom scheme sehingga perlu **development build/EAS build**; di Expo Go gunakan
  `exp://127.0.0.1:8081/--/auth/reset-password?token=...` untuk pengujian.

## Struktur

```text
frontend/
├── assets/fonts/              # Cal Sans Text (SIL OFL) + lisensi
├── src/
│   ├── app/                   # rute Expo Router (src/app)
│   │   ├── (tabs)/            # Catat, Riwayat, Analisis, Pengaturan
│   │   ├── auth/              # Masuk, Daftar, Lupa sandi, Reset
│   │   └── pengaturan/        # Kelola kategori
│   ├── components/            # Design-system primitives + chart
│   ├── data/                  # SQLite, repository, tipe, seed kategori
│   ├── features/              # Bagian layar (home, transaksi)
│   ├── hooks/                 # Query + lifecycle sinkronisasi
│   ├── services/              # API client, sync, sesi, query client
│   ├── stores/                # Zustand auth + network
│   ├── theme/tokens.ts        # Token Progress Weave
│   └── utils/                 # Rupiah, tanggal Indonesia, CSV
└── ...
```

## Keputusan desain

Token diambil dari `src/styles/tokens.css` prototipe DesainPakeAI:

- Teal `#046645`, mint `#CDFACE`, lime `#D0FF64`, sand `#FAF9F7`
- Radius kontrol 12, kartu 20, panel 24
- Ritme 4/8/12/16/24/32
- Status selalu membawa teks/ikon, bukan warna saja
- Grafik dibuat dengan `react-native-svg`, tanpa library chart tambahan
- Font display: **Cal Sans Text** (SIL OFL 1.1, dibundel di `assets/fonts`,
  lisensi di `OFL-CalSans.txt`); font body: **Inter**

Halaman utama mengikuti komposisi prototipe: topbar merek + status sinkron +
avatar, sapaan, kartu saldo teal gelap, aksi catat cepat, tren 7 hari, daftar
hari ini, dan navigasi bawah dengan tab aktif mint. Riwayat mengikuti halaman
kedua prototipe. Analisis dan Pengaturan memakai bahasa visual yang sama karena
belum ada prototipe terpisah.

## Perintah

```bash
npx tsc --noEmit                 # typecheck
npx expo lint                    # ESLint + React Compiler rules
npx expo-doctor                  # cek konfigurasi & dependency
npx expo export --platform ios   # verifikasi bundle produksi
npx expo start                   # dev server
```

## Batasan saat ini

- Sinkronisasi menarik maksimal 1.000 transaksi terbaru per perangkat.
- Penghapusan/pengeditan offline masuk antrian; logout saat antrian belum
  terkirim dapat membuat perubahan itu hilang dari antrian lokal.
- Kategori buatan sendiri memerlukan akun (agar ID-nya valid di server).
- Pengingat batas bersifat in-app; notifikasi push belum disertakan.
- Perubahan email meminta konfirmasi lewat tautan verifikasi; email lama tetap aktif sampai diverifikasi.
- Ekspor CSV dibuat dari data lokal (offline-friendly), bukan endpoint server.
