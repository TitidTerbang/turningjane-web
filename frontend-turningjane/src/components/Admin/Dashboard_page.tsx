import { Component, createSignal, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';

interface User {
  id: string;
  email: string;
}

interface SongData {
  song_id: string;
  title: string;
  artist: string;
  genre_id: string;
  genre_name: string;
  release_year: number;
  audio_file_path: string;
  image_path: string;
  created_at: string;
}

const Dashboard: Component = () => {
  const [loading, setLoading] = createSignal(true);
  const [songs, setSongs] = createSignal<SongData[]>([]);
  const [activePage, setActivePage] = createSignal('songs');
  const [error, setError] = createSignal('');
  const [user, setUser] = createSignal<User | null>(null);
  const navigate = useNavigate();

  // Check if auth-session cookie exists
  const checkAuthCookie = (): boolean => {
    console.log('Dashboard - All cookies:', document.cookie);
    const cookies = document.cookie.split(';');
    const hasAuthCookie = cookies.some(cookie => cookie.trim().startsWith('auth-session='));
    console.log('Dashboard - Has auth-session cookie:', hasAuthCookie);
    return hasAuthCookie;
  };

  // Get current user info from backend
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      console.log('Dashboard - Fetching current user...');
      const response = await fetch('http://127.0.0.1:3000/api/profile', {
        credentials: 'include',
      });

      console.log('Dashboard - User profile response status:', response.status);

      if (!response.ok) {
        console.log('Dashboard - User profile request failed');
        return null;
      }

      const data = await response.json();
      console.log('Dashboard - User profile data:', data);
      return data.user;
    } catch (err) {
      console.error('Dashboard - Get current user error:', err);
      return null;
    }
  };

  const fetchSongs = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/songs', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }

      const data = await response.json();
      console.log('Fetched songs:', data); // Debug log
      setSongs(data || []); // The API returns an array directly, not wrapped in { songs: [] }
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Clear the auth-session cookie
        document.cookie = 'auth-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/admin/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      setError('Failed to logout');
    }
  };

  onMount(async () => {
    console.log('Dashboard - onMount started');

    // Get current user info
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('Dashboard - No current user found, redirecting to login');
      navigate('/admin/login');
      setLoading(false);
      return;
    }

    console.log('Dashboard - User authenticated successfully:', currentUser);
    setUser(currentUser);
    await fetchSongs();
    setLoading(false);
  });

  return (
    <div class="min-h-screen bg-gray-100">
      <Show when={!loading()}>
        <nav class="bg-white shadow">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="flex h-16 justify-between">
              <div class="flex">
                <div class="flex flex-shrink-0 items-center">
                  <span class="text-xl font-bold text-blue-600">Admin Dashboard</span>
                </div>
              </div>
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <span class="mr-4 text-gray-700">{user()?.email}</span>
                  <button
                    onClick={handleLogout}
                    class="relative inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div class="py-6">
          <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="lg:flex lg:items-center lg:justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  Dashboard
                </h2>
              </div>
            </div>
          </div>

          <div class="mx-auto max-w-7xl mt-4 px-4 sm:px-6 lg:px-8">
            <div class="flex mb-4 border-b">
              <button
                onClick={() => setActivePage('songs')}
                class={`mr-4 px-4 py-2 text-sm font-medium ${activePage() === 'songs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Songs
              </button>
              <button
                onClick={() => setActivePage('genres')}
                class={`mr-4 px-4 py-2 text-sm font-medium ${activePage() === 'genres' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Genres
              </button>
              <button
                onClick={() => setActivePage('users')}
                class={`px-4 py-2 text-sm font-medium ${activePage() === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Users
              </button>
            </div>

            <Show when={error()}>
              <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-700">{error()}</p>
                  </div>
                </div>
              </div>
            </Show>

            <Show when={activePage() === 'songs'}>
              <div class="bg-white shadow overflow-hidden sm:rounded-md">
                <div class="flex justify-between items-center p-4 border-b">
                  <h3 class="text-lg font-medium leading-6 text-gray-900">Songs List</h3>
                  <button
                    class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add New Song
                  </button>
                </div>
                <ul class="divide-y divide-gray-200">
                  {songs().length > 0 ? (
                    songs().map((song) => (
                      <li class="px-6 py-4 flex items-center justify-between">
                        <div class="flex items-center">
                          <img 
                            src={song.image_path} 
                            alt={song.title}
                            class="w-12 h-12 rounded object-cover mr-4"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/48x48?text=No+Image';
                            }}
                          />
                          <div>
                            <p class="text-sm font-medium text-gray-900">{song.title}</p>
                            <div class="flex mt-1">
                              <p class="text-sm text-gray-500 mr-4">Artist: {song.artist}</p>
                              <p class="text-sm text-gray-500 mr-4">Genre: {song.genre_name}</p>
                              <p class="text-sm text-gray-500">Year: {song.release_year}</p>
                            </div>
                          </div>
                        </div>
                        <div class="flex">
                          <button class="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                          <button class="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li class="px-6 py-4 text-center text-gray-500">No songs available</li>
                  )}
                </ul>
              </div>
            </Show>

            <Show when={activePage() === 'genres'}>
              <div class="bg-white shadow overflow-hidden sm:rounded-md">
                <div class="flex justify-between items-center p-4 border-b">
                  <h3 class="text-lg font-medium leading-6 text-gray-900">Genres List</h3>
                  <button
                    class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add New Genre
                  </button>
                </div>
                <div class="p-6 text-center text-gray-500">
                  Genre management feature coming soon
                </div>
              </div>
            </Show>

            <Show when={activePage() === 'users'}>
              <div class="bg-white shadow overflow-hidden sm:rounded-md">
                <div class="flex justify-between items-center p-4 border-b">
                  <h3 class="text-lg font-medium leading-6 text-gray-900">Users List</h3>
                </div>
                <div class="p-6 text-center text-gray-500">
                  User management feature coming soon
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={loading()}>
        <div class="min-h-screen flex items-center justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Show>
    </div>
  );
};

export default Dashboard;