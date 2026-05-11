import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Play, Bell, Loader2, Utensils } from 'lucide-react';
import { orderApi } from '../lib/api';

interface KDSOrder {
  id: string;
  orderNumber: string;
  table_id: string;
  status: 'pending' | 'cooking' | 'ready';
  created_at: string;
  items: {
    id: string;
    menu_item_id: string;
    quantity: number;
    done: boolean;
    name?: string;
  }[];
}

interface KDSProps {
  type: 'kitchen' | 'bar';
}

const KDS: React.FC<KDSProps> = ({ type }) => {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchOrders = async () => {
      try {
        const data = await orderApi.getAll();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // 2. WebSocket Connection
    const ws = new WebSocket('ws://localhost:8000/ws/kds');

    ws.onmessage = (event) => {
      const newOrder = JSON.parse(event.data);
      setOrders(prev => [newOrder, ...prev]);
    };

    return () => ws.close();
  }, []);

  const getElapsedTime = (startTime: string) => {
    const mins = Math.floor((Date.now() - new Date(startTime).getTime()) / 60000);
    return mins;
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

  const toggleItem = (orderId: string, itemIndex: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = [...o.items];
        newItems[itemIndex] = { ...newItems[itemIndex], done: !newItems[itemIndex].done };
        return { ...o, items: newItems };
      }
      return o;
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Kitchen Orders...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-6">
      {orders.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center h-64 text-text-secondary bg-surface rounded-card border border-dashed border-border">
          <Utensils size={48} className="mb-4 opacity-20" />
          <p className="font-bold">No active orders</p>
        </div>
      ) : (
        orders.map(order => {
          const elapsed = getElapsedTime(order.created_at);
          const borderColor = getStatusColor(order.status, elapsed);
          const statusInfo = getStatusLabel(order.status, elapsed);
          const isUrgent = elapsed >= 15;

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
                    <h3 className="font-black text-lg text-text-primary tracking-tighter">{order.orderNumber}</h3>
                  </div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Table {order.table_id}</p>
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
                {order.items.map((item, idx) => (
                  <div 
                    key={item.id}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      item.done 
                        ? 'bg-success/5 border-success/20 text-success opacity-50' 
                        : 'bg-bg border-border hover:border-primary-light'
                    }`}
                  >
                    <div className="flex-1 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className={`font-black uppercase tracking-tight ${item.done ? 'line-through' : ''}`}>
                          {item.name || 'Menu Item'}
                        </span>
                        {/* Mock notes if any */}
                        <span className="text-[10px] text-text-secondary font-bold">NO ONIONS</span>
                      </div>
                      <span className="text-lg font-black bg-white px-3 py-1 rounded-lg border-2 border-border shadow-sm">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Action */}
              <div className="p-4 bg-bg/50 border-t border-border">
                {order.status === 'pending' ? (
                  <button className="w-full h-14 rounded-xl bg-new text-white font-black uppercase tracking-widest hover:bg-yellow-600 shadow-lg shadow-new/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Play size={20} />
                    Start Prep
                  </button>
                ) : order.status === 'cooking' ? (
                  <button className="w-full h-14 rounded-xl bg-success text-white font-black uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-success/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} />
                    Complete
                  </button>
                ) : (
                  <button className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Bell size={20} />
                    Notify
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default KDS;
