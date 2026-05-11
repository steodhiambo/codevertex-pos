import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface VoidBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  bill: {
    orderNumber: string;
    total: number;
  };
}

const VoidBillModal: React.FC<VoidBillModalProps> = ({ isOpen, onClose, onConfirm, bill }) => {
  const [reason, setReason] = useState('');
  const reasons = [
    'Incorrect Items Ordered',
    'Customer Changed Mind',
    'Kitchen Error',
    'Duplicate Bill',
    'Other'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface w-full max-w-md rounded-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="p-6 border-b border-border bg-error/5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle size={24} />
            <h2 className="text-xl font-bold">Void Bill</h2>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-bg rounded-lg border border-border">
            <p className="text-sm text-text-secondary mb-1">Are you sure you want to void bill</p>
            <p className="font-bold text-text-primary">{bill.orderNumber} for KES {bill.total.toLocaleString()}?</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Select Reason</p>
            <div className="space-y-2">
              {reasons.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full p-4 rounded-card border-2 text-left transition-all ${
                    reason === r 
                      ? 'border-error bg-error/5 text-error font-bold' 
                      : 'border-border bg-surface text-text-secondary hover:border-error/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 h-14 rounded-card border border-border font-semibold text-text-secondary hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={!reason}
              onClick={() => onConfirm(reason)}
              className="flex-[2] bg-error text-white h-14 rounded-card font-bold text-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              Void Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoidBillModal;
