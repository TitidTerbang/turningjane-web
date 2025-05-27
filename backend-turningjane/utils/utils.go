package utils

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// SupabaseStorageConfig holds configuration for Supabase storage
type SupabaseStorageConfig struct {
	SupabaseURL   string
	SupabaseKey   string
	StorageBucket string
	ImageFolder   string
	AudioFolder   string
}

// NewSupabaseStorageConfig creates a new SupabaseStorageConfig instance
func NewSupabaseStorageConfig() *SupabaseStorageConfig {
	return &SupabaseStorageConfig{
		SupabaseURL:   os.Getenv("SUPABASE_URL"),
		SupabaseKey:   os.Getenv("SUPABASE_KEY"),
		StorageBucket: os.Getenv("SUPABASE_STORAGE_BUCKET"),
		ImageFolder:   "song_images",
		AudioFolder:   "song_audio",
	}
}

// UploadFile uploads a file to Supabase storage
func (c *SupabaseStorageConfig) UploadFile(fileHeader *multipart.FileHeader, folder string) (string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Read file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %v", err)
	}

	// Get file extension
	fileExt := filepath.Ext(fileHeader.Filename)

	// Generate unique filename
	uniqueFilename := uuid.New().String() + fileExt

	// Create path
	filePath := fmt.Sprintf("%s/%s", folder, uniqueFilename)

	// Create URL for Supabase storage API
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", c.SupabaseURL, c.StorageBucket, filePath)

	// Create request
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(fileContent))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	// Add headers
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", c.SupabaseKey))
	req.Header.Add("Content-Type", fileHeader.Header.Get("Content-Type"))
	req.Header.Add("Cache-Control", "3600")

	// Make request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %v", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	// Return the file path that can be used to access the file
	fullPath := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", c.SupabaseURL, c.StorageBucket, filePath)
	return fullPath, nil
}

// UploadSongImage uploads a song image to Supabase storage
func (c *SupabaseStorageConfig) UploadSongImage(fileHeader *multipart.FileHeader) (string, error) {
	return c.UploadFile(fileHeader, c.ImageFolder)
}

// UploadSongAudio uploads a song audio file to Supabase storage
func (c *SupabaseStorageConfig) UploadSongAudio(fileHeader *multipart.FileHeader) (string, error) {
	return c.UploadFile(fileHeader, c.AudioFolder)
}

// DeleteFile deletes a file from Supabase storage
func (c *SupabaseStorageConfig) DeleteFile(filePath string) error {
	// Extract the path after the bucket/public part
	// Example: https://your-project.supabase.co/storage/v1/object/public/bucket-name/folder/file.mp3
	// We need: folder/file.mp3

	// Split URL by "/" and find the parts after "public/bucket-name"
	parts := strings.Split(filePath, "/")

	// Find the index of "public"
	publicIndex := -1
	for i, part := range parts {
		if part == "public" {
			publicIndex = i
			break
		}
	}

	if publicIndex == -1 || publicIndex+2 >= len(parts) {
		return fmt.Errorf("invalid file path format: %s", filePath)
	}

	// Get everything after "public/bucket-name/"
	relativeParts := parts[publicIndex+2:]
	relativePath := strings.Join(relativeParts, "/")

	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", c.SupabaseURL, c.StorageBucket, relativePath)

	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("failed to create delete request: %v", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", c.SupabaseKey))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}
