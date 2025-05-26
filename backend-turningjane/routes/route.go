package routes

import (
	"database/sql"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"

	"backend-turningjane/controllers"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()

	// Setup session
	store := cookie.NewStore([]byte("secret-session-key"))
	store.Options(sessions.Options{
		Path:     "/",
		MaxAge:   3600 * 24, // umur cookies
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
	router.Use(sessions.Sessions("auth-session", store))

	// Setup CORS with proper configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Accept"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	// Initialize controllers
	songController := controllers.NewSongController(db)
	genreController := controllers.NewGenreController(db)
	userController := controllers.NewUserController(db)
	adminController := controllers.NewAdminController(db)

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Server Berjalan")
	})

	// === PUBLIC ROUTES ===

	// User authentication routes
	router.POST("/register", userController.Register)
	router.POST("/login", userController.Login)
	router.POST("/logout", userController.Logout)

	// Admin authentication routes
	router.POST("/admin/login", adminController.AdminLogin)
	router.POST("/admin/logout", adminController.AdminLogout)

	// Public routes for songs and genres
	router.GET("/songs", songController.ListSongs)
	router.GET("/songs/:id", songController.GetSong)
	router.GET("/genres", genreController.ListGenres)

	// === PROTECTED ROUTES ===
	protected := router.Group("/api")
	protected.Use(AuthRequired())
	{
		// === USER ROUTES ===
		userRoutes := protected.Group("/users")
		{
			userRoutes.GET("/profile", userController.GetProfile)
			userRoutes.GET("/", userController.ListUsers)        // List all users (admin access)
			userRoutes.PUT("/:id", userController.UpdateUser)    // Update user
			userRoutes.DELETE("/:id", userController.DeleteUser) // Delete user
		}

		// === ADMIN ROUTES ===
		adminRoutes := protected.Group("/admin")
		adminRoutes.Use(AdminRequired()) // Additional admin check
		{
			// Admin profile management
			adminRoutes.GET("/profile", adminController.GetAdminProfile)

			// Admin CRUD operations
			adminRoutes.GET("/", adminController.ListAdmins)        // List all admins
			adminRoutes.POST("/", adminController.CreateAdmin)      // Create new admin
			adminRoutes.PUT("/:id", adminController.UpdateAdmin)    // Update admin
			adminRoutes.DELETE("/:id", adminController.DeleteAdmin) // Delete admin

			// Admin management of users (optional - if admins can manage users)
			adminRoutes.GET("/users", userController.ListUsers)         // Admin can view all users
			adminRoutes.PUT("/users/:id", userController.UpdateUser)    // Admin can update users
			adminRoutes.DELETE("/users/:id", userController.DeleteUser) // Admin can delete users
		}

		// === CONTENT MANAGEMENT ROUTES (Admin only) ===
		contentRoutes := protected.Group("/content")
		contentRoutes.Use(AdminRequired())
		{
			// Song management (admin only)
			contentRoutes.POST("/songs", songController.CreateSong)
			contentRoutes.POST("/songs/upload", songController.CreateSongWithFiles)
			contentRoutes.PUT("/songs/:id", songController.UpdateSong)
			contentRoutes.PUT("/songs/:id/upload", songController.UpdateSongWithFiles)
			contentRoutes.DELETE("/songs/:id", songController.DeleteSong)

			// Genre management (admin only)
			contentRoutes.POST("/genres", genreController.CreateGenre)
			contentRoutes.PUT("/genres/:id", genreController.UpdateGenre)
			contentRoutes.DELETE("/genres/:id", genreController.DeleteGenre)
		}

		// === GENERAL AUTHENTICATED ROUTES ===

		// Auth check route
		protected.GET("/auth", func(c *gin.Context) {
			userType, _ := c.Get("user_type")
			c.JSON(http.StatusOK, gin.H{
				"message":   "Authorized",
				"user_type": userType,
			})
		})
	}

	return router
}

// AuthRequired middleware checks if user is authenticated
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")
		userType := session.Get("user_type")

		if userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Set user_id and user_type to context for use in handlers
		c.Set("user_id", userID)
		c.Set("user_type", userType)
		c.Next()
	}
}

// AdminRequired middleware checks if user is an admin
func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("user_type")
		if !exists || userType != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}
