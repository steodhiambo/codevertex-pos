import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, Users, ChevronRight, Plus, Receipt, Clock, Loader2, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { orderApi, getWsUrl } from '../lib/api';

interface Bill {
  id: string;
  table_name?: string;
  table_id: string;
  guest_count: number;
  total: number;
  subtotal: number;
  status: string;
  created_at: string;
  items: { name?: string; quantity: number; unit_price: number }[];
}

interface WaiterDashboardProps {
  waiterId: string;
  waiterName: string;
  onGoToTables: () => void;
  onGoToMyBills: () => void;
}

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
};

const statusLabel = (status: string) => {
  if (status === 'paid') return 'Settled';
  if (status === 'voided') return 'Voided';
  return 'Active';
};

const WaiterDashboard: React.FC<WaiterDashboardProps> = ({
  waiterId,
  waiterName,
  onGoToTables,
  onGoToMyBills,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      const data = await orderApi.getByWaiter(waiterId);
      setBills(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
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

  // KPI calculations
  const activeBills = bills.filter(b => statusLabel(b.status) === 'Active');
  const settledBills = bills.filter(b => statusLabel(b.status) === 'Settled');
  const salesToday = settledBills.reduce((s, b) => s + Number(b.total), 0);
  const avgTableValue = activeBills.length > 0
    ? activeBills.reduce((s, b) => s + Number(b.total), 0) / activeBills.length
    : 0;
  const recentBills = [...bills].slice(0, 6);

  const firstName = waiterName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen -mt-20">
        <Loader2 className="animate-spin text-primary" size={64} />
        <p className="mt-6 font-heading font-black text-xl text-primary animate-pulse tracking-widest uppercase">
          Loading Dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Your Shift Overview</span>
          </div>
          <h2 className="text-4xl font-black text-text-primary tracking-tighter">
            {greeting}, <span className="text-primary">{firstName}</span> 👋
          </h2>
          <p className="text-sm font-medium text-text-secondary opacity-60">
            Here's a live summary of your orders and performance today.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-border/40 px-5 py-3 rounded-2xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-success animate-ping" />
          <span className="text-sm font-black text-text-primary uppercase tracking-tight">Shift Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Active Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-info/5 border-2 border-info/15 p-7 rounded-[2.5rem] relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-6 -top-6 text-info opacity-[0.07] group-hover:scale-110 group-hover:opacity-[0.12] transition-all duration-500">
            <ShoppingBag size={130} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-info mb-5">Active Orders</span>
            <span className="text-5xl font-black text-text-primary font-mono tracking-tighter leading-none mb-2">
              {activeBills.length}
            </span>
            <span className="text-xs font-bold text-text-secondary opacity-50">Tables currently served</span>
          </div>
        </motion.div>

        {/* Sales Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-success/5 border-2 border-success/15 p-7 rounded-[2.5rem] relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-6 -top-6 text-success opacity-[0.07] group-hover:scale-110 group-hover:opacity-[0.12] transition-all duration-500">
            <TrendingUp size={130} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-success mb-5">My Sales Today</span>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xs font-black text-success/60 font-mono">KES</span>
              <span className="text-5xl font-black text-text-primary font-mono tracking-tighter leading-none">
                {salesToday.toLocaleString()}
              </span>
            </div>
            <span className="text-xs font-bold text-text-secondary opacity-50">{settledBills.length} bill{settledBills.length !== 1 ? 's' : ''} settled</span>
          </div>
        </motion.div>

        {/* Avg Table Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-warning/5 border-2 border-warning/15 p-7 rounded-[2.5rem] relative overflow-hidden group cursor-default"
        >
          <div className="absolute -right-6 -top-6 text-warning opacity-[0.07] group-hover:scale-110 group-hover:opacity-[0.12] transition-all duration-500">
            <Users size={130} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-warning mb-5">Avg Table Value</span>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xs font-black text-warning/60 font-mono">KES</span>
              <span className="text-5xl font-black text-text-primary font-mono tracking-tighter leading-none">
                {avgTableValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="text-xs font-bold text-text-secondary opacity-50">Per active table</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToTables}
            className="group flex items-center justify-between p-6 bg-white border-2 border-primary/20 rounded-[2rem] shadow-sm hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-primary/10 rounded-[1.5rem] group-hover:bg-primary group-hover:text-white transition-all duration-300 text-primary">
                <Plus size={24} />
              </div>
              <div>
                <p className="font-black text-lg text-text-primary tracking-tighter">New Order</p>
                <p className="text-xs font-bold text-text-secondary opacity-50">Select a table & start</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoToMyBills}
            className="group flex items-center justify-between p-6 bg-white border-2 border-info/20 rounded-[2rem] shadow-sm hover:border-info hover:shadow-xl hover:shadow-info/10 transition-all duration-300 text-left"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-info/10 rounded-[1.5rem] group-hover:bg-info group-hover:text-white transition-all duration-300 text-info">
                <Receipt size={24} />
              </div>
              <div>
                <p className="font-black text-lg text-text-primary tracking-tighter">My Bills</p>
                <p className="text-xs font-bold text-text-secondary opacity-50">Review your transactions</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-text-secondary group-hover:text-info group-hover:translate-x-1 transition-all" />
          </motion.button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary">Recent Activity</h3>
          <button
            onClick={onGoToMyBills}
            className="text-xs font-black text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {recentBills.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-border/60 text-text-secondary opacity-30">
            <Zap size={48} className="mx-auto mb-4" />
            <h4 className="text-lg font-black uppercase tracking-tighter mb-1">No Activity Yet</h4>
            <p className="text-sm font-medium">Start a new order to get going!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBills.map((bill, idx) => {
              const label = statusLabel(bill.status);
              return (
                <motion.div
                  key={bill.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group relative flex items-center justify-between bg-white rounded-[1.75rem] px-6 py-5 border border-border/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Status accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-full ${
                    label === 'Active' ? 'bg-info' :
                    label === 'Settled' ? 'bg-success' : 'bg-error'
                  }`} />

                  <div className="flex items-center gap-5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm ${
                      label === 'Active' ? 'bg-info' :
                      label === 'Settled' ? 'bg-success' : 'bg-error/80'
                    }`}>
                      #{bill.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-text-primary tracking-tight">
                          {bill.table_name || `Table ${bill.table_id.slice(0, 4)}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          label === 'Active' ? 'bg-info/10 text-info' :
                          label === 'Settled' ? 'bg-success/10 text-success' :
                          'bg-error/10 text-error'
                        }`}>
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Users size={11} className="opacity-40" />
                          <span className="text-[11px] font-bold">{bill.guest_count} guest{bill.guest_count !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-border">·</span>
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="opacity-40" />
                          <span className="text-[11px] font-bold">{timeAgo(bill.created_at)}</span>
                        </div>
                        <span className="text-border">·</span>
                        <span className="text-[11px] font-bold">{bill.items?.length || 0} item{(bill.items?.length || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-xl font-black text-primary font-mono tracking-tighter">
                      <span className="text-[10px] mr-0.5 opacity-50">KES</span>
                      {Number(bill.total).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterDashboard;
