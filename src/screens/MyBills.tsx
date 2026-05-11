import React from 'react';
import { Receipt, Clock, ChevronRight } from 'lucide-react';

interface BillHistory {
  id: string;
  orderNumber: string;
  table: string;
  total: number;
  status: 'Active' | 'Settled' | 'Voided';
  time: string;
}

const mockHistory: BillHistory[] = [
  { id: '1', orderNumber: '#1024', table: 'T2', total: 4500, status: 'Active', time: '10 mins ago' },
  { id: '2', orderNumber: '#1020', table: 'T5', total: 3200, status: 'Settled', time: '45 mins ago' },
  { id: '3', orderNumber: '#1018', table: 'T1', total: 1500, status: 'Settled', time: '1 hour ago' },
  { id: '4', orderNumber: '#1015', table: 'T3', total: 2800, status: 'Voided', time: '2 hours ago' },
];

const MyBills: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">My Bills</h2>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-primary-pale text-primary rounded-full text-sm font-bold">
            Today
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockHistory.map((bill) => (
          <div key={bill.id} className="card p-4 flex items-center justify-between hover:border-primary-light transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-text-secondary">
                <Receipt size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-primary">{bill.orderNumber}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    bill.status === 'Active' ? 'bg-info/10 text-info' :
                    bill.status === 'Settled' ? 'bg-success/10 text-success' :
                    'bg-error/10 text-error'
                  }`}>
                    {bill.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Table {bill.table} · {bill.time}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-text-secondary">Amount</p>
                <p className="font-bold text-primary font-mono">KES {bill.total.toLocaleString()}</p>
              </div>
              <ChevronRight className="text-text-secondary" size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 bg-primary text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <span className="font-bold">Shift Totals</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded">Active Shift</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-white/70 text-xs mb-1 uppercase tracking-wider">Orders</p>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div>
            <p className="text-white/70 text-xs mb-1 uppercase tracking-wider">Settled</p>
            <p className="text-2xl font-bold">KES 42.5K</p>
          </div>
          <div>
            <p className="text-white/70 text-xs mb-1 uppercase tracking-wider">Tips</p>
            <p className="text-2xl font-bold">KES 1.2K</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBills;
