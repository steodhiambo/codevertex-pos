import React, { useState } from 'react';
import Numpad from '../components/Numpad';

interface EndShiftProps {
  onConfirm: () => void;
}

const EndShift: React.FC<EndShiftProps> = ({ onConfirm }) => {
  const [closingCount, setClosingCount] = useState('');
  const [step, setStep] = useState<'summary' | 'count'>('summary');

  const handleKeyPress = (key: string) => {
    setClosingCount(prev => prev + key);
  };

  const handleDelete = () => {
    setClosingCount(prev => prev.slice(0, -1));
  };

  const formatCurrency = (value: string) => {
    if (!value) return '0.00';
    const num = parseFloat(value) / 100;
    return num.toLocaleString('en-KE', { style: 'currency', currency: 'KES' });
  };

  if (step === 'summary') {
    return (
      <div className="flex flex-col items-center justify-start h-screen bg-bg p-4 pt-8 overflow-hidden">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-primary uppercase tracking-tighter">Shift Summary</h1>
          </div>

          <div className="w-full bg-surface border-2 border-border rounded-xl p-3 mb-4 space-y-2 shadow-sm">
            <div className="flex justify-between items-center py-1 border-b border-border border-dashed">
              <span className="text-[10px] font-bold text-text-secondary uppercase">Opening</span>
              <span className="font-black text-text-primary font-mono text-xs">KES 5,000</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border border-dashed">
              <span className="text-[10px] font-bold text-text-secondary uppercase">Cash Sales</span>
              <span className="font-black text-text-primary font-mono text-xs">KES 12,450</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border border-dashed">
              <span className="text-[10px] font-bold text-text-secondary uppercase">M-Pesa</span>
              <span className="font-black text-text-primary font-mono text-xs">KES 8,200</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] font-black text-text-primary uppercase">Total Expected</span>
              <span className="text-base font-black text-primary font-mono">KES 17,450</span>
            </div>
          </div>

          <button 
            className="w-full h-12 bg-primary text-white text-base font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all active:scale-95"
            onClick={() => setStep('count')}
          >
            Proceed to Count
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-screen bg-bg p-4 pt-8 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="text-center mb-4">
          <h1 className="text-xl font-black text-primary uppercase tracking-tighter">End Shift</h1>
        </div>

        <div className="w-full bg-surface border-2 border-border rounded-xl p-3 mb-4 text-center shadow-sm">
          <div className="text-2xl font-mono font-black text-primary">
            {formatCurrency(closingCount)}
          </div>
        </div>

        <Numpad 
          onKeyPress={handleKeyPress} 
          onDelete={handleDelete}
          className="mb-4 w-full scale-95"
        />

        <div className="flex gap-4 w-full">
          <button 
            className="flex-1 h-12 rounded-xl border-2 border-border font-black text-text-secondary uppercase text-xs hover:bg-surface transition-all active:scale-95"
            onClick={() => setStep('summary')}
          >
            Back
          </button>
          <button 
            className="flex-[2] h-12 bg-primary text-white text-base font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50"
            disabled={!closingCount || closingCount === '0'}
            onClick={onConfirm}
          >
            Close Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndShift;
