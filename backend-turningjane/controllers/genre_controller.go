package controllers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"backend-turningjane/models"
)

type GenreController struct {
	DB *sql.DB
}

func NewGenreController(db *sql.DB) *GenreController {
	return &GenreController{DB: db}
}

func (c *GenreController) ListGenres(ctx *gin.Context) {
	rows, err := c.DB.Query("SELECT genre_id, genre_name FROM genres")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}
	defer rows.Close()

	var genres []models.Genre
	for rows.Next() {
		var genre models.Genre
		if err := rows.Scan(&genre.GenreID, &genre.GenreName); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Scan error: %v", err)})
			return
		}
		genres = append(genres, genre)
	}

	if err = rows.Err(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Rows error: %v", err)})
		return
	}

	ctx.JSON(http.StatusOK, genres)
}

// CreateGenre creates a new genre
func (c *GenreController) CreateGenre(ctx *gin.Context) {
	var req models.CreateGenreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	var genre models.Genre
	err := c.DB.QueryRow(
		"INSERT INTO genres (genre_name) VALUES ($1) RETURNING genre_id, genre_name",
		req.GenreName,
	).Scan(&genre.GenreID, &genre.GenreName)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	ctx.JSON(http.StatusCreated, genre)
}
