import { Component } from "solid-js";
import Navbar from "../Navbar.tsx";
import Footer from "../Footer.tsx";
import VideoBackground from "./videoplayer.tsx";
import MusicGrid from "./MusicGrid.tsx";
import Gallery from "./gallery.tsx";

const Landing: Component = () => {
    return (
        <div class="min-h-screen bg-gray-50">
            <Navbar />
            <VideoBackground />
            <Gallery />
            <MusicGrid />
            <Footer />
        </div>
    );
};

export default Landing;