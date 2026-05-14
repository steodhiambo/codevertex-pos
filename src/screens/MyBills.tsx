import React, { useEffect, useState } from 'react';
import { Receipt, ChevronRight, Loader2, CheckCircle2, XCircle, ChefHat, Calendar, Search, Grid, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
};

const MyBills: React.FC<MyBillsProps> = ({ waiterId }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Settled' | 'Voided'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredBills = bills.filter(b => {
    const label = statusLabel(b.status);
    const matchesFilter = filter === 'All' || label === filter;
    const matchesSearch = b.table_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen -mt-20">
        <Loader2 className="animate-spin text-primary" size={64} />
        <p className="mt-6 font-heading font-black text-xl text-primary animate-pulse tracking-widest uppercase">
          Fetching Bills
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Receipt size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Transaction Log</span>
          </div>
          <h2 className="text-4xl font-black text-text-primary tracking-tighter">
            My <span className="text-primary">Bills</span>
          </h2>
        </div>

        <div className="flex items-center gap-3 bg-white border border-border/40 px-4 py-2 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-black text-text-primary uppercase tracking-tight">Today</span>
        </div>
      </div>

      {/* Modern Summary Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-info/5 border-2 border-info/10 p-6 rounded-[2.5rem] relative overflow-hidden group transition-all"
        >
          <div className="absolute -right-4 -top-4 text-info opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
            <ChefHat size={120} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-info mb-4">Active Orders</span>
            <span className="text-4xl font-black text-text-primary font-mono tracking-tighter leading-none mb-2">{activeCount}</span>
            <span className="text-xs font-bold text-text-secondary opacity-60">Pending settlement</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-success/5 border-2 border-success/10 p-6 rounded-[2.5rem] relative overflow-hidden group transition-all"
        >
          <div className="absolute -right-4 -top-4 text-success opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
            <CheckCircle2 size={120} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-success mb-4">Settled Today</span>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-text-primary font-mono tracking-tighter leading-none">{settledBills.length}</span>
              <span className="text-xs font-black text-success uppercase tracking-widest leading-none">Bills</span>
            </div>
            <span className="text-sm font-black text-text-primary font-mono tracking-tighter">
              <span className="text-[10px] mr-0.5 opacity-40">KES</span>
              {settledTotal.toLocaleString()}
            </span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-error/5 border-2 border-error/10 p-6 rounded-[2.5rem] relative overflow-hidden group transition-all"
        >
          <div className="absolute -right-4 -top-4 text-error opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
            <XCircle size={120} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-error mb-4">Voided</span>
            <span className="text-4xl font-black text-text-primary font-mono tracking-tighter leading-none mb-2">{voidedCount}</span>
            <span className="text-xs font-bold text-text-secondary opacity-60">Cancelled transactions</span>
          </div>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all" size={20} />
          <input 
            type="text" 
            placeholder="Search by table or bill ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-6 bg-white border border-border/40 rounded-[1.5rem] focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold shadow-sm"
          />
        </div>
        
        <div className="flex gap-1.5 p-1.5 bg-surface/50 border border-border/40 rounded-[2rem] shadow-inner w-full md:w-auto">
          {(['All', 'Active', 'Settled', 'Voided'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                filter === f
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'text-text-secondary hover:text-primary hover:bg-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bill Log - Precision Design */}
      <div className="grid grid-cols-1 gap-4 pb-20">
        <AnimatePresence mode="popLayout">
          {filteredBills.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-border/60 text-text-secondary opacity-30 px-12"
            >
              <Receipt size={64} className="mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">No Records Found</h3>
              <p className="text-sm font-medium">Try adjusting your filters or search query</p>
            </motion.div>
          ) : (
            filteredBills.map((bill, idx) => {
              const label = statusLabel(bill.status);
              return (
                <motion.div 
                  layout
                  key={bill.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group relative bg-white rounded-[2rem] p-6 border border-border/40 shadow-sm hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    label === 'Active' ? 'bg-info' : label === 'Settled' ? 'bg-success' : 'bg-error'
                  }`} />

                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-bg border border-border/40 flex flex-col items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                      <Receipt size={24} className="text-text-secondary group-hover:text-primary transition-colors" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-xl text-text-primary tracking-tighter">#{bill.id.slice(0, 4).toUpperCase()}</h3>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          label === 'Active' ? 'bg-info/10 text-info' :
                          label === 'Settled' ? 'bg-success/10 text-success' :
                          'bg-error/10 text-error'
                        }`}>
                          {label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Grid size={12} className="opacity-40" />
                          <span className="text-xs font-black uppercase tracking-tight">Table {bill.table_name || bill.table_id.slice(0, 4)}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="opacity-40" />
                          <span className="text-xs font-black uppercase tracking-tight">{bill.guest_count} Guest{bill.guest_count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <div className="flex items-center gap-1.5 text-primary">
                          <span className="text-xs font-black uppercase tracking-tight">{timeAgo(bill.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-10 border-t md:border-t-0 pt-4 md:pt-0 border-dashed border-border/60">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Final Amount</p>
                      <p className="text-2xl font-black text-primary font-mono tracking-tighter">
                        <span className="text-xs mr-0.5 opacity-50 font-heading">KES</span>
                        {Number(bill.total).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-bg flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 transition-all duration-500">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MyBills;
