import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mic, Navigation, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useBackButton } from '../hooks/useBackButton';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Capacitor } from '@capacitor/core';

function Accessibility() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  useBackButton();
  const [isListening, setIsListening] = useState(false);
  const [utterance, setUtterance] = useState('');
  const [feedback, setFeedback] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  
  // Add toggle states
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('voiceEnabled') === 'true'
  });
  const [tapEnabled, setTapEnabled] = useState(false);
  const [micStatus, setMicStatus] = useState('ready'); // 'ready', 'listening', 'processing'
  const [testTranscript, setTestTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);

  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      return true; // For web testing
    }

    try {
      // First check if the feature is available
      const { available } = await SpeechRecognition.available();
      if (!available) {
        setFeedback('Speech recognition not available on this device');
        return false;
      }

      // Try to start recognition - this will trigger the native permission request if needed
      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 2,
        prompt: 'Speak now',
        partialResults: true,
        popup: false,
      });
      
      // Immediately stop since we're just checking permissions
      await SpeechRecognition.stop();
      return true;
    } catch (error) {
      console.error('Permission check error:', error);
      if (error.message.includes('permission')) {
        setFeedback('Please grant microphone permission in your device settings');
      } else {
        setFeedback('Error checking permissions');
      }
      return false;
    }
  };

  const toggleListening = async () => {
    if (!voiceEnabled) {
      setFeedback('Please enable voice navigation first');
      return;
    }

    // If currently listening, just stop and reset UI
    if (micStatus === 'listening') {
      setMicStatus('ready');
      setFeedback('');
      setTestTranscript('');
      setUtterance('');
      setIsListening(false);
      return;
    }

    try {
      // Clear any existing listeners before starting
      SpeechRecognition.removeAllListeners();
      
      // Set up result listeners before starting
      SpeechRecognition.addListener('partialResults', (data) => {
        if (data.matches && data.matches.length > 0) {
          setTestTranscript(data.matches[0]);
        }
      });

      SpeechRecognition.addListener('results', (data) => {
        if (data.matches && data.matches.length > 0) {
          const transcript = data.matches[0];
          setUtterance(transcript);
          handleVoiceCommand(transcript);
        }
      });

      // Start listening
      setMicStatus('listening');
      setFeedback('Starting...');
      setTestTranscript('');

      await SpeechRecognition.start({
        language: 'en-US',
        maxResults: 2,
        prompt: 'Speak now',
        partialResults: true,
        popup: false,
      });

      setFeedback('Listening...');

    } catch (error) {
      console.error('Error starting recognition:', error);
      setMicStatus('ready');
      SpeechRecognition.removeAllListeners();
      
      if (error.message.includes('permission')) {
        setFeedback('Microphone permission is required. Please check your device settings.');
      } else if (error.message.includes('unavailable')) {
        setFeedback('Speech recognition is not available on this device.');
      } else {
        setFeedback('Error starting voice recognition. Please try again.');
      }
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (micStatus === 'listening') {
        SpeechRecognition.stop().catch(console.error);
        SpeechRecognition.removeAllListeners();
        setMicStatus('ready');
        setFeedback('');
        setTestTranscript('');
        setUtterance('');
        setIsListening(false);
      }
    };
  }, [micStatus]);

  // Remove the initial permission check on mount since we'll check when needed
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Just check availability on mount
      SpeechRecognition.available()
        .then(({ available }) => {
          if (!available) {
            setFeedback('Speech recognition not available on this device');
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleVoiceCommand = (command) => {
    const cleanCommand = command.toLowerCase().trim();
    console.log('Processing command:', cleanCommand);

    switch(cleanCommand) {
      case 'go home':
      case 'home':
        navigate('/');
        setFeedback('Navigating to home');
        break;
      case 'go back':
      case 'back':
        navigate(-1);
        setFeedback('Going back');
        break;
      case 'settings':
      case 'open settings':
        navigate('/settings');
        setFeedback('Opening settings');
        break;
      case 'saved paths':
      case 'show saved paths':
        navigate('/saved-paths');
        setFeedback('Showing saved paths');
        break;
      default:
        setFeedback(`Command not recognized: ${cleanCommand}`);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <div className="flex items-center justify-between py-2">
      <span className={`text-sm font-medium ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}>
        {label}
      </span>
      <button
        onClick={onToggle}
        className={`flex items-center justify-center p-2 rounded-md transition-colors ${
          isDarkMode 
            ? 'hover:bg-gray-700' 
            : 'hover:bg-gray-100'
        }`}
      >
        {enabled ? (
          <ToggleRight className="w-6 h-6 text-sky-500" />
        ) : (
          <ToggleLeft className="w-6 h-6 text-gray-400" />
        )}
      </button>
    </div>
  );

  return (
    <div className={`flex min-h-screen flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-sky-50'}`}>
      <header className={`flex items-center justify ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } p-4 shadow-sm`}>
        <button 
          onClick={() => navigate('/settings')} 
          className={`rounded-full p-2 ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-100'
          } transition-colors`}
        >
          <ArrowLeft className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
        </button>
        <h1 className={`text-xl font-semibold ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          Accessibility Options
        </h1>
        
      </header>

      <main className="flex-1 p-4">
        {/* Warning Banner */}
        <div className={`mb-6 p-4 rounded-lg ${
          isDarkMode 
            ? 'bg-amber-900/20 border border-amber-700/50 text-amber-200' 
            : 'bg-amber-50 border border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-start">
            <svg 
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <div>
              <h3 className="font-semibold">Experimental Features</h3>
              <p className="text-sm mt-1">
                Some accessibility features are currently experimental and may not work on all devices. 
                Please use with caution.
              </p>
              <br />
              <p className="text-sm mt-1">Please await for future updates.</p>
            </div>
          </div>
        </div>

        <div className={`space-y-6 max-w-3xl mx-auto`}>
          {/* Voice Navigation Section */}
          <section className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 shadow-md`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-semibold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Voice Navigation
              </h2>
              <ToggleSwitch 
                enabled={voiceEnabled} 
                onToggle={() => {
                  const newValue = !voiceEnabled;
                  setVoiceEnabled(newValue);
                  localStorage.setItem('voiceEnabled', newValue);
                }}
                label="Enable Voice Navigation"
              />
            </div>
            
            {voiceEnabled && (
              <div className="mt-4 space-y-4">
                <button
                  onClick={toggleListening}
                  className={`w-full flex items-center justify-center space-x-2 p-4 rounded-lg 
                    ${micStatus === 'listening'
                      ? `${isDarkMode 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-red-500 hover:bg-red-600'} text-white`
                      : `${isDarkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' 
                          : 'bg-sky-100 hover:bg-sky-200 text-gray-800'}`
                    } transition-colors`}
                >
                  <Mic className={`h-6 w-6 ${micStatus === 'listening' ? 'animate-pulse' : ''}`} />
                  <span>
                    {micStatus === 'listening' ? 'Stop Listening' : 'Test Microphone'}
                  </span>
                </button>

                {/* Real-time feedback area */}
                {micStatus === 'listening' && (
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  } mt-4`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className={`text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Listening...
                      </span>
                    </div>
                    {testTranscript && (
                      <p className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {testTranscript}
                      </p>
                    )}
                  </div>
                )}

                {/* Final transcript display */}
                {utterance && micStatus === 'ready' && (
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  } mt-4`}>
                    <h3 className={`text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Last Test Result:
                    </h3>
                    <p className={`${
                      isDarkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {utterance}
                    </p>
                  </div>
                )}

                {feedback && (
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {feedback}
                    </p>
                  </div>
                )}

                {/* Replace the Voice Commands List with Microphone Location Info */}
                <div className={`p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <h3 className={`font-medium mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>Voice Search</h3>
                  <div className="flex items-center space-x-2">
                    <Mic className={`h-5 w-5 ${isDarkMode ? 'text-sky-400' : 'text-sky-600'}`} />
                    <p className={`text-base font-medium ${
                      isDarkMode ? 'text-sky-400' : 'text-sky-600'
                    }`}>
                      Look for the microphone icon <Mic className="h-4 w-4 inline" /> next to the search bar to start voice search.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Voice Guide Section - Replacing Tap Navigation */}
          {voiceEnabled && (
            <section className={`rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 shadow-md`}>
              <h2 className={`text-lg font-semibold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                Voice Guide
              </h2>
              
              <div className="mt-4 space-y-4">
                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <h3 className={`font-medium mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>Available Voice Commands</h3>
                  
                  <ul className={`space-y-2 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">"Navigate to [location]"</span> 
                      - Starts navigation to specified location
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">"Kainan" or "Canteen"</span> 
                      - Navigates to the nearest canteen
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">"Cashier or "San pwede Magbayad?""</span> 
                      - Finds the nearest restroom
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">"Library"</span> 
                      - Takes you to the library
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium">"President's Office"</span> 
                      - Directs to the administration office
                    </li>
                  </ul>
                </div>

                <div className={`p-4 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <h3 className={`font-medium mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>Tips for Better Recognition</h3>
                  
                  <ul className={`space-y-2 text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <li>• Speak clearly and at a normal pace</li>
                    <li>• Use the exact location names</li>
                    <li>• Minimize background noise</li>
                    <li>• Hold device closer when speaking</li>
                    <li>• Wait for the listening indicator</li>
                  </ul>
                </div>

              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default Accessibility; 