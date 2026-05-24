import React, { useState } from 'react';
import { shiftApi } from '../lib/api';

interface EndShiftProps {
  shiftId: string;
  onConfirm: () => void;
}

const EndShift: React.FC<EndShiftProps> = ({ shiftId, onConfirm }) => {
  const [summary, setSummary] = useState<{ duration: string; total_orders: number; total_sales: number; voided_count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    shiftApi.getSummary(shiftId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [shiftId]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-6 max-w-[360px] w-full border border-border text-center">
        <div className="text-2xl mb-1">⏰</div>
        <h2 className="text-lg font-black text-text-primary font-heading mb-1">End Shift</h2>
        <p className="text-xs text-text-secondary font-medium mb-4">Closing shift will sign you out.</p>

        <div className="border-t border-border pt-3 mb-4 space-y-1.5 text-left">
          {loading ? (
            <p className="text-[11px] text-text-secondary text-center">Loading summary...</p>
          ) : summary ? (
            <>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Duration</span>
                <span className="font-bold text-text-primary">{summary.duration}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Total Orders</span>
                <span className="font-bold text-text-primary">{summary.total_orders}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Total Sales</span>
                <span className="font-bold text-text-primary">KES {Number(summary.total_sales).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-text-secondary">Voided Items</span>
                <span className="font-bold text-text-primary">{summary.voided_count}</span>
              </div>
            </>
          ) : (
            <p className="text-[11px] text-text-secondary text-center">Could not load summary</p>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={async () => {
              try {
                await shiftApi.end(shiftId);
                onConfirm();
              } catch (e) {
                console.error('Failed to end shift', e);
                alert('Failed to end shift. Please try again.');
              }
            }}
            className="flex-1 h-11 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-light transition-colors"
          >
            Close Shift
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndShift;
