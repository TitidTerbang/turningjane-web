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
		Secure:   true,
		SameSite: http.SameSiteNoneMode, // Set to None for CORS support
	})
	router.Use(sessions.Sessions("auth-session", store))

	// Setup CORS with proper configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Accept"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	songController := controllers.NewSongController(db)
	genreController := controllers.NewGenreController(db)
	userController := controllers.NewUserController(db)

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Server Berjalan")
	})

	// Rute Auth (publik)
	router.POST("/register", userController.Register)
	router.POST("/login", userController.Login)
	router.GET("/logout", userController.Logout)

	// Rute publik untuk lagu dan genre
	router.GET("/songs", songController.ListSongs)
	router.GET("/songs/:id", songController.GetSong)
	router.GET("/genres", genreController.ListGenres)

	// Rute yang dilindungi
	protected := router.Group("/api")
	protected.Use(AuthRequired())
	{
		// Rute lagu yang dilindungi
		protected.POST("/songs", songController.CreateSong)
		protected.POST("/songs/upload", songController.CreateSongWithFiles) // Add route for file upload
		protected.PUT("/songs/:id", songController.UpdateSong)
		protected.PUT("/songs/:id/upload", songController.UpdateSongWithFiles) // Add route for updating with files
		protected.DELETE("/songs/:id", songController.DeleteSong)

		// Rute genre yang dilindungi
		protected.POST("/genres", genreController.CreateGenre)
		protected.PUT("/genres/:id", genreController.UpdateGenre)
		protected.DELETE("/genres/:id", genreController.DeleteGenre)

		// Rute profil
		protected.GET("/profile", userController.GetProfile)

		// Rute pengecekan Auth
		protected.GET("/auth", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Authorized"})
		})

		// Rute admin management
		protected.GET("/admins", userController.ListAdmins)
		protected.POST("/admins", userController.CreateAdmin)
		protected.DELETE("/admins/:id", userController.DeleteAdmin)
	}

	return router
}

// AuthRequired adalah middleware yang digunakan untuk memeriksa apakah pengguna telah login atau belum
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")
		if userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Set user_id ke context untuk digunakan di handler
		c.Set("user_id", userID)
		c.Next()
	}
}
