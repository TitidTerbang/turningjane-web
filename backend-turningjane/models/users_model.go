package models

import (
	"database/sql"
	"errors"
	"os"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// User represents a normal user from database
type User struct {
	ID       uuid.UUID `json:"id"`
	Email    string    `json:"email"`
	Password string    `json:"-"` // Don't show password in JSON response
}

// Admin represents an admin user from database
type Admin struct {
	ID       uuid.UUID `json:"id"`
	Email    string    `json:"email"`
	Password string    `json:"-"` // Don't show password in JSON response
}

// DB is the global database connection pool
var DB *sql.DB

// Initialize database connection
func init() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return
	}

	var err error
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		panic(err)
	}

	if err = DB.Ping(); err != nil {
		panic(err)
	}
}

// === USER OPERATIONS ===

// CreateUser creates a new user in the database
func CreateUser(email, password string) (*User, error) {
	// Check if email already exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM users WHERE email = $1", email).Scan(&count)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Insert new user
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

// GetUserByEmail returns user by email
func GetUserByEmail(email string) (*User, error) {
	user := &User{}
	err := DB.QueryRow(
		"SELECT id, email, password FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

// GetUserByID returns user by ID
func GetUserByID(id uuid.UUID) (*User, error) {
	user := &User{}
	err := DB.QueryRow(
		"SELECT id, email FROM users WHERE id = $1",
		id,
	).Scan(&user.ID, &user.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return user, nil
}

// VerifyPassword checks if the given password matches the stored hash
func (u *User) VerifyPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// === ADMIN OPERATIONS ===

// CreateAdmin creates a new admin in the database
func CreateAdmin(email, password string) (*Admin, error) {
	// Check if email already exists
	var count int
	err := DB.QueryRow("SELECT COUNT(*) FROM admins WHERE email = $1", email).Scan(&count)
	if err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, errors.New("admin email already exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Insert new admin
	var adminID uuid.UUID
	err = DB.QueryRow(
		"INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id",
		email, string(hashedPassword),
	).Scan(&adminID)
	if err != nil {
		return nil, err
	}

	return &Admin{
		ID:       adminID,
		Email:    email,
		Password: "",
	}, nil
}

// GetAdminByEmail returns admin by email
func GetAdminByEmail(email string) (*Admin, error) {
	admin := &Admin{}
	err := DB.QueryRow(
		"SELECT id, email, password FROM admins WHERE email = $1",
		email,
	).Scan(&admin.ID, &admin.Email, &admin.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("admin not found")
		}
		return nil, err
	}
	return admin, nil
}

// GetAdminByID returns admin by ID
func GetAdminByID(id uuid.UUID) (*Admin, error) {
	admin := &Admin{}
	err := DB.QueryRow(
		"SELECT id, email FROM admins WHERE id = $1",
		id,
	).Scan(&admin.ID, &admin.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("admin not found")
		}
		return nil, err
	}
	return admin, nil
}

// VerifyPassword checks if the given password matches the stored hash
func (a *Admin) VerifyPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(a.Password), []byte(password))
	return err == nil
}
