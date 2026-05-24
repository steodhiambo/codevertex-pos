import React, { useState, useEffect } from 'react';
import { Loader2, Play, Check, Bell } from 'lucide-react';
import { orderApi, getWsUrl } from '../lib/api';

interface KDSItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  is_cooked: boolean;
  name?: string;
  notes?: string;
  production_area?: 'kitchen' | 'bar';
}

interface KDSOrder {
  id: string;
  table_id: string;
  table_name?: string;
  status: 'pending' | 'cooking' | 'ready' | 'paid' | 'voided';
  created_at: string;
  total: number;
  items: KDSItem[];
}

interface KDSProps { type: 'kitchen' | 'bar'; }

const timeNow = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const KDS: React.FC<KDSProps> = ({ type }) => {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const isActive = (s: string) => s !== 'paid' && s !== 'voided';
  const matchesDestination = (order: KDSOrder) =>
    order.items.some(i => (i.production_area || 'kitchen') === type);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getAll();
      setOrders(data.filter((o: KDSOrder) => isActive(o.status) && matchesDestination(o)));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const ws = new WebSocket(getWsUrl('/kds'));
    ws.onmessage = (event) => {
      const updatedOrder: KDSOrder = JSON.parse(event.data);
      setOrders(prev => {
        const index = prev.findIndex(o => o.id === updatedOrder.id);
        const relevant = isActive(updatedOrder.status) && matchesDestination(updatedOrder);
        if (index === -1) return relevant ? [updatedOrder, ...prev] : prev;
        if (!relevant) return prev.filter(o => o.id !== updatedOrder.id);
        const newOrders = [...prev];
        newOrders[index] = updatedOrder;
        return newOrders;
      });
    };
    return () => ws.close();
  }, [type]);

  const updateStatus = async (orderId: string, status: string) => {
    try { await orderApi.updateStatus(orderId, status); } catch (e) { console.error(e); }
  };

  const toggleItem = async (itemId: string, cooked: boolean) => {
    try { await orderApi.toggleItem(itemId, cooked); } catch (e) { console.error(e); }
  };

  const headerIcon = type === 'bar' ? '🍺' : '🍳';
  const headerLabel = type === 'bar' ? 'Bar Display' : 'Kitchen Display';
  const emptyIcon = type === 'bar' ? '🍹' : '👨‍🍳';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading {headerLabel}...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface border-b border-border flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-base font-black text-text-primary font-heading">{headerIcon} {headerLabel}</h2>
          <p className="text-[10px] text-text-secondary font-medium">{orders.length} active</p>
        </div>
        <span className="text-sm font-bold font-mono text-text-primary">{timeNow()}</span>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-2">{emptyIcon}</div>
            <p className="text-sm font-medium text-text-secondary">All clear!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {orders.map(o => {
              const el = Math.round((Date.now() - new Date(o.created_at).getTime()) / 60000);
              const allReady = o.items.filter(i => (i.production_area || 'kitchen') === type).every(i => i.is_cooked);
              const someCooking = o.items.filter(i => (i.production_area || 'kitchen') === type).some(i => !i.is_cooked && o.status === 'cooking');
              const borderColor = allReady ? '#10B981' : o.status === 'pending' ? '#F59E0B' : '#F97316';
              const headerBg = allReady ? '#ECFDF5' : o.status === 'pending' ? '#FFFBEB' : '#FFF7ED';
              const statusLabel = o.status === 'pending' ? 'NEW' : allReady ? 'READY' : 'COOKING';
              const myItems = o.items.filter(i => (i.production_area || 'kitchen') === type);

              return (
                <div
                  key={o.id}
                  className="bg-surface rounded-xl border-2 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  style={{ borderColor }}
                >
                  {/* Card Header */}
                  <div className="px-3 py-2 flex justify-between items-center" style={{ background: headerBg }}>
                    <div>
                      <span className="text-sm font-black text-text-primary">{o.table_name || o.table_id.slice(0, 4)}</span>
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded text-white ml-1.5"
                        style={{ background: borderColor }}
                      >
                        {statusLabel}
                      </span>
                      <div className="text-[9px] text-text-secondary font-medium">Order #{o.id.slice(0, 4).toUpperCase()}</div>
                    </div>
                    <span className={`text-base font-black font-mono ${
                      el > 15 ? 'text-error' : el > 10 ? 'text-orange-500' : el > 5 ? 'text-warning' : 'text-text-primary'
                    }`}>{el}m</span>
                  </div>

                  {/* Items */}
                  {myItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 px-3 py-2 ${idx < myItems.length - 1 ? 'border-b border-border/50' : ''}`}
                    >
                      <span className={`flex-1 text-xs font-semibold ${item.is_cooked ? 'text-success line-through' : 'text-text-primary'}`}>
                        {item.quantity}x {item.name || 'Item'}
                        {item.notes && <span className="text-text-secondary italic ml-1">"{item.notes}"</span>}
                      </span>
                      {!item.is_cooked && o.status === 'pending' && (
                        <button
                          onClick={() => toggleItem(item.id, false)}
                          className="px-2 py-1 rounded-md bg-orange-50 text-orange-600 text-[9px] font-bold hover:bg-orange-100 transition-colors flex items-center gap-1"
                        >
                          <Play size={10} /> Start
                        </button>
                      )}
                      {!item.is_cooked && o.status === 'cooking' && (
                        <button
                          onClick={() => toggleItem(item.id, true)}
                          className="px-2 py-1 rounded-md bg-success/10 text-success text-[9px] font-bold hover:bg-success/20 transition-colors flex items-center gap-1"
                        >
                          <Check size={10} /> Done
                        </button>
                      )}
                      {item.is_cooked && <Check size={14} className="text-success" />}
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="px-3 py-2 space-y-1.5">
                    {o.status === 'pending' && (
                      <button
                        onClick={async () => { await updateStatus(o.id, 'cooking'); }}
                        className="w-full h-9 rounded-lg bg-warning text-white text-xs font-bold hover:bg-amber-600 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <Play size={14} /> Start All Items
                      </button>
                    )}
                    {someCooking && !allReady && o.status === 'cooking' && (
                      <button
                        onClick={async () => { await Promise.all(myItems.filter(i => !i.is_cooked).map(i => toggleItem(i.id, true))); }}
                        className="w-full h-9 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <Check size={14} /> Mark All Done
                      </button>
                    )}
                    {(allReady || o.status === 'ready') && (
                      <button
                        onClick={() => updateStatus(o.id, 'ready')}
                        className="w-full h-10 rounded-lg bg-success text-white text-sm font-black hover:bg-emerald-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-success/30"
                      >
                        <Bell size={16} /> NOTIFY WAITER — ORDER READY
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KDS;
