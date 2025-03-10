package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"backend-turningjane/routes"
)

func main() {
	// Load variabel lingkungan
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan")
	}

	// Dapatkan string koneksi database
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://postgres.gwvbeflaogvnocddnndr:root@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
	}

	// Hubungkan ke database
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Gagal terhubung ke database: %v", err)
	}
	defer db.Close()

	// Konfigurasi connection pool database
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Minute * 5)

	// Verifikasi koneksi database
	err = db.Ping()
	if err != nil {
		log.Fatalf("Gagal ping database: %v", err)
	}

	// Pastikan tabel users ada
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL
		)
	`)
	if err != nil {
		log.Fatalf("Gagal membuat tabel users: %v", err)
	}

	// Setup router dengan koneksi database
	router := routes.SetupRouter(db)

	// Jalankan server
	addr := "127.0.0.1:3000"
	fmt.Printf("Server berjalan di http://%s\n", addr)
	router.Run(addr)
}
