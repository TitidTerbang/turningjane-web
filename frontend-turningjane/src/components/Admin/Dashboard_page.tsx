import { Component, createSignal, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import GenreAdmin from './GenreAdmin_page.tsx';
import AdminList from './AdminList_page.tsx';
import SongAdmin from './SongAdmin_page.tsx';

interface User {
  id: string;
  email: string;
}

const Dashboard: Component = () => {
  const [loading, setLoading] = createSignal(true);
  const [activePage, setActivePage] = createSignal('songs');
  const [error, setError] = createSignal('');
  const [user, setUser] = createSignal<User | null>(null);
  const navigate = useNavigate();

  // Get the backend URL from environment variables
  const getBackendUrl = () => {
    const nodeEnv = import.meta.env.VITE_NODE_ENV;
    return nodeEnv === 'development' 
      ? import.meta.env.VITE_DEV_BACKEND_URL 
      : import.meta.env.VITE_PROD_BACKEND_URL;
  };

  // Check if auth-session cookie exists
  const checkAuthCookie = (): boolean => {
    console.log('Dashboard - All cookies:', document.cookie);
    const cookies = document.cookie.split(';');
    const hasAuthCookie = cookies.some(cookie => cookie.trim().startsWith('auth-session='));
    console.log('Dashboard - Has auth-session cookie:', hasAuthCookie);
    return hasAuthCookie;
  };

  // Get current admin info from backend
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      console.log('Dashboard - Fetching current admin...');
      const response = await fetch(`${getBackendUrl()}/api/admin/profile`, {
        credentials: 'include',
      });

      console.log('Dashboard - Admin profile response status:', response.status);

      if (!response.ok) {
        console.log('Dashboard - Admin profile request failed');
        return null;
      }

      const data = await response.json();
      console.log('Dashboard - Admin profile data:', data);
      return data.admin;
    } catch (err) {
      console.error('Dashboard - Get current admin error:', err);
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/logout`, {
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

    // Get current admin info
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('Dashboard - No current admin found, redirecting to login');
      navigate('/admin/login');
      setLoading(false);
      return;
    }

    console.log('Dashboard - Admin authenticated successfully:', currentUser);
    setUser(currentUser);
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
                onClick={() => setActivePage('admins')}
                class={`px-4 py-2 text-sm font-medium ${activePage() === 'admins' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Admins
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
              <SongAdmin />
            </Show>

            <Show when={activePage() === 'genres'}>
              <GenreAdmin />
            </Show>

            <Show when={activePage() === 'admins'}>
              <AdminList />
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