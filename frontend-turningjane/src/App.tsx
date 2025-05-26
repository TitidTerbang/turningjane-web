import type { Component } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import Landing from './components/Landing/index.tsx';
import AdminLogin from './components/Admin/AdminLogin_page.tsx';
import Dashboard from './components/Admin/Dashboard_page.tsx';

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={Landing} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={Dashboard} />
    </Router>
  );
};

export default App;