import React from 'react';
import { TrendingUp, Users, DollarSign, Package, ArrowUpRight, ArrowDownRight, ShoppingBag, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const kpis = [
    { label: 'Daily Revenue', value: 'KES 142.5K', change: '+12.5%', isUp: true, icon: <DollarSign /> },
    { label: 'Total Orders', value: '1,284', change: '+8.2%', isUp: true, icon: <ShoppingBag /> },
    { label: 'Avg. Check', value: 'KES 2,450', change: '-2.4%', isUp: false, icon: <TrendingUp /> },
    { label: 'Guest Count', value: '458', change: '+14.1%', isUp: true, icon: <Users /> },
  ];

  const topItems = [
    { name: 'Margherita Pizza', category: 'Food', orders: 145, revenue: 'KES 174K' },
    { name: 'Local Beer', category: 'Bar', orders: 122, revenue: 'KES 61K' },
    { name: 'Beef Burger', category: 'Food', orders: 98, revenue: 'KES 93K' },
    { name: 'Cappuccino', category: 'Drinks', orders: 85, revenue: 'KES 29K' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-bg rounded-xl text-primary">
                {React.cloneElement(kpi.icon as React.ReactElement, { size: 24 })}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                kpi.isUp ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}>
                {kpi.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.change}
              </div>
            </div>
            <p className="text-sm font-bold text-text-secondary mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-black text-text-primary">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart Mockup */}
        <div className="lg:col-span-2 card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Revenue Overview</h2>
              <p className="text-sm text-text-secondary">Last 7 days performance</p>
            </div>
            <select className="bg-bg border border-border rounded-lg px-4 py-2 text-sm font-bold outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 pt-4">
            {[45, 60, 40, 85, 70, 95, 80].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="w-full bg-primary-pale rounded-t-lg relative group-hover:bg-primary-light transition-colors" style={{ height: `${h}%` }}>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    KES {h}K
                  </div>
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase">Day {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Items */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">Top Selling</h2>
          <div className="space-y-6">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">{item.name}</p>
                  <p className="text-[10px] text-text-secondary uppercase">{item.category} · {item.orders} orders</p>
                </div>
                <p className="text-sm font-black text-text-primary">{item.revenue}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 h-12 rounded-xl bg-bg border border-border text-primary font-bold hover:bg-white transition-colors">
            Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
