import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainDashboard from './main-dashboard';
import RizalFloorPage from './rizal-floor-page';
import SavedPaths from './saved-paths';
import Settings from './settings';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import BasementFloor from './admin-floors/basement-floor';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/rizal-floor-page" element={<RizalFloorPage />} />
        <Route path="/saved-paths" element={<SavedPaths />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/basement-floor" element={<BasementFloor />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;