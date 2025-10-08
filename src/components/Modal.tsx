import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 max-w-sm w-full mx-6">
        {children}
      </div>
    </div>
  );
};

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  icon?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  buttonText,
  onButtonClick,
  icon = "✨"
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="text-3xl">{icon}</div>
        </div>
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          {description}
        </p>
      
        <div className="flex gap-3">
          <button
            onClick={onButtonClick}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};






