import type { Component } from 'solid-js';
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';

const App: Component = () => {
  return (
    <div class="min-h-screen bg-gray-50">
      <Navbar />
      {/* Page Content */}
      <Footer />
    </div>
  );
};

export default App;