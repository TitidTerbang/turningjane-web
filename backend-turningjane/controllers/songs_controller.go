package controllers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"backend-turningjane/models"
	"backend-turningjane/utils"
)

type SongController struct {
	DB            *sql.DB
	StorageConfig *utils.SupabaseStorageConfig
}

func NewSongController(db *sql.DB) *SongController {
	return &SongController{
		DB:            db,
		StorageConfig: utils.NewSupabaseStorageConfig(),
	}
}

// Helper function to check if error is "file not found"
func (c *SongController) isNotFoundError(err error) bool {
	if err == nil {
		return false
	}

	errStr := strings.ToLower(err.Error())
	return strings.Contains(errStr, "404") ||
		strings.Contains(errStr, "not_found") ||
		strings.Contains(errStr, "object not found") ||
		strings.Contains(errStr, "nosuchkey")
}

// Helper function to safely delete file from Supabase storage
func (c *SongController) safeDeleteFile(filePath string, fileType string) {
	if filePath == "" {
		return
	}

	log.Printf("Attempting to delete %s file: %s", fileType, filePath)

	err := c.StorageConfig.DeleteFile(filePath)
	if err != nil {
		if c.isNotFoundError(err) {
			log.Printf("%s file already deleted or not found: %s", fileType, filePath)
		} else {
			log.Printf("Error deleting %s file %s: %v", fileType, filePath, err)
		}
	} else {
		log.Printf("Successfully deleted %s file: %s", fileType, filePath)
	}
}

// ListSongs mengambil daftar semua lagu dari database
func (c *SongController) ListSongs(ctx *gin.Context) {
	query := `
		SELECT s.song_id, s.title, s.artist, s.genre_id, 
			   g.genre_name, s.release_year, s.audio_file_path, s.image_path
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
		var imagePath sql.NullString

		err := rows.Scan(
			&song.SongID,
			&song.Title,
			&song.Artist,
			&genreID,
			&genreName,
			&releaseYear,
			&audioFilePath,
			&imagePath,
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
		if imagePath.Valid {
			song.ImagePath = &imagePath.String
		}

		songs = append(songs, song)
	}

	if err = rows.Err(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Rows error: %v", err)})
		return
	}

	ctx.JSON(http.StatusOK, songs)
}

// CreateSong menambahkan lagu baru ke dalam database (JSON based)
func (c *SongController) CreateSong(ctx *gin.Context) {
	var req models.CreateSongRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	query := `
		INSERT INTO songs (title, artist, genre_id, release_year, audio_file_path, image_path)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING song_id, title, artist, genre_id, release_year, audio_file_path, image_path
	`

	var song models.SongResponse
	var genreID sql.NullString
	var releaseYear sql.NullInt32
	var audioFilePath sql.NullString
	var imagePath sql.NullString

	err := c.DB.QueryRow(
		query,
		req.Title,
		req.Artist,
		req.GenreID,
		req.ReleaseYear,
		req.AudioFilePath,
		req.ImagePath,
	).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&genreID,
		&releaseYear,
		&audioFilePath,
		&imagePath,
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
	if imagePath.Valid {
		song.ImagePath = &imagePath.String
	}

	ctx.JSON(http.StatusCreated, song)
}

// CreateSongWithFiles menambahkan lagu baru beserta file audio dan gambar
func (c *SongController) CreateSongWithFiles(ctx *gin.Context) {
	var req models.CreateSongFormRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid form request: %v", err)})
		return
	}

	// Parse GenreID if provided
	var genreID *uuid.UUID
	if req.GenreID != "" {
		parsed, err := uuid.Parse(req.GenreID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID format"})
			return
		}
		genreID = &parsed
	}

	// Parse ReleaseYear if provided
	var releaseYear *int
	if req.ReleaseYear != "" {
		year, err := strconv.Atoi(req.ReleaseYear)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release year format"})
			return
		}
		releaseYear = &year
	}

	// Upload audio file if provided
	var audioFilePath *string
	if req.AudioFile != nil {
		path, err := c.StorageConfig.UploadSongAudio(req.AudioFile)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to upload audio file: %v", err)})
			return
		}
		audioFilePath = &path
	}

	// Upload image file if provided
	var imagePath *string
	if req.ImageFile != nil {
		path, err := c.StorageConfig.UploadSongImage(req.ImageFile)
		if err != nil {
			// If we've already uploaded the audio file, try to delete it to avoid orphaned files
			if audioFilePath != nil {
				_ = c.StorageConfig.DeleteFile(*audioFilePath)
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to upload image file: %v", err)})
			return
		}
		imagePath = &path
	}

	query := `
		INSERT INTO songs (title, artist, genre_id, release_year, audio_file_path, image_path)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING song_id, title, artist, genre_id, release_year, audio_file_path, image_path
	`

	var song models.SongResponse
	var dbGenreID sql.NullString
	var dbReleaseYear sql.NullInt32
	var dbAudioFilePath sql.NullString
	var dbImagePath sql.NullString

	err := c.DB.QueryRow(
		query,
		req.Title,
		req.Artist,
		genreID,
		releaseYear,
		audioFilePath,
		imagePath,
	).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&dbGenreID,
		&dbReleaseYear,
		&dbAudioFilePath,
		&dbImagePath,
	)

	if err != nil {
		// Cleanup uploaded files on database error
		if audioFilePath != nil {
			c.safeDeleteFile(*audioFilePath, "audio")
		}
		if imagePath != nil {
			c.safeDeleteFile(*imagePath, "image")
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		return
	}

	if dbGenreID.Valid {
		parsedID, err := uuid.Parse(dbGenreID.String)
		if err == nil {
			song.GenreID = &parsedID
		}
	}
	if dbReleaseYear.Valid {
		year := int(dbReleaseYear.Int32)
		song.ReleaseYear = &year
	}
	if dbAudioFilePath.Valid {
		song.AudioFilePath = &dbAudioFilePath.String
	}
	if dbImagePath.Valid {
		song.ImagePath = &dbImagePath.String
	}

	ctx.JSON(http.StatusCreated, song)
}

// GetSong mengambil detail lagu berdasarkan ID
func (c *SongController) GetSong(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID format"})
		return
	}

	query := `
		SELECT s.song_id, s.title, s.artist, s.genre_id, 
			   g.genre_name, s.release_year, s.audio_file_path, s.image_path
		FROM songs s
		LEFT JOIN genres g ON s.genre_id = g.genre_id
		WHERE s.song_id = $1
	`

	var song models.SongResponse
	var genreID sql.NullString
	var genreName sql.NullString
	var releaseYear sql.NullInt32
	var audioFilePath sql.NullString
	var imagePath sql.NullString

	err = c.DB.QueryRow(query, id).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&genreID,
		&genreName,
		&releaseYear,
		&audioFilePath,
		&imagePath,
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
	if imagePath.Valid {
		song.ImagePath = &imagePath.String
	}

	ctx.JSON(http.StatusOK, song)
}

// UpdateSong memperbarui data lagu berdasarkan ID (JSON based)
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

	// Mengambil data lagu saat ini untuk pembaruan selektif
	var currentTitle string
	var currentArtist string
	var currentGenreID sql.NullString
	var currentReleaseYear sql.NullInt32
	var currentAudioFilePath sql.NullString
	var currentImagePath sql.NullString

	err = c.DB.QueryRow(
		"SELECT title, artist, genre_id, release_year, audio_file_path, image_path FROM songs WHERE song_id = $1",
		id,
	).Scan(
		&currentTitle,
		&currentArtist,
		&currentGenreID,
		&currentReleaseYear,
		&currentAudioFilePath,
		&currentImagePath,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		}
		return
	}

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

	var imagePath interface{} = nil
	if req.ImagePath != nil {
		imagePath = *req.ImagePath
	} else if currentImagePath.Valid {
		imagePath = currentImagePath.String
	}

	// Menerapkan perubahan hanya jika ada data baru
	query := `
		UPDATE songs
		SET 
			title = $1,
			artist = $2,
			genre_id = $3,
			release_year = $4,
			audio_file_path = $5,
			image_path = $6
		WHERE song_id = $7
		RETURNING song_id, title, artist, genre_id, release_year, audio_file_path, image_path
	`

	var song models.SongResponse
	var updatedGenreID sql.NullString
	var updatedReleaseYear sql.NullInt32
	var updatedAudioFilePath sql.NullString
	var updatedImagePath sql.NullString

	err = c.DB.QueryRow(
		query,
		title,
		artist,
		genreID,
		releaseYear,
		audioFilePath,
		imagePath,
		id,
	).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&updatedGenreID,
		&updatedReleaseYear,
		&updatedAudioFilePath,
		&updatedImagePath,
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
	if updatedImagePath.Valid {
		song.ImagePath = &updatedImagePath.String
	}

	ctx.JSON(http.StatusOK, song)
}

// UpdateSongWithFiles memperbarui lagu dengan kemungkinan upload file
func (c *SongController) UpdateSongWithFiles(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID format"})
		return
	}

	var req models.UpdateSongFormRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid form request: %v", err)})
		return
	}

	// Mengambil data lagu saat ini untuk pembaruan selektif
	var currentTitle string
	var currentArtist string
	var currentGenreID sql.NullString
	var currentReleaseYear sql.NullInt32
	var currentAudioFilePath sql.NullString
	var currentImagePath sql.NullString

	err = c.DB.QueryRow(
		"SELECT title, artist, genre_id, release_year, audio_file_path, image_path FROM songs WHERE song_id = $1",
		id,
	).Scan(
		&currentTitle,
		&currentArtist,
		&currentGenreID,
		&currentReleaseYear,
		&currentAudioFilePath,
		&currentImagePath,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		}
		return
	}

	// Menggunakan nilai-nilai saat ini sebagai default
	title := currentTitle
	if req.Title != nil {
		title = *req.Title
	}

	artist := currentArtist
	if req.Artist != nil {
		artist = *req.Artist
	}

	var genreID interface{} = nil
	if req.GenreID != nil && *req.GenreID != "" {
		parsed, err := uuid.Parse(*req.GenreID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID format"})
			return
		}
		genreID = parsed
	} else if currentGenreID.Valid {
		genreID = currentGenreID.String
	}

	var releaseYear interface{} = nil
	if req.ReleaseYear != nil && *req.ReleaseYear != "" {
		year, err := strconv.Atoi(*req.ReleaseYear)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release year format"})
			return
		}
		releaseYear = year
	} else if currentReleaseYear.Valid {
		releaseYear = currentReleaseYear.Int32
	}

	// Mengelola file audio
	var audioFilePath interface{} = nil
	if req.AudioFile != nil {
		// Upload file audio baru
		path, err := c.StorageConfig.UploadSongAudio(req.AudioFile)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to upload audio file: %v", err)})
			return
		}
		audioFilePath = path

		// Menghapus file audio lama jika ada
		if currentAudioFilePath.Valid && currentAudioFilePath.String != "" {
			c.safeDeleteFile(currentAudioFilePath.String, "audio")
		}
	} else if currentAudioFilePath.Valid {
		audioFilePath = currentAudioFilePath.String
	}

	// Mengelola file gambar
	var imagePath interface{} = nil
	if req.ImageFile != nil {
		// Upload file gambar baru
		path, err := c.StorageConfig.UploadSongImage(req.ImageFile)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to upload image file: %v", err)})
			return
		}
		imagePath = path

		// Menghapus file gambar lama jika ada
		if currentImagePath.Valid && currentImagePath.String != "" {
			c.safeDeleteFile(currentImagePath.String, "image")
		}
	} else if currentImagePath.Valid {
		imagePath = currentImagePath.String
	}

	// Menerapkan perubahan ke database
	query := `
		UPDATE songs
		SET 
			title = $1,
			artist = $2,
			genre_id = $3,
			release_year = $4,
			audio_file_path = $5,
			image_path = $6
		WHERE song_id = $7
		RETURNING song_id, title, artist, genre_id, release_year, audio_file_path, image_path
	`

	var song models.SongResponse
	var updatedGenreID sql.NullString
	var updatedReleaseYear sql.NullInt32
	var updatedAudioFilePath sql.NullString
	var updatedImagePath sql.NullString

	err = c.DB.QueryRow(
		query,
		title,
		artist,
		genreID,
		releaseYear,
		audioFilePath,
		imagePath,
		id,
	).Scan(
		&song.SongID,
		&song.Title,
		&song.Artist,
		&updatedGenreID,
		&updatedReleaseYear,
		&updatedAudioFilePath,
		&updatedImagePath,
	)

	if err != nil {
		// Rollback jika gagal update database
		if audioFilePath != nil && audioFilePath != currentAudioFilePath.String {
			c.safeDeleteFile(audioFilePath.(string), "audio")
		}
		if imagePath != nil && imagePath != currentImagePath.String {
			c.safeDeleteFile(imagePath.(string), "image")
		}
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
	if updatedImagePath.Valid {
		song.ImagePath = &updatedImagePath.String
	}

	ctx.JSON(http.StatusOK, song)
}

// DeleteSong menghapus lagu berdasarkan ID
func (c *SongController) DeleteSong(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UUID format"})
		return
	}

	// Ambil jalur file terlebih dahulu untuk menghapus file dari storage
	var audioFilePath sql.NullString
	var imagePath sql.NullString

	err = c.DB.QueryRow(
		"SELECT audio_file_path, image_path FROM songs WHERE song_id = $1",
		id,
	).Scan(&audioFilePath, &imagePath)

	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Song not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Database error: %v", err)})
		}
		return
	}

	// Hapus lagu dari database
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

	// Hapus file dari storage dengan safe deletion
	if audioFilePath.Valid {
		c.safeDeleteFile(audioFilePath.String, "audio")
	}

	if imagePath.Valid {
		c.safeDeleteFile(imagePath.String, "image")
	}

	ctx.Status(http.StatusNoContent)
}
