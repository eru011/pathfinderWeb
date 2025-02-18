import React from 'react';
import { ArrowLeft, Phone, Mail, MessageCircle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useBackButton } from '../hooks/useBackButton';

function Help() {
  useBackButton();
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  const helpOptions = [
    {
      icon: Phone,
      title: 'Contact Support',
      description: 'Speak with our support team',
      action: 'Call 1-800-PATHFINDER'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email',
      action: 'support@pathfinder.com'
    },
    {
      icon: Globe,
      title: 'FAQ',
      description: 'Browse common questions',
      action: 'View FAQs'
    }
  ];

  return (
    <div className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}>
      <header className={`flex items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm`}>
        <button 
          onClick={() => navigate('/settings')} 
          className={`rounded-full p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'}`}
        >
          <ArrowLeft className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Help & Support</h1>
      </header>

      <main className="flex-1 p-4">
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-md max-w-3xl mx-auto`}>
          {helpOptions.map((option) => (
            <div 
              key={option.title}
              className={`flex items-center p-4 rounded-lg ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              } transition-colors cursor-pointer mb-2`}
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
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                  {option.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Help;