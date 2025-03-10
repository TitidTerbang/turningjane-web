package routes

import (
	"database/sql"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"backend-turningjane/controllers"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	router := gin.Default()

	router.Use(cors.Default())

	songController := controllers.NewSongController(db)
	genreController := controllers.NewGenreController(db)

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Server Berjalan")
	})

	router.GET("/songs", songController.ListSongs)
	router.POST("/songs", songController.CreateSong)
	router.GET("/songs/:id", songController.GetSong)
	router.PUT("/songs/:id", songController.UpdateSong)
	router.DELETE("/songs/:id", songController.DeleteSong)

	router.GET("/genres", genreController.ListGenres)
	router.POST("/genres", genreController.CreateGenre)

	return router
}
