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
    <div className={`p-4 mb-6 rounded-xl shadow-sm border-t-4 ${bgColor} ${className}`} role="alert">
      <p>{message}</p>
      <button onClick={onClose} className="float-right text-sm">×</button>
    </div>
  );
};

export default FlashMessage;
