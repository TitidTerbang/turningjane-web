import type { Component } from "solid-js";
import { FontAwesomeIcon } from "solid-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSpotify } from "@fortawesome/free-brands-svg-icons";

library.add(faSpotify);

const Navbar: Component = () => {
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
                        <div class="flex items-center">
                            <div class="hidden md:ml-6 md:flex md:space-x-8 border-2 border-transparent rounded-lg px-4 py-1 animate-pulse-border">
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
                        <div class="flex items-center">
                            <span class="inline-flex rounded-md shadow-sm">
                                <a href="https://open.spotify.com/artist/4FJqwYAGPEHUvQfWgYf3k5?si=zfDvWTqCTWikxh1N8SWR6w" class="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-black bg-green-500 hover:bg-green-400 focus:outline-none focus:border-green-600 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150" target="_blank">
                                    <div class="h-4 w-4 flex items-center justify-center mr-2">
                                        <FontAwesomeIcon icon={faSpotify} />
                                    </div>
                                    Spotify
                                </a>
                            </span>
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    )
}
export default Navbar;