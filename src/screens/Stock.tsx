import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Search, Loader2, X } from 'lucide-react';
import { stockApi } from '../lib/api';

interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  cost_price?: number | null;
  supplier?: string | null;
  last_restocked?: string | null;
}

const fmt = (n: number) => n.toLocaleString();

const Stock: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    quantity: '0',
    reorder_level: '10',
    cost_price: '',
    supplier: '',
  });

  const fetchItems = async () => {
    try {
      const data = await stockApi.getAll();
      setItems(data);
    } catch (e) {
      console.error('Failed to load stock', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = items.filter(i => i.quantity <= i.reorder_level);

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSubmitting(true); setError('');
    try {
      await stockApi.create({
        id: crypto.randomUUID(),
        name: form.name.trim(),
        category: form.category.trim() || null,
        unit: form.unit.trim() || null,
        quantity: Number(form.quantity) || 0,
        reorder_level: Number(form.reorder_level) || 0,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        supplier: form.supplier.trim() || null,
      });
      setForm({ name: '', category: '', unit: '', quantity: '0', reorder_level: '10', cost_price: '', supplier: '' });
      setShowForm(false);
      await fetchItems();
    } catch (e: any) {
      setError(e.message || 'Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Stock...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {lowStockItems.length > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle size={24} />
            <div>
              <p className="font-bold">Low Stock Alert</p>
              <p className="text-xs opacity-80">{lowStockItems.length} items below minimum stock level.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-card bg-surface border border-border focus:border-primary outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setError(''); }}
          className="btn-primary flex items-center gap-2 h-12 px-6"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-2 border-primary/20">
          <h3 className="font-black text-text-primary mb-4">New Stock Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Item Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Tusker Lager" className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Category</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Beverages" className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Unit</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. Bottle, Kg" className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Reorder Level</label>
              <input type="number" value={form.reorder_level} onChange={e => setForm(p => ({ ...p, reorder_level: e.target.value }))} className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Cost Price (KES)</label>
              <input type="number" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="Optional" className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Supplier</label>
              <input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Optional" className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary" />
            </div>
          </div>
          {error && <p className="text-xs font-bold text-error mb-3">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={submitting || !form.name.trim()}
            className="h-11 px-6 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
            Add to Stock
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg/50 border-b border-border">
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Item Name</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Category</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase text-right">In Stock</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase text-right">Reorder At</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase text-right">Cost Price</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Unit</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg/30 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-text-primary">{item.name}</p>
                  {item.supplier && <p className="text-[10px] text-text-secondary">Supplier: {item.supplier}</p>}
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-bg rounded text-[10px] font-bold text-text-secondary uppercase">
                    {item.category || '—'}
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-bold text-text-primary">
                  {fmt(item.quantity)}
                </td>
                <td className="p-4 text-right font-mono font-bold text-text-secondary">
                  {fmt(item.reorder_level)}
                </td>
                <td className="p-4 text-right font-mono font-bold text-text-primary">
                  {item.cost_price ? `KES ${fmt(Number(item.cost_price))}` : '—'}
                </td>
                <td className="p-4 text-sm text-text-secondary">
                  {item.unit || '—'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    item.quantity <= item.reorder_level ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                  }`}>
                    {item.quantity <= item.reorder_level ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary text-sm">
                  {search ? 'No items match your search.' : 'No stock items yet. Add your first item above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stock;
