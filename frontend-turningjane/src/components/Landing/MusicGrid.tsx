import { createSignal, createEffect, onMount, Component, For } from 'solid-js';

// Define types for our song data
interface Song {
  song_id: string;
  title: string;
  artist: string;
  genre_id?: string;
  genre_name?: string;
  release_year?: number;
  audio_file_path?: string;
  image_path?: string;
}

const MusicGrid: Component = () => {
  const [songs, setSongs] = createSignal<Song[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = createSignal<string | null>(null);
  const [audioPlayer, setAudioPlayer] = createSignal<HTMLAudioElement | null>(null);

  // Get backend URL from environment variables
  const getBackendUrl = () => {
    const nodeEnv = import.meta.env.VITE_NODE_ENV;
    if (nodeEnv === 'development') {
      return import.meta.env.VITE_DEV_BACKEND_URL;
    } else {
      return import.meta.env.VITE_PROD_BACKEND_URL;
    }
  };

  // Function to fetch songs from your Go backend
  const fetchSongs = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/songs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setSongs(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (songId: string, audioPath: string) => {
    if (audioPlayer()) {
      audioPlayer()?.pause();
    }

    if (currentlyPlaying() === songId) {
      setCurrentlyPlaying(null);
      return;
    }

    const audio = new Audio(audioPath);
    audio.addEventListener('ended', () => {
      setCurrentlyPlaying(null);
    });
    audio.play();
    setAudioPlayer(audio);
    setCurrentlyPlaying(songId);
  };

  // Function to determine grid classes based on number of songs
  const getGridClasses = () => {
    const songCount = songs().length;
    if (songCount === 1) {
      return "flex justify-center";
    } else if (songCount === 2) {
      return "grid grid-cols-2 justify-center gap-6 max-w-2xl mx-auto";
    } else if (songCount === 3) {
      return "grid grid-cols-3 justify-center gap-6 max-w-4xl mx-auto";
    } else {
      return "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
    }
  };

  // Function to determine individual card classes based on number of songs
  const getCardClasses = () => {
    const songCount = songs().length;
    if (songCount === 1) {
      return "bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 w-80";
    } else {
      return "bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105";
    }
  };

  onMount(() => {
    fetchSongs();
  });

  return (
    <div class="flex justify-center w-full bg-black">
      <div class="w-full max-w-7xl px-4 py-8">
        <h1 class="text-3xl font-bebasneue font-bold mb-6 text-center text-white">Music Collection</h1>      
        {loading() && (
          <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error() && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error()}
          </div>
        )}
        
        <div class={getGridClasses()}>
          <For each={songs()}>
            {(song) => (
              <div class={getCardClasses()}>
                <div class="relative pb-[100%]">
                  {song.image_path ? (
                    <img 
                      src={song.image_path} 
                      alt={`${song.title} cover`} 
                      class="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div class="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
                      </svg>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => song.audio_file_path && playAudio(song.song_id, song.audio_file_path)}
                    class="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg"
                    classList={{ 'bg-red-600 hover:bg-red-700': currentlyPlaying() === song.song_id }}
                    disabled={!song.audio_file_path}
                  >
                    {currentlyPlaying() === song.song_id ? (
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    ) : (
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    )}
                  </button>
                </div>
                
                <div class="p-4">
                  <h3 class="font-semibold text-lg truncate">{song.title}</h3>
                  <p class="text-gray-600 truncate">{song.artist}</p>
                  <div class="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>{song.genre_name || 'Unknown genre'}</span>
                    <span>{song.release_year || 'Unknown year'}</span>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
        
        {!loading() && songs().length === 0 && !error() && (
          <div class="text-center py-10">
            <p class="text-gray-500">No songs found in your collection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicGrid;