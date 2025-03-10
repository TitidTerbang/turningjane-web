package models

import (
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
}

type CreateSongRequest struct {
	Title         string     `json:"title" binding:"required"`
	Artist        string     `json:"artist" binding:"required"`
	GenreID       *uuid.UUID `json:"genre_id"`
	ReleaseYear   *int       `json:"release_year"`
	AudioFilePath *string    `json:"audio_file_path"`
}

type UpdateSongRequest struct {
	Title         *string    `json:"title"`
	Artist        *string    `json:"artist"`
	GenreID       *uuid.UUID `json:"genre_id"`
	ReleaseYear   *int       `json:"release_year"`
	AudioFilePath *string    `json:"audio_file_path"`
}

type Genre struct {
	GenreID   uuid.UUID `json:"genre_id"`
	GenreName string    `json:"genre_name"`
}

type CreateGenreRequest struct {
	GenreName string `json:"genre_name" binding:"required"`
}
