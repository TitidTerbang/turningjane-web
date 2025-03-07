# Website Turning Jane

Website Profile Untuk Band Turning Jane yang dibangun dengan SolidJS dan Rust.

## Struktur Proyek

```
TurningJane/
├── frontend-turningjane/    # Aplikasi frontend SolidJS
└── backend-turningjane/     # Server backend Rust
```

## Frontend

Frontend dibangun menggunakan:
- SolidJS
- TypeScript
- Vite

### Menjalankan Frontend

```bash
cd frontend-turningjane
npm install
npm run dev
```

### Build Frontend

```bash
npm run build
npm run preview
```

## Backend 

Backend dibangun menggunakan:
- Rust
- Axum (web framework)
- PostgreSQL (database)

### Menjalankan Backend

```bash
cd backend-turningjane
cargo run
```


### Konfigurasi Backend

File .env berisi konfigurasi:
- `DATABASE_URL`: Koneksi PostgreSQL
- `UPLOAD_DIR`: Direktori untuk upload file
- `RUST_LOG`: Level logging

## Fitur

- Manajemen lagu
- Manajemen genre musik
- Upload file musik
- API RESTful
- DLL(masih tahap pengembangan)