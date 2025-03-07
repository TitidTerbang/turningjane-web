use tokio_postgres::{NoTls};
use dotenv::dotenv;
use std::env;
use anyhow::{Result, Context}; 

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL harus di set di .env");

    println!("Mencoba terhubung ke database...");

    let (client, connection) = tokio_postgres::connect(&database_url, NoTls)
        .await
        .context("Gagal terhubung ke database PostgreSQL")?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Koneksi error: {}", e);
        }
    });

    println!("Berhasil terhubung ke Supabase!");

    let row = client.query_one("SELECT 1", &[]).await
        .context("Gagal menjalankan query sederhana")?;

    let result: i32 = row.get(0);
    println!("Hasil query: {}", result);

    println!("Test koneksi database berhasil!");

    Ok(())
}
