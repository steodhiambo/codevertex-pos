import React, { useState } from 'react';
import { X, Users, ChevronRight, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuestCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
  tableName: string;
}

const GuestCountModal: React.FC<GuestCountModalProps> = ({ isOpen, onClose, onConfirm, tableName }) => {
  const [count, setCount] = useState(1);
  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-text-primary/40 backdrop-blur-md" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-border/40 bg-bg/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  <Users size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Seating Protocol</span>
                    <div className="w-1 h-1 rounded-full bg-primary/30" />
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{tableName}</span>
                  </div>
                  <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase">Guest Count</h2>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 text-text-secondary hover:bg-bg hover:text-primary rounded-2xl transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6 px-2">
                <Hash size={16} className="text-primary" />
                <span className="text-xs font-black text-text-secondary uppercase tracking-[0.15em]">Select Occupancy</span>
              </div>

              {/* Grid of Precision Selector Buttons */}
              <div className="grid grid-cols-4 gap-4 mb-10">
                {options.map((num) => (
                  <button
                    key={num}
                    onClick={() => setCount(num)}
                    className={`
                      aspect-square rounded-[1.5rem] text-2xl font-black font-mono transition-all duration-300 relative overflow-hidden border-2
                      ${count === num 
                        ? 'bg-primary text-white border-primary shadow-xl shadow-primary/30 scale-105 z-10' 
                        : 'bg-bg border-transparent text-text-secondary hover:border-primary-light hover:text-primary hover:bg-white'
                      }
                    `}
                  >
                    {num}
                    {count === num && (
                      <motion.div 
                        layoutId="activeCount"
                        className="absolute inset-0 bg-primary -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Modern Action Bar */}
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="px-8 h-16 rounded-[1.5rem] border-2 border-border/50 font-black text-xs uppercase tracking-widest text-text-secondary hover:bg-bg hover:text-primary transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => onConfirm(count)}
                  className="flex-1 h-16 rounded-[1.5rem] premium-gradient text-white text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Confirm Seating
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GuestCountModal;
