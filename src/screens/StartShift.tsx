import React, { useState } from 'react';
import Numpad from '../components/Numpad';

interface StartShiftProps {
  onConfirm: () => void;
}

const StartShift: React.FC<StartShiftProps> = ({ onConfirm }) => {
  const [float, setFloat] = useState('');

  const handleKeyPress = (key: string) => {
    setFloat(prev => prev + key);
  };

  const handleDelete = () => {
    setFloat(prev => prev.slice(0, -1));
  };

  const formatCurrency = (value: string) => {
    if (!value) return '0.00';
    const num = parseFloat(value) / 100;
    return num.toLocaleString('en-KE', { style: 'currency', currency: 'KES' });
  };

  return (
    <div className="flex flex-col items-center justify-start h-screen bg-bg p-4 pt-8 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="text-center mb-4">
          <h1 className="text-xl font-black text-primary uppercase tracking-tighter">Opening Float</h1>
        </div>

        <div className="w-full bg-surface border-2 border-border rounded-xl p-3 mb-4 text-center shadow-sm">
          <div className="text-2xl font-mono font-black text-primary">
            {formatCurrency(float)}
          </div>
        </div>

        <Numpad 
          onKeyPress={handleKeyPress} 
          onDelete={handleDelete}
          className="mb-4 w-full scale-95"
        />

        <button 
          className="w-full h-12 bg-primary text-white text-base font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50"
          disabled={!float || float === '0'}
          onClick={onConfirm}
        >
          Confirm & Open
        </button>
      </div>
    </div>
  );
};

export default StartShift;
