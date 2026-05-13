import React, { useState } from 'react';
import { X, Smartphone, Banknote, CreditCard, Bed, CheckCircle2, Loader2 } from 'lucide-react';
import { orderApi } from '../lib/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bill: {
    id: string;
    table_id: string;
    total: number;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, bill }) => {
  const [activeTab, setActiveTab] = useState<'full' | 'split' | 'custom'>('full');
  const [method, setMethod] = useState<'mpesa' | 'cash' | 'card' | 'room' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phone, setPhone] = useState('');

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Process payment (Mocking the external payment gateway response)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Update order status in backend
      await orderApi.updateStatus(bill.id, 'paid');
      
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-surface w-full max-w-md rounded-card shadow-xl p-12 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6 scale-in">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-2">Payment Successful</h2>
          <p className="text-text-secondary">Receipt printed for Order #{bill.id.slice(0, 4)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-surface w-full max-w-2xl rounded-card shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Settle Bill</h2>
            <p className="text-text-secondary">Table {bill.table_id} · Order #{bill.id.slice(0, 4)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-bg/50 border-b border-border">
          {(['full', 'split', 'custom'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-lg font-bold text-sm capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              {tab === 'full' ? 'Full Payment' : tab === 'split' ? 'Split Equally' : 'Custom Split'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="text-center mb-10">
            <p className="text-text-secondary mb-1">Total Amount Due</p>
            <h1 className="text-5xl font-bold text-primary font-mono">KES {Number(bill.total).toLocaleString()}</h1>
          </div>

          <div className="space-y-6">
            <p className="font-bold text-text-primary">Select Payment Method</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'mpesa', label: 'M-Pesa', icon: <Smartphone /> },
                { id: 'cash', label: 'Cash', icon: <Banknote /> },
                { id: 'card', label: 'Card', icon: <CreditCard /> },
                { id: 'room', label: 'Room Charge', icon: <Bed /> },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`flex flex-col items-center justify-center gap-3 p-6 rounded-card border-2 transition-all ${
                    method === m.id 
                      ? 'border-primary bg-primary-pale text-primary' 
                      : 'border-border bg-surface text-text-secondary hover:border-primary-light'
                  }`}
                >
                  {React.cloneElement(m.icon as React.ReactElement, { size: 32 })}
                  <span className="font-bold">{m.label}</span>
                </button>
              ))}
            </div>

            {method === 'mpesa' && (
              <div className="animate-in slide-in-from-top duration-200">
                <label className="block text-sm font-bold text-text-secondary mb-2">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-14 px-4 rounded-card border-2 border-primary-pale focus:border-primary outline-none text-xl font-bold font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-bg/30">
          <button
            disabled={!method || isProcessing || (method === 'mpesa' && !phone)}
            onClick={handlePayment}
            className="w-full btn-primary h-16 text-xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Processing...
              </>
            ) : (
              `Confirm Payment KES ${Number(bill.total).toLocaleString()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
