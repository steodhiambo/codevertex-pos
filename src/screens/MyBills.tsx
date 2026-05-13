import React, { useEffect, useState } from 'react';
import { Receipt, ChevronRight, Loader2, CheckCircle2, XCircle, ChefHat } from 'lucide-react';
import { orderApi, getWsUrl } from '../lib/api';

interface Bill {
  id: string;
  table_id: string;
  table_name?: string;
  guest_count: number;
  total: number;
  status: string;
  created_at: string;
  items: any[];
}

interface MyBillsProps {
  waiterId: string;
}

const statusLabel = (status: string): 'Active' | 'Settled' | 'Voided' => {
  if (status === 'paid') return 'Settled';
  if (status === 'voided') return 'Voided';
  return 'Active';
};

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
};

const MyBills: React.FC<MyBillsProps> = ({ waiterId }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Settled' | 'Voided'>('All');

  const fetchBills = async () => {
    try {
      const data = waiterId
        ? await orderApi.getByWaiter(waiterId)
        : await orderApi.getAll();
      setBills(data);
    } catch (error) {
      console.error('Failed to fetch my bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    const ws = new WebSocket(getWsUrl('/kds'));
    ws.onmessage = () => fetchBills();
    return () => ws.close();
  }, [waiterId]);

  const activeCount = bills.filter(b => statusLabel(b.status) === 'Active').length;
  const settledBills = bills.filter(b => statusLabel(b.status) === 'Settled');
  const voidedCount = bills.filter(b => statusLabel(b.status) === 'Voided').length;
  const settledTotal = settledBills.reduce((s, b) => s + Number(b.total), 0);

  const filteredBills = filter === 'All' ? bills : bills.filter(b => statusLabel(b.status) === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading your bills...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">My Bills</h2>
        <div className="px-3 py-1 bg-primary-pale text-primary rounded-full text-sm font-bold">Today</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
            <ChefHat size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Active</p>
            <p className="text-2xl font-black text-text-primary font-mono">{activeCount}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Settled</p>
            <p className="text-2xl font-black text-text-primary font-mono">{settledBills.length}</p>
            <p className="text-[10px] text-text-secondary font-bold">KES {settledTotal.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Voided</p>
            <p className="text-2xl font-black text-text-primary font-mono">{voidedCount}</p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto">
        {(['All', 'Active', 'Settled', 'Voided'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 h-10 rounded-full font-medium border transition-all ${
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary-light'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bills list */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBills.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-card border-2 border-dashed border-border text-text-secondary opacity-50">
            <Receipt size={48} className="mx-auto mb-4" />
            <p className="font-bold">No bills in this view</p>
          </div>
        ) : (
          filteredBills.map(bill => {
            const label = statusLabel(bill.status);
            return (
              <div key={bill.id} className="card p-4 flex items-center justify-between hover:border-primary-light transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-text-secondary">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-text-primary">#{bill.id.slice(0, 4).toUpperCase()}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        label === 'Active' ? 'bg-info/10 text-info' :
                        label === 'Settled' ? 'bg-success/10 text-success' :
                        'bg-error/10 text-error'
                      }`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Table {bill.table_name || bill.table_id.slice(0, 4)} · {bill.guest_count} guest{bill.guest_count !== 1 ? 's' : ''} · {timeAgo(bill.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-text-secondary">Amount</p>
                    <p className="font-bold text-primary font-mono">KES {Number(bill.total).toLocaleString()}</p>
                  </div>
                  <ChevronRight className="text-text-secondary" size={20} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBills;
