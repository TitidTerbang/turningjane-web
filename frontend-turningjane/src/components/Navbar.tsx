import type { Component } from "solid-js";
import { createSignal, Show, onMount } from "solid-js";
import { FontAwesomeIcon } from "solid-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faBars, faXmark, faUser, faTimes, faHandPaper, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

library.add(faSpotify, faBars, faXmark, faUser, faTimes, faHandPaper, faSignOutAlt);

const Navbar: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    const [isLogin, setIsLogin] = createSignal(true); // true for login, false for register
    const [isLoggedIn, setIsLoggedIn] = createSignal(false);
    const [username, setUsername] = createSignal('');
    const [userDropdownOpen, setUserDropdownOpen] = createSignal(false);
    const [formData, setFormData] = createSignal({
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
    });
    
    // Check if user is already logged in on component mount
    onMount(async () => {
        try {
            const backendUrl = import.meta.env.VITE_NODE_ENV === 'production' 
                ? import.meta.env.VITE_PROD_BACKEND_URL 
                : import.meta.env.VITE_DEV_BACKEND_URL;

            const response = await fetch(`${backendUrl}/api/auth`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const result = await response.json();
                setIsLoggedIn(true);
                // This line is the problem - result doesn't contain username
                setUsername(result.username || result.email || 'User');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    });
    
    const toggleMenu = () => {
        setIsOpen(!isOpen());
    };

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen());
        // Reset form when closing modal
        if (isModalOpen()) {
            setFormData({
                email: '',
                username: '',
                password: '',
                confirmPassword: ''
            });
        }
    };

    const toggleUserDropdown = () => {
        setUserDropdownOpen(!userDropdownOpen());
    };

    const switchMode = () => {
        setIsLogin(!isLogin());
        setFormData({
            email: '',
            username: '',
            password: '',
            confirmPassword: ''
        });
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const data = formData();
        
        if (!isLogin() && data.password !== data.confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const endpoint = isLogin() ? '/login' : '/register';
            const payload = isLogin() 
                ? { email: data.email, password: data.password }
                : { email: data.email, username: data.username, password: data.password };

            // Use environment variable for backend URL
            const backendUrl = import.meta.env.VITE_NODE_ENV === 'production' 
                ? import.meta.env.VITE_PROD_BACKEND_URL 
                : import.meta.env.VITE_DEV_BACKEND_URL;

            const response = await fetch(`${backendUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (response.ok) {
                alert(isLogin() ? 'Login successful!' : 'Registration successful!');
                toggleModal();
                
                // Update login state
                setIsLoggedIn(true);
                setUsername(result.username || data.username || data.email || 'User');
                
                // Don't reload page, just update state
            } else {
                alert(result.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error occurred');
        }
    };

    const handleLogout = async () => {
        try {
            const backendUrl = import.meta.env.VITE_NODE_ENV === 'production' 
                ? import.meta.env.VITE_PROD_BACKEND_URL 
                : import.meta.env.VITE_DEV_BACKEND_URL;

            const response = await fetch(`${backendUrl}/api/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                setIsLoggedIn(false);
                setUsername('');
                setUserDropdownOpen(false);
                alert('Logged out successfully!');
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('Network error occurred');
        }
    };

    const handleAdminLogin = () => {
        // Use environment variable for admin login URL
        const backendUrl = import.meta.env.VITE_NODE_ENV === 'production' 
            ? import.meta.env.VITE_PROD_BACKEND_URL 
            : import.meta.env.VITE_DEV_BACKEND_URL;
        
        window.location.href = 'localhost:3000/admin/login';
    };

    return (
        <div>
            {/* Navigation */}
            <nav class="bg-black shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 flex items-center">
                                <img src="/src/assets/logo_turningjane.jpeg" alt="TurningJane" class="h-[64px] w-auto" />
                            </div>
                        </div>
                        
                        {/* Desktop Menu */}
                        <div class="hidden md:flex items-center">
                            <div class="ml-6 flex space-x-8 border-2 border-transparent rounded-lg px-4 py-1 animate-pulse-border">
                                <a href="/" class="border-indigo-400 text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-110 hover:text-indigo-300">
                                    Home
                                </a>
                                <a href="#" class="border-transparent text-gray-300 hover:border-gray-400 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-110 hover:text-indigo-300">
                                    Music
                                </a>
                                <a href="#" class="border-transparent text-gray-300 hover:border-gray-400 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-110 hover:text-indigo-300">
                                    Gallery
                                </a>
                            </div>
                        </div>
                        
                        {/* Spotify Button and Login/User Button */}
                        <div class="flex items-center space-x-3">
                            <span class="inline-flex rounded-md shadow-sm">
                                <a href="https://open.spotify.com/artist/4FJqwYAGPEHUvQfWgYf3k5?si=zfDvWTqCTWikxh1N8SWR6w" class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-black bg-green-500 hover:bg-green-400 focus:outline-none focus:border-green-600 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150" target="_blank">
                                    <div class="h-4 w-4 flex items-center justify-center mr-2">
                                        <FontAwesomeIcon icon={faSpotify} />
                                    </div>
                                    <span class="hidden sm:inline">Spotify</span>
                                </a>
                            </span>

                            {/* Login/User Button */}
                            <div class="relative">
                                <Show when={!isLoggedIn()} fallback={
                                    <div>
                                        <button 
                                            onClick={toggleUserDropdown}
                                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                                        >
                                            <div class="h-4 w-4 flex items-center justify-center mr-2">
                                                <FontAwesomeIcon icon={faHandPaper} />
                                            </div>
                                            <span class="hidden sm:inline">Hello, {username()}</span>
                                            <span class="sm:hidden">Hello!</span>
                                        </button>
                                        
                                        {/* User Dropdown */}
                                        <Show when={userDropdownOpen()}>
                                            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                                                <button
                                                    onClick={handleLogout}
                                                    class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    <FontAwesomeIcon icon={faSignOutAlt} class="mr-2" />
                                                    Logout
                                                </button>
                                            </div>
                                        </Show>
                                    </div>
                                }>
                                    <button 
                                        onClick={toggleModal}
                                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150"
                                    >
                                        <div class="h-4 w-4 flex items-center justify-center mr-2">
                                            <FontAwesomeIcon icon={faUser} />
                                        </div>
                                        <span class="hidden sm:inline">Login</span>
                                    </button>
                                </Show>
                            </div>
                            
                            {/* Hamburger Menu Button (Mobile Only) */}
                            <div class="flex items-center md:hidden">
                                <button 
                                    onClick={toggleMenu}
                                    class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                    aria-expanded="false"
                                >
                                    <span class="sr-only">Open main menu</span>
                                    <Show when={!isOpen()} fallback={
                                        <FontAwesomeIcon icon={faXmark} class="block h-6 w-6" />
                                    }>
                                        <FontAwesomeIcon icon={faBars} class="block h-6 w-6" />
                                    </Show>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <Show when={isOpen()}>
                    <div class="md:hidden">
                        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900">
                            <a href="/" class="block px-3 py-2 rounded-md text-base font-medium text-white bg-gray-800">
                                Home
                            </a>
                            <a href="#" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                                Music
                            </a>
                            <a href="#" class="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700">
                                Gallery
                            </a>
                        </div>
                    </div>
                </Show>
            </nav>

            {/* Click outside to close dropdown */}
            <Show when={userDropdownOpen()}>
                <div 
                    class="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)}
                ></div>
            </Show>

            {/* Login/Register Modal */}
            <Show when={isModalOpen()}>
                <div class="fixed inset-0 z-50 overflow-y-auto">
                    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div class="absolute inset-0 bg-gray-500 opacity-75" onClick={toggleModal}></div>
                        </div>

                        {/* Modal panel */}
                        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                                        {isLogin() ? 'Login' : 'Register'}
                                    </h3>
                                    <button onClick={toggleModal} class="text-gray-400 hover:text-gray-600">
                                        <FontAwesomeIcon icon={faTimes} class="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div class="space-y-4">
                                        {/* Email field */}
                                        <div>
                                            <label for="email" class="block text-sm font-medium text-gray-700">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                required
                                                value={formData().email}
                                                onInput={(e) => handleInputChange('email', e.currentTarget.value)}
                                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter your email"
                                            />
                                        </div>

                                        {/* Username field (only for register) */}
                                        <Show when={!isLogin()}>
                                            <div>
                                                <label for="username" class="block text-sm font-medium text-gray-700">
                                                    Username
                                                </label>
                                                <input
                                                    type="text"
                                                    id="username"
                                                    required={!isLogin()}
                                                    value={formData().username}
                                                    onInput={(e) => handleInputChange('username', e.currentTarget.value)}
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Enter your username"
                                                />
                                            </div>
                                        </Show>

                                        {/* Password field */}
                                        <div>
                                            <label for="password" class="block text-sm font-medium text-gray-700">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                required
                                                value={formData().password}
                                                onInput={(e) => handleInputChange('password', e.currentTarget.value)}
                                                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter your password"
                                            />
                                        </div>

                                        {/* Confirm Password field (only for register) */}
                                        <Show when={!isLogin()}>
                                            <div>
                                                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                                                    Confirm Password
                                                </label>
                                                <input
                                                    type="password"
                                                    id="confirmPassword"
                                                    required={!isLogin()}
                                                    value={formData().confirmPassword}
                                                    onInput={(e) => handleInputChange('confirmPassword', e.currentTarget.value)}
                                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Confirm your password"
                                                />
                                            </div>
                                        </Show>
                                    </div>

                                    {/* Submit button */}
                                    <div class="mt-6">
                                        <button
                                            type="submit"
                                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            {isLogin() ? 'Login' : 'Register'}
                                        </button>
                                    </div>

                                    {/* Switch between login/register */}
                                    <div class="mt-4 text-center">
                                        <button
                                            type="button"
                                            onClick={switchMode}
                                            class="text-sm text-indigo-600 hover:text-indigo-500"
                                        >
                                            {isLogin() 
                                                ? "Don't have an account? Register here" 
                                                : "Already have an account? Login here"
                                            }
                                        </button>
                                    </div>

                                    {/* Admin login button */}
                                    <div class="mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleAdminLogin}
                                            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Login as Admin
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default Navbar;