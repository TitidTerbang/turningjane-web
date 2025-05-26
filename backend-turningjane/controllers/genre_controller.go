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
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}
	defer rows.Close()

	var genres []models.Genre
	for rows.Next() {
		var genre models.Genre
		if err := rows.Scan(&genre.GenreID, &genre.GenreName); err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan Scan: %v", err)})
			return
		}
		genres = append(genres, genre)
	}

	if err = rows.Err(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan Rows: %v", err)})
		return
	}

	ctx.JSON(http.StatusOK, genres)
}

// CreateGenre membuat genre baru
func (c *GenreController) CreateGenre(ctx *gin.Context) {
	var req models.CreateGenreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Permintaan tidak valid: %v", err)})
		return
	}

	var genre models.Genre
	err := c.DB.QueryRow(
		"INSERT INTO genres (genre_name) VALUES ($1) RETURNING genre_id, genre_name",
		req.GenreName,
	).Scan(&genre.GenreID, &genre.GenreName)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}

	ctx.JSON(http.StatusCreated, genre)
}

// UpdateGenre updates an existing genre
func (c *GenreController) UpdateGenre(ctx *gin.Context) {
	genreID := ctx.Param("id")

	var req models.CreateGenreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Permintaan tidak valid: %v", err)})
		return
	}

	// Check if genre exists
	var exists bool
	err := c.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM genres WHERE genre_id = $1)", genreID).Scan(&exists)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}

	if !exists {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Genre tidak ditemukan"})
		return
	}

	// Update the genre
	var genre models.Genre
	err = c.DB.QueryRow(
		"UPDATE genres SET genre_name = $1 WHERE genre_id = $2 RETURNING genre_id, genre_name",
		req.GenreName, genreID,
	).Scan(&genre.GenreID, &genre.GenreName)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}

	ctx.JSON(http.StatusOK, genre)
}

// DeleteGenre deletes an existing genre
func (c *GenreController) DeleteGenre(ctx *gin.Context) {
	genreID := ctx.Param("id")

	// Check if genre exists
	var exists bool
	err := c.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM genres WHERE genre_id = $1)", genreID).Scan(&exists)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}

	if !exists {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Genre tidak ditemukan"})
		return
	}

	// Check if genre is being used by any songs
	var songCount int
	err = c.DB.QueryRow("SELECT COUNT(*) FROM songs WHERE genre_id = $1", genreID).Scan(&songCount)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}

	if songCount > 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Tidak dapat menghapus genre yang sedang digunakan oleh lagu"})
		return
	}

	// Delete the genre
	_, err = c.DB.Exec("DELETE FROM genres WHERE genre_id = $1", genreID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Kesalahan database: %v", err)})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Genre berhasil dihapus"})
}
