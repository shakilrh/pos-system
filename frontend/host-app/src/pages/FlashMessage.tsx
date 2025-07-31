import React, { useEffect } from 'react';

interface FlashMessageProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  className?: string;
}

const FlashMessage: React.FC<FlashMessageProps> = ({ message, type, onClose, className = '' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700';

  return (
    <div className={`p-4 mb-6 rounded-xl shadow-sm border-t-4 ${bgColor} ${className} relative`} role="alert">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-lg hover:opacity-70 transition-opacity"
        aria-label="Close message"
      >
        ×
      </button>
      <p className="pr-6">{message}</p>
    </div>
  );
};

export default FlashMessage;
