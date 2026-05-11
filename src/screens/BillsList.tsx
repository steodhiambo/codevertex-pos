import React from 'react';
import { Receipt, Search, ChevronRight } from 'lucide-react';

interface Bill {
  id: string;
  table: string;
  orderNumber: string;
  total: number;
  status: 'active' | 'settled' | 'voided';
  time: string;
  guestCount: number;
}

const mockBills: Bill[] = [
  { id: '1', table: 'T2', orderNumber: '#1024', total: 4500, status: 'active', time: '12:30 PM', guestCount: 2 },
  { id: '2', table: 'T4', orderNumber: '#1025', total: 2800, status: 'active', time: '12:45 PM', guestCount: 4 },
  { id: '3', table: 'T7', orderNumber: '#1026', total: 1200, status: 'settled', time: '1:15 PM', guestCount: 1 },
  { id: '4', table: 'V1', orderNumber: '#1023', total: 15600, status: 'settled', time: '11:45 AM', guestCount: 6 },
  { id: '5', table: 'T1', orderNumber: '#1022', total: 3400, status: 'voided', time: '11:30 AM', guestCount: 2 },
];

interface BillsListProps {
  onBillSelect: (bill: Bill) => void;
}

const BillsList: React.FC<BillsListProps> = ({ onBillSelect }) => {
  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search bills by table or order #..."
            className="w-full h-12 pl-12 pr-4 rounded-card bg-surface border border-border focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Settled'].map(filter => (
            <button
              key={filter}
              className={`px-6 h-12 rounded-card font-medium border transition-colors ${
                filter === 'All' 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-surface text-text-secondary border-border hover:border-primary-light'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockBills.map(bill => (
          <button
            key={bill.id}
            onClick={() => onBillSelect(bill)}
            className="card p-0 overflow-hidden text-left hover:border-primary-light transition-all active:scale-[0.98]"
          >
            <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-pale text-primary flex items-center justify-center font-bold">
                  {bill.table}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary">{bill.orderNumber}</h3>
                  <p className="text-xs text-text-secondary">{bill.time} · {bill.guestCount} Guests</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                bill.status === 'active' ? 'bg-info/10 text-info' :
                bill.status === 'settled' ? 'bg-success/10 text-success' :
                'bg-error/10 text-error'
              }`}>
                {bill.status}
              </div>
            </div>
            <div className="p-4 flex items-center justify-between bg-bg/30">
              <div>
                <p className="text-xs text-text-secondary mb-1">Amount Due</p>
                <p className="text-xl font-bold text-primary font-mono">KES {bill.total.toLocaleString()}</p>
              </div>
              <ChevronRight className="text-text-secondary" size={24} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BillsList;
