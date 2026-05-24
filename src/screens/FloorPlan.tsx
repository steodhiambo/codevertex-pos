import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';
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
    order_no?: string;
    orderNo?: string;
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

const zones = ['All', 'Indoor', 'Outdoor', 'Bar'];

const FloorPlan: React.FC<FloorPlanProps> = ({ onTableSelect }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

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
    selectedZone === 'All' || t.zone === selectedZone
  );

  const handleTableClick = async (table: Table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setIsGuestModalOpen(true);
    } else {
      try {
        const existingOrder = await orderApi.getByTable(table.id);
        onTableSelect(table.id, table.name, existingOrder.guest_count, existingOrder.id);
      } catch {
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
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Tables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-text-primary font-heading">Floor Plan</h2>
        <button
          onClick={fetchTables}
          className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* Zone Filter */}
      <div className="flex gap-1.5">
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedZone === zone
                ? 'bg-primary text-white'
                : 'bg-white text-text-secondary border border-border hover:border-primary/30'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredTables.map(table => {
          const isAvailable = table.status === 'available';
          const accentColor = isAvailable ? '#10B981' : '#3B82F6';

          return (
            <div
              key={table.id}
              onClick={() => handleTableClick(table)}
              className="relative bg-white rounded-xl p-3 border-2 cursor-pointer transition-all hover:border-primary hover:-translate-y-0.5 overflow-hidden"
              style={{ borderColor: `${accentColor}20` }}
              onMouseEnter={e => { if (table.status === 'available' || table.current_order) { (e.currentTarget as HTMLElement).style.borderColor = '#6B2D8B'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}20`; }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-40"
                style={{ background: accentColor }}
              />

              {/* Table name + status dot */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black text-text-primary">{table.name}</span>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: accentColor }}
                />
              </div>

              {/* Seats + Zone */}
              <div className="text-[10px] text-text-secondary font-medium">
                {table.seats}s · {table.zone || 'Main'}
              </div>

              {/* Status-specific content */}
              {isAvailable ? (
                <div className="mt-2 py-1.5 text-center rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                  Seat guests
                </div>
              ) : table.current_order && (
                <div className="mt-2 space-y-1">
                  <div className="text-[10px] font-semibold" style={{ color: '#3B82F6' }}>
                    {table.current_order.order_no || table.current_order.orderNo || '#' + table.current_order.id.slice(0, 6)} · KES {Number(table.current_order.total).toLocaleString()}
                  </div>
                  <div className="py-1 text-center rounded" style={{ background: '#EFF6FF', color: '#3B82F6', fontSize: 9, fontWeight: 600 }}>
                    + Add to bill
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-secondary text-sm">
            No tables found in this zone.
          </div>
        )}
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
