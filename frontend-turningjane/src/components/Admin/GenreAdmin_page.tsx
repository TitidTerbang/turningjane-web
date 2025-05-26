import { Component, createSignal, onMount, Show } from 'solid-js';
import Swal from 'sweetalert2';

interface Genre {
  genre_id: string;
  genre_name: string;
}

interface GenreFormData {
  genre_name: string;
}

const GenreAdmin: Component = () => {
  const [genres, setGenres] = createSignal<Genre[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showModal, setShowModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [adding, setAdding] = createSignal(false);
  const [updating, setUpdating] = createSignal(false);
  const [deleting, setDeleting] = createSignal<string | null>(null);
  const [editingGenre, setEditingGenre] = createSignal<Genre | null>(null);
  const [formData, setFormData] = createSignal<GenreFormData>({
    genre_name: ''
  });

  // Fetch genres
  const fetchGenres = async () => {
    try {
      setLoading(true);
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
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load genres',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle add genre
  const handleAddGenre = async (e: Event) => {
    e.preventDefault();
    
    const form = formData();
    
    if (!form.genre_name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a genre name.',
      });
      return;
    }

    setAdding(true);

    try {
      const response = await fetch('http://127.0.0.1:3000/api/content/genres', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ genre_name: form.genre_name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add genre');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Genre has been added successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      setFormData({ genre_name: '' });
      setShowModal(false);
      await fetchGenres();

    } catch (err) {
      console.error('Error adding genre:', err);
      Swal.fire({
        icon: 'error',
        title: 'Add Failed',
        text: err instanceof Error ? err.message : 'Failed to add genre. Please try again.',
      });
    } finally {
      setAdding(false);
    }
  };

  // Handle edit genre
  const handleEditGenre = (genre: Genre) => {
    setEditingGenre({ ...genre });
    setShowEditModal(true);
  };

  // Handle update genre
  const handleUpdateGenre = async (e: Event) => {
    e.preventDefault();
    
    const genre = editingGenre();
    if (!genre) return;

    if (!genre.genre_name.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please enter a genre name.',
      });
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`http://127.0.0.1:3000/api/content/genres/${genre.genre_id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ genre_name: genre.genre_name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update genre');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Genre has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      setShowEditModal(false);
      setEditingGenre(null);
      await fetchGenres();

    } catch (err) {
      console.error('Error updating genre:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err instanceof Error ? err.message : 'Failed to update genre. Please try again.',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete genre
  const handleDeleteGenre = async (genreId: string, genreName: string) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Genre',
        text: `Are you sure you want to delete "${genreName}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        setDeleting(genreId);

        const response = await fetch(`http://127.0.0.1:3000/api/content/genres/${genreId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to delete genre (HTTP ${response.status})`);
        }

        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Genre has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
        });

        await fetchGenres();
      }
    } catch (err) {
      console.error('Error deleting genre:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err instanceof Error ? err.message : 'Failed to delete genre. Please try again.',
      });
    } finally {
      setDeleting(null);
    }
  };

  onMount(() => {
    fetchGenres();
  });

  return (
    <div>
      <Show when={!loading()}>
        {/* Header */}
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="flex justify-between items-center p-4 border-b">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Genres List</h3>
            <button
              onClick={() => setShowModal(true)}
              class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add New Genre
            </button>
          </div>

          {/* Genres List */}
          <ul class="divide-y divide-gray-200">
            {genres().length > 0 ? (
              genres().map((genre) => (
                <li class="px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{genre.genre_name}</p>
                      <p class="text-sm text-gray-500">ID: {genre.genre_id}</p>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <button 
                      onClick={() => handleEditGenre(genre)}
                      class="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGenre(genre.genre_id, genre.genre_name)}
                      disabled={deleting() === genre.genre_id}
                      class="inline-flex items-center text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Show when={deleting() === genre.genre_id}>
                        <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </Show>
                      {deleting() === genre.genre_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li class="px-6 py-4 text-center text-gray-500">No genres available</li>
            )}
          </ul>
        </div>
      </Show>

      {/* Add Genre Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddGenre}>
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Add New Genre
                      </h3>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Genre Name *</label>
                        <input
                          type="text"
                          required
                          value={formData().genre_name}
                          onInput={(e) => setFormData(prev => ({ ...prev, genre_name: e.currentTarget.value }))}
                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          placeholder="Enter genre name"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={adding()}
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Show when={adding()}>
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </Show>
                    {adding() ? 'Adding...' : 'Add Genre'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ genre_name: '' });
                    }}
                    disabled={adding()}
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

      {/* Edit Genre Modal */}
      <Show when={showEditModal()}>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpdateGenre}>
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Edit Genre
                      </h3>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Genre Name *</label>
                        <input
                          type="text"
                          required
                          value={editingGenre()?.genre_name || ''}
                          onInput={(e) => setEditingGenre(prev => prev ? ({ ...prev, genre_name: e.currentTarget.value }) : null)}
                          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          placeholder="Enter genre name"
                        />
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
                    {updating() ? 'Updating...' : 'Update Genre'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingGenre(null);
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

      {/* Loading */}
      <Show when={loading()}>
        <div class="bg-white shadow overflow-hidden sm:rounded-md">
          <div class="p-6 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-2 text-gray-500">Loading genres...</p>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default GenreAdmin;