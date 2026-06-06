import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
      <div
        className="relative glass rounded-2xl p-6 max-w-md w-full shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-lg font-semibold text-[#2d2d4a] mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
