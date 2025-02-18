import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useBackButton } from '../hooks/useBackButton';
import { useState } from 'react';

function Notifications() {
  useBackButton();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : [
      {
        title: 'Push Notifications',
        description: 'Receive alerts on your device',
        enabled: false
      },
      {
        title: 'Route Updates',
        description: 'Get notified about changes to your saved routes',
        enabled: false
      },
    ];
  });

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isEmailModified, setIsEmailModified] = useState(false);

  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleSetting = (index) => {
    setSettings(prevSettings => {
      const newSettings = prevSettings.map((setting, i) => {
        if (i === index) {
          const newEnabled = !setting.enabled;
          if (setting.title === 'Email Notifications') {
            setShowEmailInput(newEnabled);
          }
          return { ...setting, enabled: newEnabled };
        }
        return setting;
      });
      localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const updateEmail = (email) => {
    setIsEmailModified(true);
    setSettings(prevSettings => prevSettings.map(setting => 
      setting.title === 'Email Notifications' ? { ...setting, email } : setting
    ));
  };

  const saveEmail = () => {
    setIsEmailModified(false);
    alert('Email saved successfully!');
  };

  const getToggleButtonStyles = (enabled) => `
    w-14 h-7 rounded-full p-1 transition-all duration-300 ease-in-out relative
    ${enabled 
      ? (isDarkMode ? 'bg-sky-500 hover:bg-sky-600' : 'bg-sky-500 hover:bg-sky-600')
      : (isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400')
    }
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    ${enabled 
      ? 'focus:ring-sky-500' 
      : (isDarkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400')
    }
  `;

  return (
    <div className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}>
      <header className={`flex items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <button 
          onClick={() => navigate('/settings')} 
          className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'}`}
        >
          <ArrowLeft className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Notifications</h1>
      </header>

      <main className="flex-1 p-4">
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-md max-w-3xl mx-auto`}>
          {settings.map((setting, index) => (
            <div key={setting.title} 
              className={`mb-4 p-4 border-b last:border-b-0 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {setting.title}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {setting.description}
                  </p>
                </div>
                <button 
                  onClick={() => toggleSetting(index)}
                  className={getToggleButtonStyles(setting.enabled)}
                  aria-pressed={setting.enabled}
                >
                  <span className="sr-only">
                    {setting.enabled ? 'Enable' : 'Disable'} {setting.title}
                  </span>
                  <div 
                    className={`
                      bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300
                      ${setting.enabled ? 'translate-x-7' : 'translate-x-0'}
                    `} 
                  />
                </button>
              </div>
              {setting.title === 'Email Notifications' && showEmailInput && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={settings.find(s => s.title === 'Email Notifications').email}
                      onChange={(e) => updateEmail(e.target.value)}
                      className={`flex-1 p-2 rounded-md border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                    {isEmailModified && (
                      <button
                        onClick={saveEmail}
                        className={`px-4 py-2 rounded-md ${
                          isDarkMode
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : 'bg-sky-500 hover:bg-sky-600 text-white'
                        }`}
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              )}
              {setting.title === 'Route Updates' && setting.enabled && (
                <div className="mt-3">
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Route Change History
                  </h4>
                  <ul className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <li>Office of Student Affairs has been moved, updated on 2023-10-01</li>
                    <li>Supreme Student Council has been moved, updated on 2023-10-02</li>
                    {/* Add more route updates as needed */}
                  </ul>
                  <button
                    onClick={() => alert('Please update the application to see the latest changes.')}
                    className={`mt-2 px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : 'bg-sky-500 hover:bg-sky-600 text-white'
                    }`}
                  >
                    Update Application
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Notifications;