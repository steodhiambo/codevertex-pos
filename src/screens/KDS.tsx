import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Play, Bell, Loader2, Utensils, Coffee } from 'lucide-react';
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

interface KDSProps {
  type: 'kitchen' | 'bar';
}

const KDS: React.FC<KDSProps> = ({ type }) => {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const isActive = (s: string) => s !== 'paid' && s !== 'voided';

  // Only show orders that have at least one item matching this display's destination
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
        if (index === -1) {
          return relevant ? [updatedOrder, ...prev] : prev;
        }
        if (!relevant) {
          return prev.filter(o => o.id !== updatedOrder.id);
        }
        const newOrders = [...prev];
        newOrders[index] = updatedOrder;
        return newOrders;
      });
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const getElapsedTime = (startTime: string) => {
    const mins = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
    return mins;
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, status);
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const toggleItemCooked = async (itemId: string, currentStatus: boolean) => {
    try {
      await orderApi.toggleItem(itemId, !currentStatus);
    } catch (error) {
      alert('Failed to update item status');
    }
  };

  const startAllItems = async (order: KDSOrder) => {
    // Mark order as cooking; per-item "cooked" stays false until staff marks done
    if (order.status === 'pending') {
      await updateOrderStatus(order.id, 'cooking');
    }
  };

  const markAllDone = async (order: KDSOrder) => {
    const pendingItems = order.items.filter(
      i => (i.production_area || 'kitchen') === type && !i.is_cooked
    );
    await Promise.all(pendingItems.map(i => orderApi.toggleItem(i.id, true)));
  };

  const notifyWaiter = async (order: KDSOrder) => {
    await updateOrderStatus(order.id, 'ready');
  };

  const getStatusColor = (status: KDSOrder['status'], elapsed: number) => {
    if (status === 'ready') return 'border-success bg-success/5';
    if (elapsed >= 15) return 'border-error bg-error/5 animate-pulse';
    if (status === 'cooking') return 'border-warning bg-warning/5';
    return 'border-new bg-new/5';
  };

  const getStatusLabel = (status: KDSOrder['status'], elapsed: number) => {
    if (status === 'ready') return { label: 'READY', color: 'bg-success' };
    if (elapsed >= 15) return { label: 'URGENT', color: 'bg-error' };
    if (status === 'cooking') return { label: 'COOKING', color: 'bg-warning' };
    return { label: 'NEW', color: 'bg-new' };
  };

  const DestIcon = type === 'bar' ? Coffee : Utensils;
  const headerLabel = type === 'bar' ? 'Bar Display' : 'Kitchen Display';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading {headerLabel}...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
      {orders.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center h-64 text-text-secondary bg-surface rounded-card border border-dashed border-border">
          <DestIcon size={48} className="mb-4 opacity-20" />
          <p className="font-bold">No active orders for {headerLabel}</p>
        </div>
      ) : (
        orders.map(order => {
          const elapsed = getElapsedTime(order.created_at);
          const borderColor = getStatusColor(order.status, elapsed);
          const statusInfo = getStatusLabel(order.status, elapsed);
          const isUrgent = elapsed >= 15;
          // Only items destined for THIS display
          const myItems = order.items.filter(i => (i.production_area || 'kitchen') === type);
          const allDone = myItems.length > 0 && myItems.every(i => i.is_cooked);

          return (
            <div
              key={order.id}
              className={`card flex flex-col p-0 border-t-8 shadow-xl ${borderColor} transition-all duration-300`}
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <h3 className="font-black text-lg text-text-primary tracking-tighter">Order #{order.id.slice(0, 4).toUpperCase()}</h3>
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">
                    Table {order.table_name || order.table_id.slice(0, 4)}
                  </p>
                </div>
                <div className={`flex flex-col items-end gap-1 font-mono font-black ${isUrgent ? 'text-error' : 'text-text-secondary'}`}>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span className="text-xl">{elapsed}m</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 p-4 space-y-2">
                {myItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItemCooked(item.id, item.is_cooked)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      item.is_cooked
                        ? 'bg-success/5 border-success/20 text-success opacity-50'
                        : 'bg-bg border-border hover:border-primary-light'
                    }`}
                  >
                    <div className="flex-1 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className={`font-black uppercase tracking-tight ${item.is_cooked ? 'line-through' : ''}`}>
                          {item.name || 'Menu Item'}
                        </span>
                        {item.notes && (
                          <span className="text-[10px] text-text-secondary font-bold italic">"{item.notes}"</span>
                        )}
                      </div>
                      <span className="text-lg font-black bg-white px-3 py-1 rounded-lg border-2 border-border shadow-sm">
                        x{item.quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer Action */}
              <div className="p-4 bg-bg/50 border-t border-border space-y-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => startAllItems(order)}
                    className="w-full h-14 rounded-xl bg-new text-white font-black uppercase tracking-widest hover:bg-yellow-600 shadow-lg shadow-new/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play size={20} />
                    Start All Items
                  </button>
                )}
                {order.status === 'cooking' && !allDone && (
                  <button
                    onClick={() => markAllDone(order)}
                    className="w-full h-14 rounded-xl bg-success text-white font-black uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-success/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={20} />
                    Mark All Done
                  </button>
                )}
                {(order.status === 'cooking' && allDone) || order.status === 'ready' ? (
                  <button
                    onClick={() => notifyWaiter(order)}
                    className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Bell size={20} />
                    Notify Waiter — Order Ready
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default KDS;
