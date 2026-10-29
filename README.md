# Catat Duit

Aplikasi pencatat keuangan pribadi — Expo React Native + backend REST API, dibangun
berdasarkan [`catat-duit-PRD.md`](./catat-duit-PRD.md).

| Bagian | Stack | Lokasi |
|---|---|---|
| Mobile | Expo SDK 58 · React Native 0.88 · Expo Router · SQLite + outbox · Zustand · TanStack Query | [`frontend/`](./frontend) |
| Backend | Express 5 · TypeScript · PostgreSQL · Drizzle · Better Auth · Zod · Swagger | [`backend/`](./backend) |

## Menjalankan

Terminal 1 — backend:

```bash
cd backend
docker compose up -d
cp .env.example .env        # isi BETTER_AUTH_SECRET (openssl rand -hex 32)
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Terminal 2 — mobile:

```bash
cd frontend
npm install
cp .env.example .env        # samakan EXPO_PUBLIC_API_URL dengan port backend
npx expo start
```

> Bila port 4000 dipakai proses lain, ganti `PORT`, `BETTER_AUTH_URL`, dan
> `EXPO_PUBLIC_API_URL` secara bersamaan. Workspace ini memakai port **4100**.

Dokumentasi lengkap:

- [Frontend — alur aplikasi, local-first sync, deep link](./frontend/README.md)
- [Backend — endpoint, environment, keamanan, deploy](./backend/README.md)
- Swagger UI: `http://localhost:<PORT>/api/docs`

## Test

```bash
cd backend
npm test

cd ../frontend
npx tsc --noEmit
npx expo lint
```
