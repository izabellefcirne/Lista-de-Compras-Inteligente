import React, { useEffect } from 'react';
import { useStore } from '../store/store';
import { AlertTriangleIcon, XIcon } from './Icons';

const Toast: React.FC = () => {
  const { error, setError } = useStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) {
    return null;
  }

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-50 animate-slide-in-up">
      <div className="flex items-center p-4 max-w-sm w-full bg-red-600 text-white rounded-lg shadow-lg">
        <div className="flex-shrink-0">
          <AlertTriangleIcon className="w-6 h-6" />
        </div>
        <div className="ml-3 text-sm font-medium">{error}</div>
        <button
          onClick={() => setError(null)}
          className="ml-auto -mx-1.5 -my-1.5 bg-red-600 text-red-100 hover:text-white rounded-lg p-1.5 inline-flex h-8 w-8"
          aria-label="Fechar"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
