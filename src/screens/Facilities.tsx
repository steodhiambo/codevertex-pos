import React from 'react';
import { Coffee, Dumbbell, Car, Waves, Users, ArrowRight, Calendar, CreditCard } from 'lucide-react';

const Facilities: React.FC = () => {
  const facilities = [
    { name: 'Gym & Spa', icon: <Dumbbell />, capacity: 85, status: 'Open', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Swimming Pool', icon: <Waves />, capacity: 40, status: 'Open', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { name: 'Conference Room', icon: <Users />, capacity: 0, status: 'Booked', color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Restaurant', icon: <Coffee />, capacity: 65, status: 'Busy', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Facilities Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map((f, i) => (
          <div key={i} className="card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${f.bg} ${f.color}`}>
                {React.cloneElement(f.icon as React.ReactElement, { size: 24 })}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                f.status === 'Open' ? 'bg-success/10 text-success' : 
                f.status === 'Busy' ? 'bg-warning/10 text-warning' : 
                'bg-error/10 text-error'
              }`}>
                {f.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-text-primary">{f.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      f.capacity > 80 ? 'bg-error' : f.capacity > 50 ? 'bg-warning' : 'bg-success'
                    }`} 
                    style={{ width: `${f.capacity}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-text-secondary">{f.capacity}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Check-In Form */}
        <div className="lg:col-span-2 card p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Quick Check-In</h2>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Guest Name</label>
                <input type="text" placeholder="Full name" className="w-full h-12 px-4 rounded-lg bg-bg border border-border focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Phone Number</label>
                <input type="tel" placeholder="07xx xxx xxx" className="w-full h-12 px-4 rounded-lg bg-bg border border-border focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Room Number</label>
                <select className="w-full h-12 px-4 rounded-lg bg-bg border border-border focus:border-primary outline-none">
                  <option>Select Room</option>
                  <option>101 (Single)</option>
                  <option>203 (Suite)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary uppercase">Duration (Nights)</label>
                <input type="number" min="1" defaultValue="1" className="w-full h-12 px-4 rounded-lg bg-bg border border-border focus:border-primary outline-none" />
              </div>
            </div>

            <div className="p-4 bg-primary-pale/30 rounded-xl border border-primary-light flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-lg text-primary">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-bold">Estimated Total</p>
                  <p className="text-xl font-black text-primary">KES 15,000.00</p>
                </div>
              </div>
              <button className="btn-primary h-12 px-8 flex items-center gap-2">
                Confirm Check-In
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>

        {/* Upcoming Bookings */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-text-primary">Upcoming</h2>
            <Calendar size={18} className="text-text-secondary" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg transition-colors cursor-pointer border border-transparent hover:border-border">
                <div className="w-10 h-10 rounded-full bg-primary-pale text-primary flex items-center justify-center font-bold text-xs">
                  JS
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">Jane Smith</p>
                  <p className="text-[10px] text-text-secondary">Room 104 · Tomorrow</p>
                </div>
                <ArrowRight size={16} className="text-text-secondary" />
              </div>
            ))}
          </div>
          <button className="w-full mt-6 h-10 text-xs font-bold text-primary hover:underline">
            View All Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Facilities;
