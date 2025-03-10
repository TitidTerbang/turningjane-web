# Website Turning Jane

Website Profile untuk Band Turning Jane yang dibangun dengan SolidJS dan Go.

## Struktur Proyek

```
TurningJane/
├── frontend-turningjane/    # Aplikasi frontend SolidJS 
└── backend-turningjane/     # Server backend Go
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

Frontend akan berjalan di http://localhost:3000

### Build Frontend

```bash
npm run build
npm run preview
```

## Backend 

Backend dibangun menggunakan:
- Go
- Gin (web framework)
- PostgreSQL (database)

### Menjalankan Backend

```bash
cd backend-turningjane
go run main.go
```

Backend akan berjalan di http://localhost:3000

### Konfigurasi Backend

File .env berisi konfigurasi:
- `DATABASE_URL`: Koneksi PostgreSQL ke Supabase

## API Endpoints

### Songs
- GET `/songs` - Mendapatkan daftar lagu
- POST `/songs` - Menambah lagu baru
- GET `/songs/:id` - Mendapatkan detail lagu
- PUT `/songs/:id` - Memperbarui lagu
- DELETE `/songs/:id` - Menghapus lagu

### Genres
- GET `/genres` - Mendapatkan daftar genre
- POST `/genres` - Menambah genre baru

## Fitur

- Manajemen lagu (CRUD)
- Manajemen genre musik
- Integrasi dengan Supabase untuk database
- API RESTful dengan Gin framework
- CORS support untuk frontend
- DLL (masih tahap pengembangan)

## Tech Stack

### Frontend
- SolidJS untuk UI framework
- TypeScript untuk type safety
- Vite untuk development dan build tool

### Backend
- Go untuk server
- Gin untuk HTTP routing dan middleware
- PostgreSQL untuk database (hosted di Supabase)
- UUID untuk unique identifiers