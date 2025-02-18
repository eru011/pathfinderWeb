import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useBackButton = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      navigate(-1); // This will go back one step in history
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [navigate]);
}; 