import { Component } from "solid-js";
import Navbar from "../Navbar.tsx";
import Footer from "../Footer.tsx";
import VideoBackground from "./videoplayer.tsx";

const Landing: Component = () => {
    return (
        <div class="min-h-screen bg-gray-50">
            <Navbar />
            {/* Page Content */}
            <VideoBackground />
            <Footer />
        </div>
    );
};

export default Landing;