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
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-primary mb-2">Start Shift</h1>
          <p className="text-text-secondary">Enter the opening float amount</p>
        </div>

        <div className="bg-surface border border-border rounded-card p-6 mb-12 text-center shadow-sm">
          <div className="text-4xl font-mono font-bold text-primary">
            {formatCurrency(float)}
          </div>
        </div>

        <Numpad 
          onKeyPress={handleKeyPress} 
          onDelete={handleDelete}
          className="mb-12"
        />

        <button 
          className="w-full btn-primary h-16 text-xl"
          disabled={!float || float === '0'}
          onClick={onConfirm}
        >
          Confirm & Open Shift
        </button>
      </div>
    </div>
  );
};

export default StartShift;
