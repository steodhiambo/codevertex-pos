import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, BedDouble, Utensils, Coffee, BarChart3, AlertTriangle, Download, Loader2, Flame } from 'lucide-react';
import { orderApi, tableApi, menuApi, getWsUrl } from '../lib/api';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number | string;
  production_area?: 'kitchen' | 'bar';
  name?: string;
}
interface OrderRow {
  id: string;
  table_id: string;
  status: string;
  total: number | string;
  created_at: string;
  items: OrderItem[];
}
interface TableRow { id: string; name: string; status: string; }
interface MenuRow { id: string; name: string; price: number | string; production_area?: 'kitchen' | 'bar'; }

const fmt = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
const isToday = (iso: string) => {
  const d = new Date(iso); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [o, t, m] = await Promise.all([orderApi.getAll(), tableApi.getAll(), menuApi.getAll()]);
      setOrders(o); setTables(t); setMenu(m);
    } catch (e) {
      console.error('Dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const ws = new WebSocket(getWsUrl('/kds'));
    ws.onmessage = () => refresh();
    return () => ws.close();
  }, []);

  const stats = useMemo(() => {
    const settled = orders.filter(o => o.status === 'paid');
    const settledToday = settled.filter(o => isToday(o.created_at));
    const num = (x: number | string) => Number(x) || 0;

    let foodRev = 0, barRev = 0;
    settledToday.forEach(o => o.items.forEach(i => {
      const line = num(i.unit_price) * i.quantity;
      if ((i.production_area || 'kitchen') === 'bar') barRev += line; else foodRev += line;
    }));
    const totalRev = foodRev + barRev;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const occRate = tables.length ? Math.round((occupied / tables.length) * 100) : 0;
    const avgOrder = settledToday.length ? Math.round(totalRev / settledToday.length) : 0;

    // Top sellers derived from settled order items
    const soldByItem = new Map<string, number>();
    settled.forEach(o => o.items.forEach(i => {
      soldByItem.set(i.menu_item_id, (soldByItem.get(i.menu_item_id) || 0) + i.quantity);
    }));
    const enriched = menu.map(m => ({ ...m, sold: soldByItem.get(m.id) || 0 }));
    const topFood = enriched.filter(m => (m.production_area || 'kitchen') === 'kitchen').sort((a, b) => b.sold - a.sold).slice(0, 5);
    const topDrinks = enriched.filter(m => m.production_area === 'bar').sort((a, b) => b.sold - a.sold).slice(0, 5);
    const maxSold = Math.max(1, ...enriched.map(m => m.sold));

    // Hourly revenue (8am - 3pm) for today
    const hours = [8, 9, 10, 11, 12, 13, 14, 15];
    const revByHour = hours.map(h => {
      const sum = settledToday
        .filter(o => new Date(o.created_at).getHours() === h)
        .reduce((s, o) => s + num(o.total), 0);
      return sum;
    });
    const maxR = Math.max(1, ...revByHour);

    return { settled, settledToday, foodRev, barRev, totalRev, occupied, occRate, avgOrder, topFood, topDrinks, maxSold, hours, revByHour, maxR };
  }, [orders, tables, menu]);

  const downloadReport = () => {
    const lines = [
      'Codevertex POS — Daily Report',
      new Date().toLocaleString(),
      '',
      `Total Orders Today: ${stats.settledToday.length}`,
      `Settled (All-Time): ${stats.settled.length}`,
      `Revenue Today: ${fmt(stats.totalRev)}`,
      `  Food: ${fmt(stats.foodRev)}`,
      `  Bar:  ${fmt(stats.barRev)}`,
      `Avg Order: ${fmt(stats.avgOrder)}`,
      `Tables Occupied: ${stats.occupied}/${tables.length} (${stats.occRate}%)`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pos-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Dashboard...</p>
      </div>
    );
  }

  const kpis = [
    { l: 'Total Revenue', v: fmt(stats.totalRev), Icon: DollarSign, tint: 'bg-success/10 text-success' },
    { l: 'Room Revenue', v: fmt(0), Icon: BedDouble, tint: 'bg-primary-pale text-primary' },
    { l: 'Food Revenue', v: fmt(stats.foodRev), Icon: Utensils, tint: 'bg-orange-500/10 text-orange-500' },
    { l: 'Bar Revenue', v: fmt(stats.barRev), Icon: Coffee, tint: 'bg-info/10 text-info' },
    { l: 'Occupancy', v: `${stats.occRate}%`, Icon: BarChart3, tint: stats.occRate > 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning' },
    { l: 'Orders Today', v: String(stats.settledToday.length), Icon: ShoppingBag, tint: 'bg-info/10 text-info' },
    { l: 'Avg Order', v: fmt(stats.avgOrder), Icon: TrendingUp, tint: 'bg-success/10 text-success' },
    { l: 'Low Stock', v: '0', Icon: AlertTriangle, tint: 'bg-success/10 text-success' },
  ];

  const split = [
    { l: 'Rooms', v: 0, c: 'bg-primary' },
    { l: 'Food', v: stats.foodRev, c: 'bg-orange-500' },
    { l: 'Drinks', v: stats.barRev, c: 'bg-info' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-text-primary tracking-tight">📊 Analytics Dashboard</h2>
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="h-11 px-5 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Download size={16} /> Download Report
        </button>
      </div>

      {/* KPI Grid (8 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${k.tint}`}>
              <k.Icon size={20} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">{k.l}</p>
            <h3 className="text-xl font-black text-text-primary font-mono">{k.v}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Today Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-text-primary">📈 Revenue Today</h3>
            <span className="text-sm font-black text-success font-mono">{fmt(stats.totalRev)}</span>
          </div>
          <div className="h-48 flex items-end gap-2">
            {stats.revByHour.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className="w-full bg-primary-pale rounded-t-lg group-hover:bg-primary-light transition-colors relative"
                  style={{ height: `${Math.max(2, (v / stats.maxR) * 100)}%` }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {fmt(v)}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-text-secondary">{stats.hours[i]}:00</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="card p-6">
          <h3 className="font-black text-text-primary mb-4">Revenue Split</h3>
          <div className="space-y-4">
            {split.map((r, i) => {
              const pct = stats.totalRev ? (r.v / stats.totalRev) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{r.l}</span>
                    <span className="font-mono">{fmt(r.v)} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden">
                    <div className={`h-full ${r.c} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Food */}
        <div className="card p-6">
          <h3 className="font-black text-text-primary mb-4 flex items-center gap-2"><Flame size={18} className="text-orange-500" /> Top Food</h3>
          {stats.topFood.length === 0 ? (
            <p className="text-xs text-text-secondary">No sales yet.</p>
          ) : stats.topFood.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 mb-3">
              <span className="text-sm font-black text-primary w-6">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{item.name}</div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-orange-500" style={{ width: `${(item.sold / stats.maxSold) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-orange-500 font-mono">{item.sold}</div>
                <div className="text-[10px] text-text-secondary">{fmt(Number(item.price))}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Drinks */}
        <div className="card p-6">
          <h3 className="font-black text-text-primary mb-4 flex items-center gap-2"><Coffee size={18} className="text-info" /> Top Drinks</h3>
          {stats.topDrinks.length === 0 ? (
            <p className="text-xs text-text-secondary">No sales yet.</p>
          ) : stats.topDrinks.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 mb-3">
              <span className="text-sm font-black text-primary w-6">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{item.name}</div>
                <div className="h-1.5 bg-bg rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-info" style={{ width: `${(item.sold / stats.maxSold) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-info font-mono">{item.sold}</div>
                <div className="text-[10px] text-text-secondary">{fmt(Number(item.price))}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
