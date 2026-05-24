import React, { useState, useEffect } from 'react';
import { Loader2, Receipt, Search } from 'lucide-react';
import { orderApi, getWsUrl } from '../lib/api';

interface Bill {
  id: string;
  table_id: string;
  table_name?: string;
  total: number;
  status: string;
  created_at: string;
  guest_count: number;
  items?: Array<{ name: string; quantity: number; unit_price: number }>;
}

interface BillsListProps {
  onBillSelect: (bill: any) => void;
  onBillVoid?: (bill: any) => void;
  canVoid?: boolean;
}

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

const BillsList: React.FC<BillsListProps> = ({ onBillSelect, onBillVoid, canVoid = false }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBills = async () => {
    try {
      const data = await orderApi.getAll();
      setBills(data);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    const ws = new WebSocket(getWsUrl('/kds'));
    ws.onmessage = () => fetchBills();
    return () => ws.close();
  }, []);

  const openBills = bills.filter(b => b.status !== 'paid' && b.status !== 'voided');
  const settledBills = bills.filter(b => b.status === 'paid');
  const todayRevenue = settledBills.reduce((s, b) => s + Number(b.total), 0);

  const filteredBills = openBills.filter(b =>
    !searchQuery ||
    (b.table_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Bills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-text-primary font-heading">💰 Bills</h2>
          <p className="text-xs text-text-secondary font-medium">{bills.length} total · {fmt(todayRevenue)} settled today</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by table or order..."
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface border border-border text-xs outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Summary badges */}
      <div className="flex gap-2">
        {[
          { label: 'Open', value: openBills.length, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Settled', value: settledBills.length, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Revenue', value: fmt(todayRevenue), color: 'text-primary', bg: 'bg-primary-pale' },
        ].map((s, i) => (
          <div key={i} className={`flex-1 ${s.bg} rounded-xl p-3 text-center border border-border/50`}>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">{s.label}</div>
            <div className={`text-lg font-black ${s.color} font-heading mt-0.5`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bill Cards */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-16 bg-surface/50 rounded-3xl border-2 border-dashed border-border/60">
          <Receipt size={40} className="mx-auto mb-3 text-text-secondary/30" />
          <p className="text-sm font-bold text-text-secondary/50">{searchQuery ? 'No bills match your search.' : 'No open bills'}</p>
          <p className="text-xs text-text-secondary/30 mt-1">Open bills will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBills.map(bill => (
            <div key={bill.id} className="card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-black text-text-primary">
                    {bill.table_name || `Table ${bill.table_id.slice(0, 4)}`}
                  </span>
                  <span className="text-[10px] text-text-secondary font-medium ml-2">
                    · Order #{bill.id.slice(0, 4).toUpperCase()}
                  </span>
                  <div className="text-[10px] text-text-secondary font-medium mt-0.5">
                    {bill.guest_count}p · {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className="text-base font-black text-primary font-heading">{fmt(Number(bill.total))}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onBillSelect(bill)}
                  className="flex-1 h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-all active:scale-[0.98]"
                >
                  Settle — {fmt(Number(bill.total))}
                </button>
                {canVoid && onBillVoid && (
                  <button
                    onClick={() => onBillVoid(bill)}
                    className="h-10 px-4 rounded-xl bg-error text-white text-xs font-bold hover:bg-red-600 transition-all active:scale-[0.98]"
                  >
                    Void
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillsList;
