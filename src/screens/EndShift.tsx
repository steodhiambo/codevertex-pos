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
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Shift Summary</h1>
            <p className="text-text-secondary">Review shift performance before closing</p>
          </div>

          <div className="card space-y-4 mb-8">
            <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
              <span className="text-text-secondary">Opening Float</span>
              <span className="font-semibold text-text-primary font-mono">KES 5,000.00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
              <span className="text-text-secondary">Cash Sales</span>
              <span className="font-semibold text-text-primary font-mono">KES 12,450.00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
              <span className="text-text-secondary">M-Pesa Sales</span>
              <span className="font-semibold text-text-primary font-mono">KES 8,200.00</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border border-dashed">
              <span className="text-text-secondary">Total Expected Cash</span>
              <span className="text-xl font-bold text-primary font-mono">KES 17,450.00</span>
            </div>
          </div>

          <button 
            className="w-full btn-primary h-16 text-xl"
            onClick={() => setStep('count')}
          >
            Proceed to Cash Count
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-primary mb-2">End Shift</h1>
          <p className="text-text-secondary">Enter the actual cash in drawer</p>
        </div>

        <div className="bg-surface border border-border rounded-card p-6 mb-12 text-center shadow-sm">
          <div className="text-4xl font-mono font-bold text-primary">
            {formatCurrency(closingCount)}
          </div>
        </div>

        <Numpad 
          onKeyPress={handleKeyPress} 
          onDelete={handleDelete}
          className="mb-12"
        />

        <div className="flex gap-4">
          <button 
            className="flex-1 h-16 rounded-card border border-border font-semibold text-text-secondary hover:bg-surface transition-colors"
            onClick={() => setStep('summary')}
          >
            Back
          </button>
          <button 
            className="flex-[2] btn-primary h-16 text-xl"
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
