import { Component, createSignal, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import Swal from 'sweetalert2';
import GenreAdmin from './GenreAdmin_page.tsx';

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

interface Genre {
  genre_id: string;
  genre_name: string; // Changed from 'name' to 'genre_name'
}

interface SongFormData {
  title: string;
  artist: string;
  genre_id: string;
  release_year: number;
  audio_file: File | null;
  image_file: File | null;
  image_preview: string | null;
}

interface EditSongData {
  song_id: string;
  title: string;
  artist: string;
  genre_id: string;
  release_year: number;
  current_image_path?: string;
}

const Dashboard: Component = () => {
  const [loading, setLoading] = createSignal(true);
  const [songs, setSongs] = createSignal<SongData[]>([]);
  const [activePage, setActivePage] = createSignal('songs');
  const [error, setError] = createSignal('');
  const [user, setUser] = createSignal<User | null>(null);
  const [showModal, setShowModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false); 
  const [uploading, setUploading] = createSignal(false);
  const [updating, setUpdating] = createSignal(false); 
  const [deleting, setDeleting] = createSignal<string | null>(null);
  const [genres, setGenres] = createSignal<Genre[]>([]);
  const [editingSong, setEditingSong] = createSignal<EditSongData | null>(null); // Track editing song
  const [formData, setFormData] = createSignal<SongFormData>({
    title: '',
    artist: '',
    genre_id: '',
    release_year: new Date().getFullYear(),
    audio_file: null,
    image_file: null,
    image_preview: null
  });
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

  // Fetch genres for the form
  const fetchGenres = async () => {
    try {
      const response = await fetch('http://127.0.0.1:3000/genres', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch genres');
      }

      const data = await response.json();
      setGenres(data || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  // Convert image to WebP format
  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas dimensions (you can adjust these as needed)
        const maxWidth = 500;
        const maxHeight = 500;
        
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(webpFile);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          0.8 // Quality (0.0 to 1.0)
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle form submission
  const handleAddSong = async (e: Event) => {
    e.preventDefault();
    
    const form = formData();
    
    // Validation
    if (!form.title || !form.artist || !form.genre_id || !form.audio_file) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields and select an audio file.',
      });
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', form.title);
      formDataToSend.append('artist', form.artist);
      formDataToSend.append('genre_id', form.genre_id);
      formDataToSend.append('release_year', form.release_year.toString());
      formDataToSend.append('audio_file', form.audio_file);
      
      if (form.image_file) {
        formDataToSend.append('image_file', form.image_file);
      }

      // Log the form data being sent
      console.log('Sending form data:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(key, `File: ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(key, value);
        }
      }

      const response = await fetch('http://127.0.0.1:3000/api/songs/upload', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      console.log('Add song response status:', response.status);
      console.log('Add song response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        // Try to get the response text first
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        // Try to parse as JSON if it looks like JSON
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // If it's not JSON, use the text as error message
          throw new Error(responseText || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        throw new Error(errorData.message || 'Failed to add song');
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Response is not JSON, content-type:', contentType);
        const responseText = await response.text();
        console.log('Non-JSON response text:', responseText);
        
        // If the upload was successful but response isn't JSON, that's okay for file uploads
        if (response.status >= 200 && response.status < 300) {
          console.log('Upload successful despite non-JSON response');
        } else {
          throw new Error('Server returned unexpected response format');
        }
      } else {
        const result = await response.json();
        console.log('Add song success response:', result);
      }

      // Success notification
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Song has been uploaded successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      // Clean up preview URL
      if (form.image_preview) {
        URL.revokeObjectURL(form.image_preview);
      }

      // Reset form and close modal
      setFormData({
        title: '',
        artist: '',
        genre_id: '',
        release_year: new Date().getFullYear(),
        audio_file: null,
        image_file: null,
        image_preview: null
      });
      setShowModal(false);
      
      // Refresh songs list
      await fetchSongs();

    } catch (err) {
      console.error('Error adding song:', err);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err instanceof Error ? err.message : 'Failed to upload song. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteSong = async (songId: string, songTitle: string) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Song',
        text: `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        setDeleting(songId);

        const response = await fetch(`http://127.0.0.1:3000/api/songs/${songId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to delete song (HTTP ${response.status})`);
        }

        // Success notification
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Song has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh songs list
        await fetchSongs();
      }
    } catch (err) {
      console.error('Error deleting song:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err instanceof Error ? err.message : 'Failed to delete song. Please try again.',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Handle edit song
  const handleEditSong = (song: SongData) => {
    setEditingSong({
      song_id: song.song_id,
      title: song.title,
      artist: song.artist,
      genre_id: song.genre_id,
      release_year: song.release_year,
      current_image_path: song.image_path
    });
    setShowEditModal(true);
  };

  // Handle update song
  const handleUpdateSong = async (e: Event) => {
    e.preventDefault();
    
    const editData = editingSong();
    if (!editData) return;

    // Validation
    if (!editData.title || !editData.artist || !editData.genre_id) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields.',
      });
      return;
    }

    setUpdating(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', editData.title);
      formDataToSend.append('artist', editData.artist);
      formDataToSend.append('genre_id', editData.genre_id);
      formDataToSend.append('release_year', editData.release_year.toString());
      
      // Only append image file if a new one was selected
      const currentFormData = formData();
      if (currentFormData.image_file) {
        formDataToSend.append('image_file', currentFormData.image_file);
      }

      // Log the form data being sent
      console.log('Updating song with data:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(key, `File: ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(key, value);
        }
      }

      const response = await fetch(`http://127.0.0.1:3000/api/songs/${editData.song_id}/upload`, {
        method: 'PUT',
        credentials: 'include',
        body: formDataToSend,
      });

      console.log('Update song response status:', response.status);
      console.log('Update song response headers:', response.headers.get('content-type'));

      if (!response.ok) {
        // Try to get the response text first
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        // Try to parse as JSON if it looks like JSON
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          // If it's not JSON, use the text as error message
          throw new Error(responseText || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        throw new Error(errorData.message || 'Failed to update song');
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Response is not JSON, content-type:', contentType);
        const responseText = await response.text();
        console.log('Non-JSON response text:', responseText);
        
        // If the update was successful but response isn't JSON, that's okay for file uploads
        if (response.status >= 200 && response.status < 300) {
          console.log('Update successful despite non-JSON response');
        } else {
          throw new Error('Server returned unexpected response format');
        }
      } else {
        const result = await response.json();
        console.log('Update song success response:', result);
      }

      // Success notification
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Song has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      // Clean up and close modal
      setShowEditModal(false);
      setEditingSong(null);
      
      // Clean up preview URL if exists
      if (currentFormData.image_preview) {
        URL.revokeObjectURL(currentFormData.image_preview);
      }
      
      // Reset form data
      setFormData({
        title: '',
        artist: '',
        genre_id: '',
        release_year: new Date().getFullYear(),
        audio_file: null,
        image_file: null,
        image_preview: null
      });
      
      // Refresh songs list
      await fetchSongs();

    } catch (err) {
      console.error('Error updating song:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err instanceof Error ? err.message : 'Failed to update song. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle file input changes
  const handleFileChange = async (field: 'audio_file' | 'image_file', file: File | null) => {
    if (field === 'image_file' && file) {
      try {
        // Validate image file
        if (!file.type.startsWith('image/')) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid File',
            text: 'Please select a valid image file.',
          });
          return;
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        
        // Convert to WebP
        const webpFile = await convertToWebP(file);
        
        setFormData(prev => ({ 
          ...prev, 
          [field]: webpFile,
          image_preview: previewUrl
        }));
      } catch (error) {
        console.error('Error processing image:', error);
        Swal.fire({
          icon: 'error',
          title: 'Image Processing Error',
          text: 'Failed to process the image. Please try another file.',
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: file }));
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
    await Promise.all([fetchSongs(), fetchGenres()]);
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
                    onClick={() => setShowModal(true)}
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
                        <div class="flex items-center">
                          <button 
                            onClick={() => handleEditSong(song)}
                            class="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSong(song.song_id, song.title)}
                            disabled={deleting() === song.song_id}
                            class="inline-flex items-center text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Show when={deleting() === song.song_id}>
                              <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </Show>
                            {deleting() === song.song_id ? 'Deleting...' : 'Delete'}
                          </button>
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
              <GenreAdmin />
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

      {/* Add Song Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddSong}>
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Add New Song
                      </h3>
                      
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Title *</label>
                          <input
                            type="text"
                            required
                            value={formData().title}
                            onInput={(e) => setFormData(prev => ({ ...prev, title: e.currentTarget.value }))}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Artist *</label>
                          <input
                            type="text"
                            required
                            value={formData().artist}
                            onInput={(e) => setFormData(prev => ({ ...prev, artist: e.currentTarget.value }))}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Genre *</label>
                          <select
                            required
                            value={formData().genre_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, genre_id: e.currentTarget.value }))}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          >
                            <option value="">Select a genre</option>
                            {genres().map((genre) => (
                              <option value={genre.genre_id}>{genre.genre_name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Release Year</label>
                          <input
                            type="number"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={formData().release_year}
                            onInput={(e) => setFormData(prev => ({ ...prev, release_year: parseInt(e.currentTarget.value) }))}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Audio File *</label>
                          <input
                            type="file"
                            accept="audio/*"
                            required
                            onChange={(e) => handleFileChange('audio_file', e.currentTarget.files?.[0] || null)}
                            class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                          
                          {/* Image Preview */}
                          <Show when={formData().image_preview}>
                            <div class="mb-3">
                              <img 
                                src={formData().image_preview!} 
                                alt="Cover preview" 
                                class="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (formData().image_preview) {
                                    URL.revokeObjectURL(formData().image_preview!);
                                  }
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    image_file: null, 
                                    image_preview: null 
                                  }));
                                }}
                                class="mt-2 text-sm text-red-600 hover:text-red-800"
                              >
                                Remove Image
                              </button>
                            </div>
                          </Show>
                          
                          {/* File Input */}
                          <div class="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange('image_file', e.currentTarget.files?.[0] || null)}
                              class="hidden"
                              id="image-upload"
                            />
                            <label
                              for="image-upload"
                              class="cursor-pointer inline-flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                              <div class="text-center">
                                <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-600">
                                  Click to upload cover image
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  PNG, JPG, JPEG up to 10MB (will be converted to WebP)
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={uploading()}
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Show when={uploading()}>
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </Show>
                    {uploading() ? 'Uploading...' : 'Add Song'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={uploading()}
                    class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Show>

            {/* Edit Song Modal */}
            <Show when={showEditModal()}>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateSong}>
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Edit Song
                      </h3>
                      
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700">Title *</label>
                          <input
                            type="text"
                            required
                            value={editingSong()?.title || ''}
                            onInput={(e) => setEditingSong(prev => prev ? ({ ...prev, title: e.currentTarget.value }) : null)}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Artist *</label>
                          <input
                            type="text"
                            required
                            value={editingSong()?.artist || ''}
                            onInput={(e) => setEditingSong(prev => prev ? ({ ...prev, artist: e.currentTarget.value }) : null)}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Genre *</label>
                          <select
                            required
                            value={editingSong()?.genre_id || ''}
                            onChange={(e) => setEditingSong(prev => prev ? ({ ...prev, genre_id: e.currentTarget.value }) : null)}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          >
                            <option value="">Select a genre</option>
                            {genres().map((genre) => (
                              <option value={genre.genre_id}>{genre.genre_name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700">Release Year</label>
                          <input
                            type="number"
                            min="1900"
                            max={new Date().getFullYear()}
                            value={editingSong()?.release_year || new Date().getFullYear()}
                            onInput={(e) => setEditingSong(prev => prev ? ({ ...prev, release_year: parseInt(e.currentTarget.value) }) : null)}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                          
                          {/* Current Image Preview */}
                          <Show when={editingSong()?.current_image_path && !formData().image_preview}>
                            <div class="mb-3">
                              <img 
                                src={editingSong()!.current_image_path!} 
                                alt="Current cover" 
                                class="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <p class="text-xs text-gray-500 mt-1">Current image</p>
                            </div>
                          </Show>

                          {/* New Image Preview */}
                          <Show when={formData().image_preview}>
                            <div class="mb-3">
                              <img 
                                src={formData().image_preview!} 
                                alt="New cover preview" 
                                class="w-32 h-32 object-cover rounded-lg border-2 border-blue-200"
                              />
                              <p class="text-xs text-blue-600 mt-1">New image (will replace current)</p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (formData().image_preview) {
                                    URL.revokeObjectURL(formData().image_preview!);
                                  }
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    image_file: null, 
                                    image_preview: null 
                                  }));
                                }}
                                class="mt-2 text-sm text-red-600 hover:text-red-800"
                              >
                                Remove New Image
                              </button>
                            </div>
                          </Show>
                          
                          {/* File Input */}
                          <div class="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange('image_file', e.currentTarget.files?.[0] || null)}
                              class="hidden"
                              id="edit-image-upload"
                            />
                            <label
                              for="edit-image-upload"
                              class="cursor-pointer inline-flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                            >
                              <div class="text-center">
                                <svg class="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-sm text-gray-600">
                                  Click to upload new cover image
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  PNG, JPG, JPEG up to 10MB (will be converted to WebP)
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={updating()}
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Show when={updating()}>
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </Show>
                    {updating() ? 'Updating...' : 'Update Song'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSong(null);
                      // Clean up preview URL if exists
                      if (formData().image_preview) {
                        URL.revokeObjectURL(formData().image_preview!);
                      }
                      setFormData(prev => ({ 
                        ...prev, 
                        image_file: null, 
                        image_preview: null 
                      }));
                    }}
                    disabled={updating()}
                    class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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