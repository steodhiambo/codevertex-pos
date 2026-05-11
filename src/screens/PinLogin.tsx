import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Numpad from '../components/Numpad';

const PIN_LENGTH = 4;

interface PinLoginProps {
  onLogin: (pin: string) => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const controls = useAnimation();

  const handleKeyPress = (key: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleAuth();
    }
  }, [pin]);

  const handleAuth = async () => {
    try {
      await onLogin(pin);
    } catch (error) {
      shake();
    }
  };

  const shake = async () => {
    await controls.start({
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.3 }
    });
    setPin('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-2">Codevertex</h1>
          <p className="text-text-secondary">Enter your PIN to continue</p>
        </div>

        <motion.div 
          animate={controls}
          className="flex justify-center gap-6 mb-12"
        >
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < pin.length ? [1, 1.2, 1] : 1,
                backgroundColor: i < pin.length ? '#6B2D8B' : 'transparent',
                borderColor: i < pin.length ? '#6B2D8B' : '#8B4DAB'
              }}
              className={`w-6 h-6 rounded-full border-2 transition-colors`}
            />
          ))}
        </motion.div>

        <Numpad 
          onKeyPress={handleKeyPress} 
          onDelete={handleDelete}
          className="mb-12"
        />

        <div className="text-center">
          <button className="text-primary font-semibold hover:underline">
            Forgot PIN?
          </button>
        </div>
      </div>

      {/* Active Shifts Avatar Pills */}
      <div className="absolute bottom-8 flex gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-border shadow-sm">
          <div className="w-6 h-6 rounded-full bg-primary-pale text-primary flex items-center justify-center text-xs font-bold">JD</div>
          <span className="text-xs font-medium text-text-primary">John Doe</span>
          <div className="w-2 h-2 rounded-full bg-success"></div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-border shadow-sm">
          <div className="w-6 h-6 rounded-full bg-primary-pale text-primary flex items-center justify-center text-xs font-bold">SM</div>
          <span className="text-xs font-medium text-text-primary">Sarah M.</span>
          <div className="w-2 h-2 rounded-full bg-success"></div>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
