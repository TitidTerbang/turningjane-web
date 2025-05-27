import { Component, createSignal, onMount, Show } from 'solid-js';
import Swal from 'sweetalert2';

interface Admin {
  id: string;
  email: string;
  created_at?: string;
}

interface CreateAdminFormData {
  email: string;
  password: string;
}

const AdminList: Component = () => {
  const [admins, setAdmins] = createSignal<Admin[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [showModal, setShowModal] = createSignal(false);
  const [creating, setCreating] = createSignal(false);
  const [deleting, setDeleting] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal<CreateAdminFormData>({
    email: '',
    password: ''
  });

  // Get the backend URL from environment variables
  const getBackendUrl = () => {
    const nodeEnv = import.meta.env.VITE_NODE_ENV;
    return nodeEnv === 'development' 
      ? import.meta.env.VITE_DEV_BACKEND_URL 
      : import.meta.env.VITE_PROD_BACKEND_URL;
  };

  // Fetch all admin users
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getBackendUrl()}/api/admin/`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  };

  // Handle create new admin
  const handleCreateAdmin = async (e: Event) => {
    e.preventDefault();
    
    const form = formData();
    
    // Validation
    if (!form.email || !form.password) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields.',
      });
      return;
    }

    if (form.password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${getBackendUrl()}/api/admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create admin');
      }

      // Success notification
      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Admin has been created successfully.',
        timer: 2000,
        showConfirmButton: false,
      });

      // Reset form and close modal
      setFormData({
        email: '',
        password: ''
      });
      setShowModal(false);
      
      // Refresh admin list
      await fetchAdmins();

    } catch (err) {
      console.error('Error creating admin:', err);
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: err instanceof Error ? err.message : 'Failed to create admin. Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle delete admin
  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Admin',
        text: `Are you sure you want to delete admin "${adminEmail}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
      });

      if (result.isConfirmed) {
        setDeleting(adminId);

        const response = await fetch(`${getBackendUrl()}/api/admin/${adminId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete admin (HTTP ${response.status})`);
        }

        // Success notification
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Admin has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresh admin list
        await fetchAdmins();
      }
    } catch (err) {
      console.error('Error deleting admin:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err instanceof Error ? err.message : 'Failed to delete admin. Please try again.',
      });
    } finally {
      setDeleting(null);
    }
  };

  onMount(() => {
    fetchAdmins();
  });

  return (
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-medium leading-6 text-gray-900">Admin Users</h3>
        <button
          onClick={() => setShowModal(true)}
          class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Admin
        </button>
      </div>

      <Show when={error()}>
        <div class="bg-red-50 border-l-4 border-red-500 p-4 m-4">
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

      <Show when={loading()}>
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Show>

      <Show when={!loading()}>
        <ul class="divide-y divide-gray-200">
          {admins().length > 0 ? (
            admins().map((admin) => (
              <li class="px-6 py-4 flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span class="text-white font-medium text-sm">
                        {admin.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{admin.email}</div>
                    <div class="text-sm text-gray-500">ID: {admin.id}</div>
                  </div>
                </div>
                <div class="flex items-center">
                  <button
                    onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                    disabled={deleting() === admin.id}
                    class="inline-flex items-center text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Show when={deleting() === admin.id}>
                      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </Show>
                    {deleting() === admin.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li class="px-6 py-4 text-center text-gray-500">No admin users found</li>
          )}
        </ul>
      </Show>

      {/* Create Admin Modal */}
      <Show when={showModal()}>
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
            
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreateAdmin}>
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Create New Admin
                      </h3>
                      
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData().email}
                            onInput={(e) => setFormData(prev => ({ ...prev, email: e.currentTarget.value }))}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                            placeholder="Enter admin email"
                          />
                        </div>

                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={formData().password}
                            onInput={(e) => setFormData(prev => ({ ...prev, password: e.currentTarget.value }))}
                            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                            placeholder="Enter admin password (min 6 characters)"
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={creating()}
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Show when={creating()}>
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </Show>
                    {creating() ? 'Creating...' : 'Create Admin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({ email: '', password: '' });
                    }}
                    disabled={creating()}
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
    </div>
  );
};

export default AdminList;