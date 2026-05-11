import React from 'react';
import { Delete } from 'lucide-react';

interface NumpadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  className?: string;
}

const Numpad: React.FC<NumpadProps> = ({ onKeyPress, onDelete, className = "" }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {keys.map((key, index) => {
        if (key === '') return <div key={`empty-${index}`} />;
        
        const isDelete = key === 'delete';

        return (
          <button
            key={key}
            onClick={() => isDelete ? onDelete() : onKeyPress(key)}
            className={`
              flex items-center justify-center h-20 w-full rounded-2xl border-2 transition-all 
              active:scale-95 active:shadow-inner
              ${isDelete 
                ? 'bg-bg border-border text-text-secondary active:bg-error/10 active:text-error active:border-error/20' 
                : 'bg-surface border-border text-3xl font-black text-text-primary active:bg-primary-pale active:text-primary active:border-primary-light font-mono shadow-sm'
              }
            `}
          >
            {isDelete ? <Delete size={28} /> : key}
          </button>
        );
      })}
    </div>
  );
};

export default Numpad;
