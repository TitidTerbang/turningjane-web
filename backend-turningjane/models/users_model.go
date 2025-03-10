package models

import (
	"database/sql"
	"errors"
	"os"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// User merepresentasikan model pengguna dari database
type User struct {
	ID       uuid.UUID `json:"id"`
	Email    string    `json:"email"`
	Password string    `json:"-"` // Jangan tampilkan kata sandi dalam respons JSON
}

// DB adalah pool koneksi database global
var DB *sql.DB

// Initialize menginisialisasi koneksi database
func init() {
	// Load URL database dari variabel lingkungan
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Ini memungkinkan aplikasi untuk berjalan tetapi fungsi-fungsi DB akan gagal
		// Dalam aplikasi produksi, Anda mungkin ingin gagal dengan cepat di sini
		return
	}

	var err error
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		panic(err)
	}

	// Uji koneksi
	if err = DB.Ping(); err != nil {
		panic(err)
	}
}

// CreateUser membuat pengguna baru dalam database
func CreateUser(email, password string) (*User, error) {
	// Periksa apakah email sudah ada
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = $1", email).Scan(&count)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("email sudah ada")
	}

	// Hash kata sandi
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Sisipkan pengguna baru
	var userID uuid.UUID
	err = DB.QueryRow(
		"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
		email, string(hashedPassword),
	).Scan(&userID)
	if err != nil {
		return nil, err
	}

	return &User{
		ID:       userID,
		Email:    email,
		Password: "",
	}, nil
}

// GetUserByEmail mengembalikan pengguna berdasarkan email
func GetUserByEmail(email string) (*User, error) {
	user := &User{}
	err := DB.QueryRow(
		"SELECT id, email, password FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("pengguna tidak ditemukan")
		}
		return nil, err
	}
	return user, nil
}

// GetUserByID mengembalikan pengguna berdasarkan ID
func GetUserByID(id uuid.UUID) (*User, error) {
	user := &User{}
	err := DB.QueryRow(
		"SELECT id, email FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("pengguna tidak ditemukan")
		}
		return nil, err
	}
	return user, nil
}

// VerifyPassword memeriksa apakah kata sandi yang diberikan cocok dengan hash yang disimpan
func (u *User) VerifyPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}
