package controllers

import (
	"database/sql"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"backend-turningjane/models"
)

type SongController struct {
	DB *sql.DB
}

func NewSongController(db *sql.DB) *SongController {
	return &SongController{DB: db}
}

func (c *SongController) ListSongs(ctx *gin.Context) {
	query := `
		SELECT s.song_id, s.title, s.artist, s.genre_id, 
			   g.genre_name, s.release_year, s.audio_file_path
		FROM songs s
		LEFT JOIN genres g ON s.genre_id = g.genre_id
	`

	rows, err := c.DB.Query(query)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}
	defer rows.Close()

	var songs []models.SongResponse
	for rows.Next() {
		var song models.SongResponse
		var genreID sql.NullString
		var genreName sql.NullString
		var releaseYear sql.NullInt32
		var audioFilePath sql.NullString

		err := rows.Scan(
			&song.SongID,
			&song.Title,
			&song.Artist,
			&genreID,
			&genreName,
			&releaseYear,
			&audioFilePath,
		)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Scan error: %v", err)})
			return
		}

		if genreID.Valid {
			parsedID, err := uuid.Parse(genreID.String)
			if err == nil {
				song.GenreID = &parsedID
			}
		}
		if genreName.Valid {
			song.GenreName = &genreName.String
		}
		if releaseYear.Valid {
			year := int(releaseYear.Int32)
			song.ReleaseYear = &year
		}
		if audioFilePath.Valid {
			song.AudioFilePath = &audioFilePath.String
		}

		songs = append(songs, song)
	}

	if err = rows.Err(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Rows error: %v", err)})
		return
	}

	ctx.JSON(http.StatusOK, songs)
}

// CreateSong creates a new song
func (c *SongController) CreateSong(ctx *gin.Context) {
	var req models.CreateSongRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	query := `
		INSERT INTO songs (title, artist, genre_id, release_year, audio_file_path)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING song_id, title, artist, genre_id, release_year, audio_file_path
	`

	var song models.SongResponse
	var genreID sql.NullString
	var releaseYear sql.NullInt32
	var audioFilePath sql.NullString

	err := c.DB.QueryRow(
		query,
		req.Title,
		req.Artist,
		req.GenreID,
		req.ReleaseYear,
		req.AudioFilePath,
	).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&genreID,
		&releaseYear,
		&audioFilePath,
	)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	if genreID.Valid {
		parsedID, err := uuid.Parse(genreID.String)
		if err == nil {
			song.GenreID = &parsedID
		}
	}
	if releaseYear.Valid {
		year := int(releaseYear.Int32)
		song.ReleaseYear = &year
	}
	if audioFilePath.Valid {
		song.AudioFilePath = &audioFilePath.String
	}

	ctx.JSON(http.StatusCreated, song)
}

// GetSong retrieves a song by ID
func (c *SongController) GetSong(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID format"})
		return
	}

	query := `
		SELECT s.song_id, s.title, s.artist, s.genre_id, 
			   g.genre_name, s.release_year, s.audio_file_path
		FROM songs s
		LEFT JOIN genres g ON s.genre_id = g.genre_id
		WHERE s.song_id = $1
	`

	var song models.SongResponse
	var genreID sql.NullString
	var genreName sql.NullString
	var releaseYear sql.NullInt32
	var audioFilePath sql.NullString

	err = c.DB.QueryRow(query, id).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&genreID,
		&genreName,
		&releaseYear,
		&audioFilePath,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		}
		return
	}

	if genreID.Valid {
		parsedID, err := uuid.Parse(genreID.String)
		if err == nil {
			song.GenreID = &parsedID
		}
	}
	if genreName.Valid {
		song.GenreName = &genreName.String
	}
	if releaseYear.Valid {
		year := int(releaseYear.Int32)
		song.ReleaseYear = &year
	}
	if audioFilePath.Valid {
		song.AudioFilePath = &audioFilePath.String
	}

	ctx.JSON(http.StatusOK, song)
}

// UpdateSong updates an existing song
func (c *SongController) UpdateSong(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID format"})
		return
	}

	var req models.UpdateSongRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	var currentTitle string
	var currentArtist string
	var currentGenreID sql.NullString
	var currentReleaseYear sql.NullInt32
	var currentAudioFilePath sql.NullString

	err = c.DB.QueryRow(
		"SELECT title, artist, genre_id, release_year, audio_file_path FROM songs WHERE song_id = $1",
		id,
	).Scan(
		&currentTitle,
		&currentArtist,
		&currentGenreID,
		&currentReleaseYear,
		&currentAudioFilePath,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		}
		return
	}

	// Apply updates
	title := currentTitle
	if req.Title != nil {
		title = *req.Title
	}

	artist := currentArtist
	if req.Artist != nil {
		artist = *req.Artist
	}

	var genreID interface{} = nil
	if req.GenreID != nil {
		genreID = *req.GenreID
	} else if currentGenreID.Valid {
		genreID = currentGenreID.String
	}

	var releaseYear interface{} = nil
	if req.ReleaseYear != nil {
		releaseYear = *req.ReleaseYear
	} else if currentReleaseYear.Valid {
		releaseYear = currentReleaseYear.Int32
	}

	var audioFilePath interface{} = nil
	if req.AudioFilePath != nil {
		audioFilePath = *req.AudioFilePath
	} else if currentAudioFilePath.Valid {
		audioFilePath = currentAudioFilePath.String
	}

	// Perform update
	query := `
		UPDATE songs
		SET 
			title = $1,
			artist = $2,
			genre_id = $3,
			release_year = $4,
			audio_file_path = $5
		WHERE song_id = $6
		RETURNING song_id, title, artist, genre_id, release_year, audio_file_path
	`

	var song models.SongResponse
	var updatedGenreID sql.NullString
	var updatedReleaseYear sql.NullInt32
	var updatedAudioFilePath sql.NullString

	err = c.DB.QueryRow(
		query,
		title,
		artist,
		genreID,
		releaseYear,
		audioFilePath,
		id,
	).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&updatedGenreID,
		&updatedReleaseYear,
		&updatedAudioFilePath,
	)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	if updatedGenreID.Valid {
		parsedID, err := uuid.Parse(updatedGenreID.String)
		if err == nil {
			song.GenreID = &parsedID
		}
	}
	if updatedReleaseYear.Valid {
		year := int(updatedReleaseYear.Int32)
		song.ReleaseYear = &year
	}
	if updatedAudioFilePath.Valid {
		song.AudioFilePath = &updatedAudioFilePath.String
	}

	ctx.JSON(http.StatusOK, song)
}

// DeleteSong deletes a song by ID
func (c *SongController) DeleteSong(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID format"})
		return
	}

	result, err := c.DB.Exec("DELETE FROM songs WHERE song_id = $1", id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	if rowsAffected == 0 {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		return
	}

	ctx.Status(http.StatusNoContent)
}
