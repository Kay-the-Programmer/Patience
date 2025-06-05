import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode; // Changed from string to ReactNode
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title-text">
      <div 
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all flex flex-col max-h-[85vh]`}
      >
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {typeof title === 'string' ? (
              <h3 id="modal-title-text" className="text-xl font-semibold text-gray-800">{title}</h3>
            ) : (
              <div id="modal-title-text" className="text-xl font-semibold text-gray-800 flex items-center">{title}</div>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Modal Content - Scrollable */}
        <div className="px-6 pb-6 pt-4 overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
