import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useBackButton } from '../hooks/useBackButton';

function About() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  useBackButton();
  return (
    <div className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}>
      <header className={`flex items-center justify ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
      <button 
          onClick={() => navigate('/settings')} 
          className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'} transition-colors`}
        >
          <ArrowLeft className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>About</h1>
        
      </header>

      <main className="flex-1 p-4">
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 shadow-md max-w-3xl mx-auto space-y-6`}>
          {/* App Logo/Icon */}
          <div className="flex justify-center">
            <img 
              src="/assets/logo/lightLogo.png" 
              alt="PathFinder CCC Logo" 
              className="w-25 h-25 rounded-xl shadow-lg"
            />
          </div>

          {/* App Introduction */}
          <div className="space-y-4">
            <h2 className={`text-2xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              PathFinder CCC
            </h2>
            <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Version 1.0.0
            </p>
            
            {/* Main Description */}
            <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>
                PathFinder CCC is an innovative indoor navigation application designed specifically for Contra Costa College. 
                Our mission is to help students, staff, and visitors navigate the campus efficiently and confidently.
              </p>

              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Key Features:
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Indoor navigation with turn-by-turn directions</li>
                <li>Accessible routes for users with mobility needs</li>
                <li>Voice commands for hands-free navigation</li>
                <li>Save frequently visited paths</li>
                <li>Dark mode for comfortable viewing</li>
                <li>Real-time location updates</li>
              </ul>

              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                How It Works:
              </h3>
              <p>
                Using advanced indoor mapping technology, PathFinder CCC provides precise navigation 
                throughout the campus buildings. Simply select your destination, and let PathFinder 
                guide you with clear, step-by-step directions to your location.
              </p>

              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Accessibility:
              </h3>
              <p>
                We're committed to making campus navigation accessible to everyone. PathFinder CCC 
                includes voice commands, high-contrast visuals, and accessible route options to 
                ensure a seamless experience for all users.
              </p>
            </div>
          </div>

          {/* Contact & Support */}
          <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Contact & Support
            </h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              For support or feedback, please contact us at:
              <br />
              <a 
                href="mailto:support@pathfinderccc.com" 
                className="text-sky-600 hover:underline"
              >
                support@pathfinderccc.com
              </a>
            </p>
          </div>

          {/* Copyright */}
          <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>© 2024 PathFinder CCC. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default About; 