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
    <div className="flex flex-col items-center justify-start h-screen bg-bg p-4 pt-8 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Extreme Concise Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-primary tracking-tighter uppercase">Codevertex</h1>
        </div>

        {/* Compact PIN Indicator */}
        <motion.div 
          animate={controls}
          className="flex justify-center gap-3 mb-6"
        >
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: i < pin.length ? [1, 1.1, 1] : 1,
                backgroundColor: i < pin.length ? '#6B2D8B' : 'transparent',
                borderColor: i < pin.length ? '#6B2D8B' : '#8B4DAB'
              }}
              className={`w-3 h-3 rounded-full border-2 transition-colors`}
            />
          ))}
        </motion.div>

        {/* Numpad with reduced spacing */}
        <Numpad 
          onKeyPress={handleKeyPress} 
          onDelete={handleDelete}
          className="mb-4 w-full scale-95"
        />

        <div className="text-center">
          <button 
            onClick={() => alert('Please contact your manager to reset your PIN.')}
            className="text-[10px] text-primary font-bold hover:underline uppercase tracking-tighter opacity-80"
          >
            Trouble logging in?
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;
