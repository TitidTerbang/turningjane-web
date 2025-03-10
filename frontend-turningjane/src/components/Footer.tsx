import type { Component } from "solid-js";

const Footer: Component = () => {
    return (
        <div>
            {/* Footer */}
            <footer class="bg-black text-gray-300">
                <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div class="flex flex-col md:flex-row justify-between">
                        <div class="mb-8 md:mb-0">
                            <span class="text-2xl font-bold text-white tracking-wider">.TurningJane</span>
                            <p class="mt-2 text-gray-400 italic">East Java's Voice of Alternative Rock.</p>
                            <p class="mt-4 text-gray-400">
                                <i class="fas fa-map-marker-alt mr-2"></i>
                                Malang, East Java
                            </p>
                            <p class="mt-2 text-gray-400">
                                <i class="fas fa-envelope mr-2"></i>
                                yudistobat@gmail.com
                            </p>
                        </div>
                        <div class="grid grid-cols-2 gap-8 sm:grid-cols-2">
                            <div>
                                <h3 class="text-sm font-semibold text-gray-100 tracking-wider uppercase border-b border-gray-700 pb-1">Music</h3>
                                <ul class="mt-4 space-y-3">
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white hover:pl-1 transition-all duration-300">Singles</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 class="text-sm font-semibold text-gray-100 tracking-wider uppercase border-b border-gray-700 pb-1">Band</h3>
                                <ul class="mt-4 space-y-3">
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white hover:pl-1 transition-all duration-300">About</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white hover:pl-1 transition-all duration-300">Members</a></li>
                                    <li><a href="#" class="text-base text-gray-400 hover:text-white hover:pl-1 transition-all duration-300">History</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="mt-10 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
                        <div class="flex space-x-6 md:order-2">
                            <a href="#" class="text-gray-400 hover:text-red-500 text-xl transition-colors duration-300">
                                <span class="sr-only">Facebook</span>
                                <i class="fab fa-facebook"></i>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-red-500 text-xl transition-colors duration-300">
                                <span class="sr-only">Instagram</span>
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-red-500 text-xl transition-colors duration-300">
                                <span class="sr-only">Twitter</span>
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-red-500 text-xl transition-colors duration-300">
                                <span class="sr-only">YouTube</span>
                                <i class="fab fa-youtube"></i>
                            </a>
                            <a href="#" class="text-gray-400 hover:text-red-500 text-xl transition-colors duration-300">
                                <span class="sr-only">Spotify</span>
                                <i class="fab fa-spotify"></i>
                            </a>
                        </div>
                        <p class="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
                            &copy; 2025 TurningJane. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Footer;