import { HashRouter, Route, Routes } from 'react-router-dom';
import AppShell from '../ui/layout/AppShell.jsx';
import HomePage from '../pages/home/HomePage.jsx';

// HashRouter keeps working when the built app is opened from disk (file://), which is how an
// Electron or Tauri window would load it. Only Home exists; the other five navigation items are
// shown but disabled (see app/routes.js).
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
