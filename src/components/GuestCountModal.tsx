import React, { useState } from 'react';
import { X, Users } from 'lucide-react';

interface GuestCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
  tableName: string;
}

const GuestCountModal: React.FC<GuestCountModalProps> = ({ isOpen, onClose, onConfirm, tableName }) => {
  const [count, setCount] = useState(1);
  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface w-full max-w-md rounded-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-pale text-primary flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Guest Count</h2>
              <p className="text-sm text-text-secondary">Table {tableName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {options.map((num) => (
              <button
                key={num}
                onClick={() => setCount(num)}
                className={`h-16 rounded-card text-2xl font-bold transition-all ${
                  count === num 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                    : 'bg-surface border border-border text-text-primary hover:border-primary-light hover:bg-primary-pale/50'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 h-14 rounded-card border border-border font-semibold text-text-secondary hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(count)}
              className="flex-[2] btn-primary h-14 text-lg"
            >
              Confirm {count} Guests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestCountModal;
