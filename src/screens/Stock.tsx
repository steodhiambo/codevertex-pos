import React from 'react';
import { Package, AlertTriangle, Plus, Search, Filter, ArrowUpDown } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastUpdated: string;
}

const mockStock: StockItem[] = [
  { id: '1', name: 'Wheat Flour', category: 'Kitchen', stock: 15, minStock: 20, unit: 'KG', lastUpdated: '2h ago' },
  { id: '2', name: 'Tomato Sauce', category: 'Kitchen', stock: 45, minStock: 10, unit: 'Liters', lastUpdated: '5h ago' },
  { id: '3', name: 'Mozzarella Cheese', category: 'Kitchen', stock: 5, minStock: 10, unit: 'KG', lastUpdated: '1h ago' },
  { id: '4', name: 'Local Beer', category: 'Bar', stock: 240, minStock: 50, unit: 'Bottles', lastUpdated: '1d ago' },
  { id: '5', name: 'Red Wine', category: 'Bar', stock: 12, minStock: 15, unit: 'Bottles', lastUpdated: '3h ago' },
];

const Stock: React.FC = () => {
  const lowStockCount = mockStock.filter(i => i.stock <= i.minStock).length;

  return (
    <div className="space-y-6">
      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle size={24} />
            <div>
              <p className="font-bold">Low Stock Alert</p>
              <p className="text-xs opacity-80">{lowStockCount} items are below their minimum stock levels.</p>
            </div>
          </div>
          <button className="bg-error text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">
            Order Now
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full h-12 pl-12 pr-4 rounded-card bg-surface border border-border focus:border-primary outline-none"
            />
          </div>
          <button className="p-3 bg-surface border border-border rounded-card text-text-secondary hover:text-primary transition-colors">
            <Filter size={20} />
          </button>
        </div>
        <button className="btn-primary flex items-center gap-2 h-12 px-6">
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Stock Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-bg/50 border-b border-border">
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Item Name</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Category</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase text-right">In Stock</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase text-right">Min Stock</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Unit</th>
              <th className="p-4 text-xs font-bold text-text-secondary uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockStock.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg/30 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-text-primary">{item.name}</p>
                  <p className="text-[10px] text-text-secondary">Last updated: {item.lastUpdated}</p>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-bg rounded text-[10px] font-bold text-text-secondary uppercase">
                    {item.category}
                  </span>
                </td>
                <td className="p-4 text-right font-mono font-bold text-text-primary">
                  {item.stock}
                </td>
                <td className="p-4 text-right font-mono font-bold text-text-secondary">
                  {item.minStock}
                </td>
                <td className="p-4 text-sm text-text-secondary">
                  {item.unit}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    item.stock <= item.minStock ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                  }`}>
                    {item.stock <= item.minStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stock;
