import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PIN_MIN = 4;
const PIN_MAX = 6;

interface PinLoginProps {
  onLogin: (pin: string) => void | Promise<void>;
  onForgotPin?: () => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ onLogin, onForgotPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleKeyPress = (key: string) => {
    if (pin.length >= PIN_MAX) return;
    const next = pin + key;
    setPin(next);
    setError('');

    if (next.length >= PIN_MIN) {
      Promise.resolve(onLogin(next)).catch(() => {
        setError('Invalid PIN');
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); }, 600);
      });
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center py-4 px-4 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #6B2D8B 0%, #8B4DAB 100%)' }}
    >
      <div className="bg-white rounded-[28px] p-6 max-w-[360px] w-full shadow-2xl text-center my-auto">
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'linear-gradient(135deg, #6B2D8B, #8B4DAB)' }}
        >
          <span className="text-white text-xl font-black font-heading">CV</span>
        </div>

        <h1 className="text-lg font-black text-text-primary font-heading mb-0.5">Codevertex POS</h1>
        <p className="text-[11px] text-text-secondary font-medium mb-4">Enter your PIN to sign in</p>

        {/* PIN Dots */}
        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center gap-2 mb-1"
        >
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full transition-all duration-150"
              style={{
                background: i < pin.length ? '#6B2D8B' : '#E8E5ED',
                transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                boxShadow: i < pin.length ? '0 0 8px rgba(107,45,139,0.25)' : 'none',
              }}
            />
          ))}
        </motion.div>
        <p className="text-[10px] text-text-secondary/50 mb-1">4-6 digit PIN</p>

        {error && (
          <div className="py-1 px-2.5 rounded-md bg-red-50 text-red-500 text-[11px] font-semibold mb-2">
            ⚠ {error}
          </div>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 max-w-[260px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button
              key={d}
              onClick={() => handleKeyPress(String(d))}
              className="h-12 rounded-xl border border-border bg-white text-lg font-black text-text-primary font-heading transition-all active:bg-primary/5 active:border-primary"
            >
              {d}
            </button>
          ))}
          <button
            onClick={onForgotPin}
            className="h-12 rounded-xl border border-border bg-white text-[10px] font-semibold text-text-secondary hover:border-primary transition-colors"
          >
            Forgot?
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl border border-border bg-white text-lg font-black text-text-primary font-heading transition-all active:bg-primary/5 active:border-primary"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl border border-border bg-white text-sm text-text-secondary transition-all active:bg-primary/5 active:border-primary"
          >
            ⌫
          </button>
        </div>

        <p className="text-[7px] text-text-secondary/40 mt-2">
          PINs: 0000(Admin) · 1234/5678/4321(Waiters) · 1111(Cashier) · 2222(Kitchen) · 3333(Bar) · 4444(Reception) · 9999(Manager)
        </p>
      </div>
    </div>
  );
};

export default PinLogin;
