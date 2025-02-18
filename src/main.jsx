import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import './index.css'
import Dashboard from './main-dashboard.jsx'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import JMCFloorPage from './jmc-floor-page.jsx'
import OneJMCFloorPage from './jmc-floors/floor-1-jmc.jsx'
import TwoJMCFloorPage from './jmc-floors/floor-2-jmc.jsx'
import ThreeJMCFloorPage from './jmc-floors/floor-3-jmc.jsx'
import AdminFloorPage from './admin-floor-page.jsx'
import AdminMainFloor from './admin-floors/main-floor.jsx'
import AdminBasementFloor from './admin-floors/basement-floor.jsx'
import SavedPaths from './saved-paths'
import Settings from './settings'
import RizalFloorPage from './rizal-floor-page.jsx'
import Accessibility from './components/Accessibility.jsx'
import About from './components/About.jsx'
import { DarkModeProvider } from './contexts/DarkModeContext'
import RizalFloorPlan from './rizal-floor-plan.jsx';
import Notifications from './components/Notifications.jsx';
import Help from './components/Help.jsx';

function App() {
  return (
    <div>
      {/* Your existing app content */}
      
      {/* Only show the button if voice commands are enabled in accessibility settings */}
      {localStorage.getItem('voiceEnabled') === 'true' && (
        <VoiceCommandButton />
      )}
    </div>
  );
}
const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/jmc-floor-page',
    element: <JMCFloorPage />,
  },
  {
    path: '/jmc-first-floor',
    element: <OneJMCFloorPage />,
  },
  {
    path: '/jmc-second-floor',
    element: <TwoJMCFloorPage />,
  },
  {
    path: '/jmc-third-floor',
    element: <ThreeJMCFloorPage />,
  },
  {
    path: '/admin-floor-page',
    element: <AdminFloorPage />,
  },
  {
    path: '/main-floor',
    element: <AdminMainFloor />,
  },
  {
    path: '/basement-floor',
    element: <AdminBasementFloor />,
  },
  {
    path: '/rizal-floor-page',
    element: <RizalFloorPage />,
  },
  {
    path: '/saved-paths',
    element: <SavedPaths />,
  },
  {
    path: '/settings',
    element: <Settings />,
  },
  {
    path: '/accessibility',
    element: <Accessibility />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/rizal-floor-plan',
    element: <RizalFloorPlan />,
  },
  {
    path: '/notifications',
    element: <Notifications />,
  },
  {
    path: '/help',
    element: <Help />,
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  </StrictMode>,
)
