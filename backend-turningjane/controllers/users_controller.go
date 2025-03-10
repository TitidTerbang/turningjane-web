package controllers

import (
	"database/sql"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	DB *sql.DB
}

func NewUserController(db *sql.DB) *UserController {
	return &UserController{DB: db}
}

// RegisterRequest menyimpan data yang dibutuhkan untuk pendaftaran
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest menyimpan data yang dibutuhkan untuk login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// User merepresentasikan pengguna di database
type User struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
}

// Register menangani pendaftaran pengguna
func (uc *UserController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah email sudah digunakan
	var exists bool
	err := uc.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan database"})
		return
	}

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email sudah digunakan"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password"})
		return
	}

	// Masukkan pengguna baru
	var userID uuid.UUID
	err = uc.DB.QueryRow(
		"INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
		req.Email, string(hashedPassword),
	).Scan(&userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pengguna"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pengguna berhasil terdaftar",
		"user": User{
			ID:    userID,
			Email: req.Email,
		},
	})
}

// Login menangani autentikasi pengguna
func (uc *UserController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ambil pengguna berdasarkan email
	var user struct {
		ID       uuid.UUID
		Email    string
		Password string
	}

	err := uc.DB.QueryRow(
		"SELECT id, email, password FROM users WHERE email = $1",
		req.Email,
	).Scan(&user.ID, &user.Email, &user.Password)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial tidak valid"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan database"})
		return
	}

	// Verifikasi password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kredensial tidak valid"})
		return
	}

	// Buat sesi
	session := sessions.Default(c)
	session.Set("user_id", user.ID.String())
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login berhasil",
		"user": User{
			ID:    user.ID,
			Email: user.Email,
		},
	})
}

// Logout menangani logout pengguna
func (uc *UserController) Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
}

// GetProfile mengembalikan profil pengguna saat ini
func (uc *UserController) GetProfile(c *gin.Context) {
	// Ambil ID pengguna dari context (diatur oleh middleware AuthRequired)
	userIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Tidak terotorisasi"})
		return
	}

	// Konversi string ke UUID
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ID pengguna tidak valid"})
		return
	}

	// Ambil pengguna dari database
	var user User
	err = uc.DB.QueryRow(
		"SELECT id, email FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Email)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kesalahan database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}
