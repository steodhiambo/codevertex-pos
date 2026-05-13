import React, { useState, useEffect } from 'react';
import { Receipt, Search, Loader2, ChefHat, CheckCircle2, DollarSign, CreditCard, Ban } from 'lucide-react';
import { orderApi, getWsUrl } from '../lib/api';

interface Bill {
  id: string;
  table_id: string;
  table_name?: string;
  total: number;
  status: string;
  created_at: string;
  guest_count: number;
}

interface BillsListProps {
  onBillSelect: (bill: any) => void;
  onBillVoid?: (bill: any) => void;
  canVoid?: boolean;
}

const BillsList: React.FC<BillsListProps> = ({ onBillSelect, onBillVoid, canVoid = false }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Open' | 'Ready' | 'Settled'>('Open');
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
  const readyBills = openBills.filter(b => b.status === 'ready');
  const settledBills = bills.filter(b => b.status === 'paid');
  const todayRevenue = settledBills.reduce((s, b) => s + Number(b.total), 0);

  const pool =
    filter === 'Open' ? openBills :
    filter === 'Ready' ? readyBills :
    settledBills;

  const filteredBills = pool.filter(bill => {
    const q = searchQuery.toLowerCase();
    return (
      (bill.table_name || '').toLowerCase().includes(q) ||
      bill.table_id.toLowerCase().includes(q) ||
      bill.id.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Bills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <ChefHat size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Open Bills</p>
            <p className="text-2xl font-black text-text-primary font-mono">{openBills.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Ready to Settle</p>
            <p className="text-2xl font-black text-text-primary font-mono">{readyBills.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-pale text-primary flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Today Revenue</p>
            <p className="text-2xl font-black text-text-primary font-mono">KES {todayRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
          <input
            type="text"
            placeholder="Search bills by table or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-card bg-surface border border-border focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {(['Open', 'Ready', 'Settled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 h-12 rounded-card font-medium border transition-all ${
                filter === f
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-text-secondary border-border hover:border-primary-light'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBills.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-surface rounded-card border-2 border-dashed border-border text-text-secondary opacity-50">
            <Receipt size={48} className="mx-auto mb-4" />
            <p className="font-bold">No bills in this view</p>
          </div>
        ) : (
          filteredBills.map(bill => {
            const isSettled = bill.status === 'paid';
            return (
              <div
                key={bill.id}
                className="card p-0 overflow-hidden hover:border-primary-light transition-all"
              >
                <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-pale text-primary flex items-center justify-center font-bold">
                      {bill.table_name || bill.table_id.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">Order #{bill.id.slice(0, 4).toUpperCase()}</h3>
                      <p className="text-xs text-text-secondary">
                        {new Date(bill.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {bill.guest_count} Guests
                      </p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    bill.status === 'pending' ? 'bg-info/10 text-info' :
                    bill.status === 'cooking' ? 'bg-warning/10 text-warning' :
                    bill.status === 'ready' ? 'bg-success/10 text-success' :
                    bill.status === 'paid' ? 'bg-primary/10 text-primary' :
                    'bg-error/10 text-error'
                  }`}>
                    {bill.status}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between bg-bg/30">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">{isSettled ? 'Paid' : 'Amount Due'}</p>
                    <p className="text-xl font-bold text-primary font-mono">KES {Number(bill.total).toLocaleString()}</p>
                  </div>
                  {!isSettled && (
                    <div className="flex gap-2">
                      {canVoid && onBillVoid && (
                        <button
                          onClick={() => onBillVoid(bill)}
                          className="h-11 px-3 rounded-xl bg-surface border border-error/30 text-error font-black uppercase tracking-wider text-xs hover:bg-error/5 transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Ban size={14} />
                          Void
                        </button>
                      )}
                      <button
                        onClick={() => onBillSelect(bill)}
                        className="h-11 px-5 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        Settle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BillsList;
