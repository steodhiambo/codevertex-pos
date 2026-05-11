import React, { useState, useEffect } from 'react';
import { Users, Receipt, Loader2 } from 'lucide-react';
import GuestCountModal from '../components/GuestCountModal';
import { tableApi } from '../lib/api';

interface Table {
  id: string;
  name: string;
  seats: number;
  status: 'available' | 'occupied';
  zone?: string;
}

interface FloorPlanProps {
  onTableSelect: (tableId: string, tableName: string, guestCount: number) => void;
}

const FloorPlan: React.FC<FloorPlanProps> = ({ onTableSelect }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  const zones = ['All', 'Main Hall', 'Terrace', 'VIP'];

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = await tableApi.getAll();
        setTables(data);
      } catch (error) {
        console.error('Failed to fetch tables:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const filteredTables = selectedZone === 'All' 
    ? tables 
    : tables.filter(t => t.zone === selectedZone);

  const handleTableClick = (table: Table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setIsGuestModalOpen(true);
    } else {
      onTableSelect(table.id, table.name, 1);
    }
  };

  const handleGuestConfirm = (count: number) => {
    console.log(`Starting order for ${selectedTable?.name} with ${count} guests`);
    setIsGuestModalOpen(false);
    if (selectedTable) {
      onTableSelect(selectedTable.id, selectedTable.name, count);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Floor Plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zone Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition-colors font-medium border ${
              selectedZone === zone 
                ? 'bg-primary text-white border-primary' 
                : 'bg-surface text-text-secondary border-border hover:border-primary-light'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {filteredTables.map(table => (
          <button
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`
              card relative p-6 flex flex-col items-center justify-center min-h-[180px] transition-all 
              hover:scale-105 active:scale-95 border-4
              ${table.status === 'occupied' 
                ? 'bg-info/5 border-info shadow-lg shadow-info/10' 
                : 'bg-success/5 border-success shadow-lg shadow-success/10'
              }
            `}
          >
            <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
              table.status === 'occupied' ? 'bg-info text-white' : 'bg-success text-white'
            }`}>
              {table.zone || 'Main'}
            </div>
            
            <div className={`text-4xl font-black mb-1 ${
              table.status === 'occupied' ? 'text-info' : 'text-success'
            }`}>
              {table.name}
            </div>

            <div className="flex items-center gap-1.5 text-text-secondary mb-4 bg-bg/50 px-3 py-1 rounded-full">
              <Users size={14} className="opacity-50" />
              <span className="text-xs font-bold">{table.seats}</span>
            </div>

            {table.status === 'occupied' && table.currentOrder ? (
              <div className="w-full mt-auto p-3 bg-white/80 rounded-xl border border-info/20 flex flex-col items-center shadow-sm">
                <div className="flex items-center gap-1 text-[10px] font-black text-info mb-1 uppercase tracking-tight">
                  <Receipt size={10} />
                  {table.currentOrder.orderNumber}
                </div>
                <div className="text-lg font-black text-text-primary font-mono">
                  KES {table.currentOrder.total.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="mt-auto py-2 px-4 rounded-lg bg-success text-white text-[10px] font-black uppercase tracking-widest animate-pulse">
                Seat Now
              </div>
            )}
          </button>
        ))}
      </div>

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
