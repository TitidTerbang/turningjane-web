# Website Turning Jane

Website Profile untuk Band Turning Jane yang dibangun dengan SolidJS dan Go.

## 🚀 Tech Stack

### Frontend
- **SolidJS** - UI framework yang reaktif dan performan
- **TypeScript** - Type safety dan developer experience
- **Vite** - Development server dan build tool
- **TailwindCSS** - Utility-first CSS framework
- **FontAwesome** - Icon library

### Backend
- **Go** - Server-side programming language
- **Gin** - HTTP web framework untuk Go
- **PostgreSQL** - Database (hosted di Supabase)
- **UUID** - Unique identifiers

## 📁 Struktur Proyek

```
TurningJane/
├── frontend-turningjane/    # Aplikasi frontend SolidJS 
│   ├── src/
│   │   ├── assets/         # Logo dan asset statis
│   │   ├── styles/         # Global CSS
│   │   ├── App.tsx         # Komponen utama
│   │   └── index.tsx       # Entry point
│   ├── package.json
│   └── index.html
└── backend-turningjane/     # Server backend Go
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 atau lebih baru)
- Go (v1.19 atau lebih baru)
- PostgreSQL atau akses ke Supabase

### Frontend Setup

```bash
cd frontend-turningjane
npm install
npm run dev
```

Frontend akan berjalan di **http://localhost:3000**

#### Available Scripts
- `npm run dev` atau `npm start` - Development mode
- `npm run build` - Build untuk production
- `npm run serve` - Preview production build

### Backend Setup

```bash
cd backend-turningjane
go mod tidy
go run main.go
```

Backend akan berjalan di **http://127.0.0.1:3000**

### Environment Configuration

Buat file `.env` di folder `backend-turningjane`:
```env
DATABASE_URL=your_postgresql_connection_string
PORT=8080
```

## 📡 API Endpoints

### Songs Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/songs` | Mendapatkan daftar semua lagu |
| POST | `/songs` | Menambah lagu baru |
| GET | `/songs/:id` | Mendapatkan detail lagu berdasarkan ID |
| PUT | `/songs/:id` | Memperbarui informasi lagu |
| DELETE | `/songs/:id` | Menghapus lagu |

### Genres Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/genres` | Mendapatkan daftar semua genre |
| POST | `/genres` | Menambah genre baru |

## ✨ Fitur

- ✅ **Manajemen Lagu (CRUD)** - Create, Read, Update, Delete lagu
- ✅ **Manajemen Genre Musik** - Kategorisasi lagu berdasarkan genre
- ✅ **Database Integration** - Integrasi dengan Supabase PostgreSQL
- ✅ **RESTful API** - API yang mengikuti standar REST
- ✅ **CORS Support** - Cross-origin resource sharing untuk frontend
- ✅ **Responsive Design** - Design yang responsive dengan TailwindCSS
- ✅ **TypeScript Support** - Type safety di frontend
- 🚧 **Authentication** - **80%** Sistem login/register (dalam pengembangan)
- 🚧 **File Upload** - **99%** Upload foto dan audio (dalam pengembangan)
- 🚧 **Admin Dashboard** - **90%** Panel admin untuk manajemen konten (dalam pengembangan)

## 🚀 Deployment

### Frontend Deployment
Frontend dapat di-deploy ke platform seperti:
- Netlify
- Vercel
- GitHub Pages
- Surge.sh

```bash
npm run build
# Upload folder 'dist' ke hosting provider
```

### Backend Deployment
Backend dapat di-deploy ke:
- Heroku
- Railway
- Google Cloud Platform
- DigitalOcean

## 🤝 Contributing

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## 📝 License

Project ini menggunakan MIT License.

## 📞 Contact

Untuk pertanyaan atau dukungan, silakan hubungi tim pengembang.

---

**Made with ❤️ for Turning Jane Band**