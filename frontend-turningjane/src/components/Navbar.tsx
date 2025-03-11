import type { Component } from "solid-js";
import { createSignal, Show } from "solid-js";
import { FontAwesomeIcon } from "solid-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

library.add(faSpotify, faBars, faXmark);

const Navbar: Component = () => {
    const [isOpen, setIsOpen] = createSignal(false);
    
    const toggleMenu = () => {
        setIsOpen(!isOpen());
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
                        
                        {/* Spotify Button (visible on all screens) */}
                        <div class="flex items-center">
                            <span class="inline-flex rounded-md shadow-sm">
                                <a href="https://open.spotify.com/artist/4FJqwYAGPEHUvQfWgYf3k5?si=zfDvWTqCTWikxh1N8SWR6w" class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-black bg-green-500 hover:bg-green-400 focus:outline-none focus:border-green-600 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150" target="_blank">
                                    <div class="h-4 w-4 flex items-center justify-center mr-2">
                                        <FontAwesomeIcon icon={faSpotify} />
                                    </div>
                                    <span class="hidden sm:inline">Spotify</span>
                                </a>
                            </span>
                            
                            {/* Hamburger Menu Button (Mobile Only) */}
                            <div class="ml-4 flex items-center md:hidden">
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
        </div>
    );
};

export default Navbar;