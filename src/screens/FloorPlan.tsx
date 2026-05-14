import React, { useState, useEffect } from 'react';
import { Users, Receipt, Loader2, RefreshCcw, Search, Grid, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GuestCountModal from '../components/GuestCountModal';
import { tableApi, orderApi, getWsUrl } from '../lib/api';

interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'available' | 'occupied';
  zone?: string;
  current_order?: {
    id: string;
    total: number;
    status: string;
  };
}

interface FloorPlanProps {
  onTableSelect: (tableId: string, tableName: string, guestCount: number, existingOrderId?: string) => void;
}

const deriveZone = (name: string): 'Indoor' | 'Outdoor' | 'VIP' | 'Bar' => {
  if (name.startsWith('V')) return 'VIP';
  if (name.startsWith('B')) return 'Bar';
  if (name.startsWith('T')) {
    const num = parseInt(name.slice(1), 10);
    if (!isNaN(num) && num >= 7) return 'Outdoor';
    return 'Indoor';
  }
  return 'Indoor';
};

const FloorPlan: React.FC<FloorPlanProps> = ({ onTableSelect }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const zones = ['All', 'Indoor', 'Outdoor', 'VIP', 'Bar'];

  const fetchTables = async () => {
    try {
      const data = await tableApi.getAll();
      const enriched = data.map((t: Table) => ({ ...t, zone: t.zone || deriveZone(t.name) }));
      setTables(enriched);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const ws = new WebSocket(getWsUrl('/kds'));
    ws.onmessage = () => fetchTables();
    return () => ws.close();
  }, []);

  const filteredTables = tables.filter(t => 
    (selectedZone === 'All' || t.zone === selectedZone) &&
    (t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTableClick = async (table: Table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setIsGuestModalOpen(true);
    } else {
      // Occupied: fetch existing order so we can open Add-to-Bill mode
      try {
        const existingOrder = await orderApi.getByTable(table.id);
        onTableSelect(table.id, table.name, existingOrder.guest_count, existingOrder.id);
      } catch {
        // Fallback: open fresh order entry if no active order found
        onTableSelect(table.id, table.name, 1);
      }
    }
  };

  const handleGuestConfirm = (count: number) => {
    setIsGuestModalOpen(false);
    if (selectedTable) {
      onTableSelect(selectedTable.id, selectedTable.name, count);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen -mt-20">
        <div className="relative">
          <Loader2 className="animate-spin text-primary" size={64} />
          <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse" />
        </div>
        <p className="mt-6 font-heading font-black text-xl text-primary animate-pulse tracking-widest uppercase">
          Initializing Floor
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Grid size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">Live Floor Map</span>
          </div>
          <h2 className="text-4xl font-black text-text-primary tracking-tighter">
            Table <span className="text-primary">Management</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Find table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 h-12 w-48 md:w-64 rounded-2xl bg-surface/50 border border-border/50 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-sm shadow-sm"
            />
          </div>
          <button 
            onClick={fetchTables}
            className="p-3 bg-surface border border-border/50 rounded-2xl text-text-secondary hover:text-primary hover:border-primary-light transition-all active:scale-90 shadow-sm"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      {/* Modern Filter Rail */}
      <div className="flex gap-2 p-1.5 bg-surface/50 backdrop-blur-sm border border-border/40 rounded-[2rem] w-fit shadow-inner">
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`px-8 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 font-bold text-sm tracking-tight ${
              selectedZone === zone 
                ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                : 'text-text-secondary hover:text-primary hover:bg-white/80'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Grid of Precision Table Cards */}
      <motion.div 
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredTables.map((table, idx) => {
            const isOccupied = table.status === 'occupied';
            const accentColor = isOccupied ? 'rgba(59, 130, 246, 1)' : 'rgba(16, 185, 129, 1)';
            
            return (
              <motion.button
                layout
                key={table.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => handleTableClick(table)}
                className={`
                  group relative p-6 flex flex-col items-center justify-between min-h-[220px] rounded-[2.5rem] 
                  transition-all duration-500 border-2 overflow-hidden
                  ${isOccupied 
                    ? 'bg-info/5 border-info/20 shadow-xl shadow-info/5 hover:border-info/40' 
                    : 'bg-success/5 border-success/20 shadow-xl shadow-success/5 hover:border-success/40'
                  }
                `}
              >
                {/* Visual Accent Layer */}
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity"
                  style={{ background: `radial-gradient(circle at center, ${accentColor}, transparent)` }}
                />

                <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                  isOccupied ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
                }`}>
                  <MapPin size={10} />
                  {table.zone || 'Main'}
                </div>
                
                <div className="flex flex-col items-center justify-center">
                  <div className={`text-5xl font-black mb-2 tracking-tighter transition-transform duration-500 group-hover:scale-110 ${
                    isOccupied ? 'text-info' : 'text-success'
                  }`}>
                    {table.name}
                  </div>

                  <div className="flex items-center gap-2 text-text-secondary bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-2xl shadow-sm border border-white/50 group-hover:shadow-md transition-all">
                    <Users size={14} className="text-text-secondary/60" />
                    <span className="text-xs font-black font-mono">{table.seats}</span>
                  </div>
                </div>

                <div className="mt-6 w-full">
                  {isOccupied && table.current_order ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white/90 rounded-2xl border border-info/10 flex flex-col items-center shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-info/60 mb-1 uppercase tracking-widest">
                        <Receipt size={10} />
                        {table.current_order.status}
                      </div>
                      <div className="text-lg font-black text-text-primary font-mono tracking-tighter">
                        <span className="text-[10px] mr-0.5 opacity-50">KES</span>
                        {Number(table.current_order.total).toLocaleString()}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-success text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-success/20 group-hover:bg-success-dark transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Available
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <GuestCountModal 
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onConfirm={handleGuestConfirm}
        tableName={selectedTable?.name || ''}
      />
    </div>
  );
};

export default FloorPlan;
