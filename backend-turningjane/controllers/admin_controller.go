package controllers

import (
	"database/sql"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminController struct {
	DB *sql.DB
}

func NewAdminController(db *sql.DB) *AdminController {
	return &AdminController{DB: db}
}

// Admin represents an admin user
type Admin struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
}

// === ADMIN CRUD OPERATIONS ===

// AdminLogin handles admin authentication
func (ac *AdminController) AdminLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get admin by email from admins table
	var admin struct {
		ID       uuid.UUID
		Email    string
		Password string
	}

	err := ac.DB.QueryRow(
		"SELECT id, email, password FROM admins WHERE email = $1",
		req.Email,
	).Scan(&admin.ID, &admin.Email, &admin.Password)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Create session
	session := sessions.Default(c)
	session.Set("user_id", admin.ID.String())
	session.Set("user_type", "admin")
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin login successful",
		"admin": Admin{
			ID:    admin.ID,
			Email: admin.Email,
		},
	})
}

// ListAdmins returns all admin users
func (ac *AdminController) ListAdmins(c *gin.Context) {
	rows, err := ac.DB.Query("SELECT id, email FROM admins ORDER BY email ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer rows.Close()

	var admins []Admin
	for rows.Next() {
		var admin Admin
		if err := rows.Scan(&admin.ID, &admin.Email); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Scan error"})
			return
		}
		admins = append(admins, admin)
	}

	c.JSON(http.StatusOK, admins)
}

// CreateAdmin creates a new admin user
func (ac *AdminController) CreateAdmin(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email already exists in admins table
	var exists bool
	err := ac.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM admins WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin email already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Insert new admin
	var adminID uuid.UUID
	err = ac.DB.QueryRow(
		"INSERT INTO admins (email, password) VALUES ($1, $2) RETURNING id",
		req.Email, string(hashedPassword),
	).Scan(&adminID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admin"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Admin created successfully",
		"admin": Admin{
			ID:    adminID,
			Email: req.Email,
		},
	})
}

// GetAdminProfile returns current admin profile
func (ac *AdminController) GetAdminProfile(c *gin.Context) {
	adminIDStr, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	adminID, err := uuid.Parse(adminIDStr.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid admin ID"})
		return
	}

	var admin Admin
	err = ac.DB.QueryRow(
		"SELECT id, email FROM admins WHERE id = $1",
		adminID,
	).Scan(&admin.ID, &admin.Email)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"admin": admin})
}

// UpdateAdmin updates admin information
func (ac *AdminController) UpdateAdmin(c *gin.Context) {
	adminID := c.Param("id")
	id, err := uuid.Parse(adminID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	var req struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email already exists (excluding current admin)
	var exists bool
	err = ac.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM admins WHERE email = $1 AND id != $2)", req.Email, id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}

	// Update admin
	if req.Password != "" {
		// Update with password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
			return
		}

		_, err = ac.DB.Exec("UPDATE admins SET email = $1, password = $2 WHERE id = $3", req.Email, string(hashedPassword), id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin"})
			return
		}
	} else {
		// Update without password
		_, err = ac.DB.Exec("UPDATE admins SET email = $1 WHERE id = $2", req.Email, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admin"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin updated successfully"})
}

// DeleteAdmin deletes an admin user
func (ac *AdminController) DeleteAdmin(c *gin.Context) {
	adminID := c.Param("id")
	id, err := uuid.Parse(adminID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	// Check if admin exists
	var exists bool
	err = ac.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM admins WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		return
	}

	// Don't allow deleting yourself
	currentUserID := c.GetString("user_id")
	if currentUserID == adminID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	// Delete admin
	_, err = ac.DB.Exec("DELETE FROM admins WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin deleted successfully"})
}

// AdminLogout handles admin logout
func (ac *AdminController) AdminLogout(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin logout successful"})
}
