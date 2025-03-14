package models

import (
	"mime/multipart"

	"github.com/google/uuid"
)

type SongResponse struct {
	SongID        uuid.UUID  `json:"song_id"`
	Title         string     `json:"title"`
	Artist        string     `json:"artist"`
	GenreID       *uuid.UUID `json:"genre_id"`
	GenreName     *string    `json:"genre_name"`
	ReleaseYear   *int       `json:"release_year"`
	AudioFilePath *string    `json:"audio_file_path"`
	ImagePath     *string    `json:"image_path"`
}

type CreateSongRequest struct {
	Title         string     `json:"title" binding:"required"`
	Artist        string     `json:"artist" binding:"required"`
	GenreID       *uuid.UUID `json:"genre_id"`
	ReleaseYear   *int       `json:"release_year"`
	AudioFilePath *string    `json:"audio_file_path"`
	ImagePath     *string    `json:"image_path"`
}

type CreateSongFormRequest struct {
	Title       string                `form:"title" binding:"required"`
	Artist      string                `form:"artist" binding:"required"`
	GenreID     string                `form:"genre_id"`
	ReleaseYear string                `form:"release_year"`
	AudioFile   *multipart.FileHeader `form:"audio_file"`
	ImageFile   *multipart.FileHeader `form:"image_file"`
}

type UpdateSongRequest struct {
	Title         *string    `json:"title"`
	Artist        *string    `json:"artist"`
	GenreID       *uuid.UUID `json:"genre_id"`
	ReleaseYear   *int       `json:"release_year"`
	AudioFilePath *string    `json:"audio_file_path"`
	ImagePath     *string    `json:"image_path"`
}

type UpdateSongFormRequest struct {
	Title       *string               `form:"title"`
	Artist      *string               `form:"artist"`
	GenreID     *string               `form:"genre_id"`
	ReleaseYear *string               `form:"release_year"`
	AudioFile   *multipart.FileHeader `form:"audio_file"`
	ImageFile   *multipart.FileHeader `form:"image_file"`
}

type Genre struct {
	GenreID   uuid.UUID `json:"genre_id"`
	GenreName string    `json:"genre_name"`
}

type CreateGenreRequest struct {
	GenreName string `json:"genre_name" binding:"required"`
}
