import React, { useState } from 'react';
import { ArrowLeft, Phone, KeyRound, CheckCircle, Loader2 } from 'lucide-react';
import { authApi } from '../lib/api';

interface ForgotPinProps {
  onBack: () => void;
  onResetComplete: () => void;
}

const ForgotPin: React.FC<ForgotPinProps> = ({ onBack, onResetComplete }) => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'reset' | 'done'>('phone');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!phone.trim()) { setError('Enter your registered phone number'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.forgotPin(phone.trim());
      setUserName(res.user_name);
      setStep('reset');
    } catch (e: any) {
      setError(e.message || 'No account found with that phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPin.length < 4 || newPin.length > 6) { setError('PIN must be 4-6 digits'); return; }
    if (!/^\d+$/.test(newPin)) { setError('PIN must be numeric'); return; }
    if (newPin !== confirmPin) { setError('PINs do not match'); return; }
    setLoading(true); setError('');
    try {
      await authApi.resetPin(phone.trim(), newPin);
      setStep('done');
    } catch (e: any) {
      setError(e.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center py-8 px-4"
      style={{ background: 'linear-gradient(135deg, #6B2D8B 0%, #8B4DAB 100%)' }}
    >
      <div className="bg-white rounded-[28px] p-6 max-w-[380px] w-full shadow-2xl">
        <button onClick={onBack} className="flex items-center gap-1 text-text-secondary hover:text-primary mb-4 text-xs font-semibold">
          <ArrowLeft size={14} /> Back to Login
        </button>

        {step === 'phone' && (
          <>
            <div className="w-12 h-12 rounded-2xl bg-primary-pale flex items-center justify-center mx-auto mb-3">
              <Phone size={22} className="text-primary" />
            </div>
            <h2 className="text-lg font-black text-center text-text-primary mb-1">Forgot PIN</h2>
            <p className="text-[11px] text-center text-text-secondary mb-5">
              Enter your registered phone number to reset your PIN.
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary"
              />
            </div>

            {error && <p className="text-[11px] font-semibold text-error mb-3">{error}</p>}

            <button
              onClick={handleLookup}
              disabled={loading || !phone.trim()}
              className="w-full h-11 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Find Account'}
            </button>
          </>
        )}

        {step === 'reset' && (
          <>
            <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-3">
              <KeyRound size={22} className="text-warning" />
            </div>
            <h2 className="text-lg font-black text-center text-text-primary mb-1">Set New PIN</h2>
            <p className="text-[11px] text-center text-text-secondary mb-1">
              Account found: <strong>{userName}</strong>
            </p>
            <p className="text-[10px] text-center text-text-secondary mb-5">Enter a new 4-6 digit PIN.</p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">New PIN</label>
                <input
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  inputMode="numeric"
                  className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary font-mono tracking-widest"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Confirm PIN</label>
                <input
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  inputMode="numeric"
                  className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary font-mono tracking-widest"
                />
              </div>
            </div>

            {error && <p className="text-[11px] font-semibold text-error mb-3">{error}</p>}

            <button
              onClick={handleReset}
              disabled={loading || !newPin || !confirmPin}
              className="w-full h-11 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Reset PIN'}
            </button>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={28} className="text-success" />
            </div>
            <h2 className="text-lg font-black text-center text-text-primary mb-1">PIN Reset Successful</h2>
            <p className="text-[11px] text-center text-text-secondary mb-6">
              Your PIN has been changed. You can now log in with your new PIN.
            </p>
            <button
              onClick={onResetComplete}
              className="w-full h-11 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light transition-all"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPin;
