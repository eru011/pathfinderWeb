import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useVoiceCommands() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  // ... rest of the voice command logic ...

  return {
    isListening,
    feedback,
    startListening,
    stopListening
  };
} 