import type { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import Landing from './components/Landing/index.tsx';

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={Landing} />
    </Router>
  );
};

export default App;