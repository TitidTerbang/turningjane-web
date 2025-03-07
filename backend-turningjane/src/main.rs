use axum::{
    extract::Path,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, Pool, Postgres};
use std::env;
use uuid::Uuid;

// Database model for Song with genre_name from join
#[derive(Debug, Serialize, FromRow)]
struct SongResponse {
    song_id: Uuid,
    title: String,
    artist: String,
    genre_id: Option<Uuid>,
    genre_name: Option<String>,
    release_year: Option<i32>,
    audio_file_path: Option<String>,
}

// Request struct for creating a song
#[derive(Debug, Deserialize)]
struct CreateSongRequest {
    title: String,
    artist: String,
    genre_id: Option<Uuid>,
    release_year: Option<i32>,
    audio_file_path: Option<String>,
}

// Request struct for updating a song
#[derive(Debug, Deserialize)]
struct UpdateSongRequest {
    title: Option<String>,
    artist: Option<String>,
    genre_id: Option<Uuid>,
    release_year: Option<i32>,
    audio_file_path: Option<String>,
}

// Database model for Genre
#[derive(Debug, Serialize, FromRow)]
struct Genre {
    genre_id: Uuid,
    genre_name: String,
}

// Request struct for creating a genre
#[derive(Debug, Deserialize)]
struct CreateGenreRequest {
    genre_name: String,
}

// Custom error type wrapping anyhow::Error
struct AppError(anyhow::Error);

// Convert AppError into an HTTP response
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Something went wrong: {}", self.0),
        )
            .into_response()
    }
}

// Convert any error into AppError
impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}

// List all songs with genre names
async fn list_songs(
    Extension(pool): Extension<Pool<Postgres>>,
) -> Result<Json<Vec<SongResponse>>, AppError> {
    let songs = sqlx::query_as(
        r#"
        SELECT s.song_id, s.title, s.artist, s.genre_id, 
               g.genre_name, s.release_year, s.audio_file_path
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.genre_id
        "#,
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(songs))
}

// Create a new song
async fn create_song(
    Extension(pool): Extension<Pool<Postgres>>,
    Json(payload): Json<CreateSongRequest>,
) -> Result<Json<SongResponse>, AppError> {
    let song = sqlx::query_as(
        r#"
        INSERT INTO songs (title, artist, genre_id, release_year, audio_file_path)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING song_id, title, artist, genre_id, release_year, audio_file_path
        "#,
    )
    .bind(&payload.title)
    .bind(&payload.artist)
    .bind(&payload.genre_id)
    .bind(&payload.release_year)
    .bind(&payload.audio_file_path)
    .fetch_one(&pool)
    .await?;

    Ok(Json(song))
}

// Get a single song by ID
async fn get_song(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<Pool<Postgres>>,
) -> Result<Json<SongResponse>, AppError> {
    let song = sqlx::query_as(
        r#"
        SELECT s.song_id, s.title, s.artist, s.genre_id, 
               g.genre_name, s.release_year, s.audio_file_path
        FROM songs s
        LEFT JOIN genres g ON s.genre_id = g.genre_id
        WHERE s.song_id = $1
        "#,
    )
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(song))
}

// Update a song
async fn update_song(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<Pool<Postgres>>,
    Json(payload): Json<UpdateSongRequest>,
) -> Result<Json<SongResponse>, AppError> {
    let song = sqlx::query_as(
        r#"
        UPDATE songs
        SET 
            title = COALESCE($1, title),
            artist = COALESCE($2, artist),
            genre_id = COALESCE($3, genre_id),
            release_year = COALESCE($4, release_year),
            audio_file_path = COALESCE($5, audio_file_path)
        WHERE song_id = $6
        RETURNING song_id, title, artist, genre_id, release_year, audio_file_path
        "#,
    )
    .bind(&payload.title)
    .bind(&payload.artist)
    .bind(&payload.genre_id)
    .bind(&payload.release_year)
    .bind(&payload.audio_file_path)
    .bind(id)
    .fetch_one(&pool)
    .await?;

    Ok(Json(song))
}

// Delete a song
async fn delete_song(
    Path(id): Path<Uuid>,
    Extension(pool): Extension<Pool<Postgres>>,
) -> Result<StatusCode, AppError> {
    sqlx::query("DELETE FROM songs WHERE song_id = $1")
        .bind(id)
        .execute(&pool)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}

// List all genres
async fn list_genres(
    Extension(pool): Extension<Pool<Postgres>>,
) -> Result<Json<Vec<Genre>>, AppError> {
    let genres = sqlx::query_as("SELECT genre_id, genre_name FROM genres")
        .fetch_all(&pool)
        .await?;

    Ok(Json(genres))
}

// Create a new genre
async fn create_genre(
    Extension(pool): Extension<Pool<Postgres>>,
    Json(payload): Json<CreateGenreRequest>,
) -> Result<Json<Genre>, AppError> {
    let genre = sqlx::query_as(
        "INSERT INTO genres (genre_name) VALUES ($1) RETURNING genre_id, genre_name",
    )
    .bind(&payload.genre_name)
    .fetch_one(&pool)
    .await?;

    Ok(Json(genre))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenv::dotenv().ok();
    tracing_subscriber::fmt::init();

    // Create database pool
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Configure CORS
    let cors = tower_http::cors::CorsLayer::permissive();

    // Create router
    let app = Router::new()
        .route("/", get(|| async { "Server Berjalan" }))
        .route("/songs", get(list_songs).post(create_song))
        .route("/songs/:id", get(get_song).put(update_song).delete(delete_song))
        .route("/genres", get(list_genres).post(create_genre))
        .layer(Extension(pool))
        .layer(cors);

    // Start server
    let addr = "127.0.0.1:3000".parse()?;
    println!("Server berjalan di http://{}", addr);
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
