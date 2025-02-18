import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Bell, Eye, HelpCircle, Info, Navigation, ClipboardList, Settings as SettingsIcon } from 'lucide-react';
import { useDarkMode } from './contexts/DarkModeContext';
import { useBackButton } from './hooks/useBackButton';

function Settings() {
  useBackButton();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const settingsOptions = [
    {
      icon: Moon,
      title: 'Dark Mode',
      description: 'Toggle dark/light theme',
      action: 'toggle',
      isActive: isDarkMode,
      onToggle: toggleDarkMode
    },
    {
      icon: Eye,
      title: 'Accessibility',
      description: 'Text-to-speech and viewing options',
      action: 'navigate',
      path: '/accessibility'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage notification settings',
      action: 'navigate',
      path: '/notifications'
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help using PathFinder',
      action: 'navigate',
      path: '/help'
    },
    {
      icon: Info,
      title: 'About',
      description: 'App information and version',
      action: 'navigate',
      path: '/about'
    }
  ];

  return (
    <div className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}>
      <header className={`flex items-center justify ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
      <button 
          onClick={() => navigate('/')} 
          className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'} transition-colors`}
        >
          <ArrowLeft className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Settings</h1>
        
      </header>

      <main className="flex-1 p-4">
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-md max-w-3xl mx-auto`}>
          <div className="space-y-2">
            {settingsOptions.map((option) => (
              <div
                key={option.title}
                onClick={() => {
                  if (option.action === 'navigate' && option.path) {
                    navigate(option.path);
                  } else if (option.action === 'toggle') {
                    option.onToggle?.();
                  }
                }}
                className={`flex items-center p-4 rounded-lg ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                } transition-colors cursor-pointer`}
              >
                <div className={`p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-sky-100'} rounded-full mr-4`}>
                  <option.icon className={`h-6 w-6 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {option.title}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                </div>
                {option.action === 'toggle' ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      option.onToggle?.();
                    }}
                    className={`w-12 h-6 ${
                      option.isActive ? 'bg-sky-600' : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    } rounded-full p-1 duration-300 ease-in-out relative`}
                  >
                    <div 
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                        option.isActive ? 'translate-x-6' : ''
                      }`} 
                    />
                  </button>
                ) : (
                  <ArrowLeft className={`h-5 w-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} transform rotate-180`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-sky-200'} 
        border-t fixed bottom-0 w-full`}>
        <nav className="flex justify-around max-w-md mx-auto py-2">
          {[
            { icon: ClipboardList, label: "List", path: "/saved-paths" },
            { icon: Navigation, label: "Navigate", path: "/" },
            { icon: SettingsIcon, label: "Settings", path: "/settings" },
          ].map(({ icon: Icon, label, path }) => (
            <Link
              key={label}
              to={path}
              className={`flex flex-col items-center`}
            >
              <div className={`p-2 rounded-full ${
                path === '/settings' 
                  ? (isDarkMode ? 'bg-sky-900/50' : 'bg-sky-100') // Active background
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700' // Hover state
              }`}>
                <Icon className={`h-6 w-6 ${
                  path === '/settings' 
                    ? (isDarkMode ? 'text-sky-400' : 'text-sky-600')
                    : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                }`} />
              </div>
              <span className={`text-xs mt-1 ${
                path === '/settings' 
                  ? (isDarkMode ? 'text-sky-400 font-medium' : 'text-sky-600 font-medium')
                  : (isDarkMode ? 'text-gray-400' : 'text-gray-600')
              }`}>
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}

export default Settings; 