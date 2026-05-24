import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';

type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance' | 'reserved' | 'checkout';

interface Room {
  id: string;
  number: string;
  type: 'Single' | 'Double' | 'Suite' | 'Deluxe';
  status: RoomStatus;
  guestName?: string;
  price: number;
  floor?: number;
}

const ROOM_ST: Record<string, { l: string; c: string; bg: string; i: string }> = {
  available: { l: 'Available', c: '#10B981', bg: '#ECFDF5', i: '✅' },
  occupied: { l: 'Occupied', c: '#3B82F6', bg: '#EFF6FF', i: '🔵' },
  reserved: { l: 'Reserved', c: '#F59E0B', bg: '#FFFBEB', i: '📅' },
  dirty: { l: 'Dirty', c: '#EAB308', bg: '#FEFCE8', i: '🧹' },
  maintenance: { l: 'Maintenance', c: '#EF4444', bg: '#FEF2F2', i: '🔧' },
  checkout: { l: 'Checkout', c: '#EC4899', bg: '#FCE7F3', i: '🧳' },
};

const fmt = (n: number) => `KES ${n.toLocaleString()}`;

const mockRooms: Room[] = [
  { id: '1', number: '101', type: 'Single', status: 'available', price: 5000, floor: 1 },
  { id: '2', number: '102', type: 'Double', status: 'occupied', guestName: 'John Doe', price: 8000, floor: 1 },
  { id: '3', number: '103', type: 'Suite', status: 'dirty', price: 15000, floor: 1 },
  { id: '4', number: '104', type: 'Deluxe', status: 'maintenance', price: 12000, floor: 1 },
  { id: '5', number: '201', type: 'Double', status: 'reserved', guestName: 'Jane Smith', price: 8000, floor: 2 },
  { id: '6', number: '202', type: 'Single', status: 'checkout', guestName: 'Bob Brown', price: 5000, floor: 2 },
  { id: '7', number: '203', type: 'Suite', status: 'available', price: 15000, floor: 2 },
  { id: '8', number: '204', type: 'Double', status: 'occupied', guestName: 'Alice White', price: 8000, floor: 2 },
];

const statusFilters = ['all', 'available', 'occupied', 'dirty', 'maintenance', 'reserved', 'checkout'];

const RoomsGrid: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCI, setShowCI] = useState<Room | null>(null);
  const [guest, setGuest] = useState({ name: '', phone: '', nights: 1 });

  useEffect(() => {
    // Simulate API load — will be replaced in Phase 3
    const timer = setTimeout(() => {
      setRooms(mockRooms);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  const handleCheckIn = (room: Room) => {
    setRooms(p => p.map(r => r.id === room.id ? { ...r, status: 'occupied', guestName: guest.name } : r));
    setShowCI(null);
    setGuest({ name: '', phone: '', nights: 1 });
  };

  const handleCheckOut = (roomId: string) => {
    setRooms(p => p.map(r => r.id === roomId ? { ...r, status: 'checkout', guestName: undefined } : r));
  };

  const handleStatus = (roomId: string, status: RoomStatus) => {
    setRooms(p => p.map(r => r.id === roomId ? { ...r, status } : r));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Rooms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-text-primary font-heading">🏨 Rooms</h2>
        <button
          onClick={() => setRooms([...mockRooms])}
          className="p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {statusFilters.map(st => {
          const isAll = st === 'all';
          const roomSt = !isAll ? ROOM_ST[st] : null;
          const count = isAll ? rooms.length : rooms.filter(r => r.status === st).length;
          const isActive = filter === st;
          return (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                isActive
                  ? isAll ? 'bg-primary text-white' : 'text-white'
                  : 'bg-surface text-text-secondary border border-border hover:border-primary/30'
              }`}
              style={isActive && !isAll ? { background: roomSt!.c } : {}}
            >
              {!isAll && roomSt && <span className="mr-1">{roomSt.i}</span>}
              {isAll ? 'All' : roomSt?.l} ({count})
            </button>
          );
        })}
      </div>

      {/* Check-in Form */}
      {showCI && (
        <div className="card border-2 border-teal-500/30 p-4 space-y-3">
          <h3 className="font-bold text-text-primary text-sm">
            🛎️ Check In — Rm {showCI.number} ({showCI.type} · {fmt(showCI.price)}/n)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">Guest Name *</label>
              <input
                value={guest.name}
                onChange={e => setGuest(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg bg-bg border border-border text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1">Phone *</label>
              <input
                value={guest.phone}
                onChange={e => setGuest(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg bg-bg border border-border text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Nights</label>
            <input
              type="number"
              value={guest.nights}
              onChange={e => setGuest(p => ({ ...p, nights: parseInt(e.target.value) || 1 }))}
              min={1}
              className="w-20 h-10 px-3 rounded-lg bg-bg border border-border text-xs font-bold text-center outline-none focus:border-primary"
            />
          </div>
          <div className="bg-teal-50 rounded-lg px-4 py-2 text-xs font-semibold text-teal-600">
            Total: {fmt(showCI.price * guest.nights)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCI(null); setGuest({ name: '', phone: '', nights: 1 }); }}
              className="flex-1 h-10 rounded-xl border border-border font-semibold text-xs text-text-secondary hover:bg-bg transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!guest.name || !guest.phone}
              onClick={() => handleCheckIn(showCI)}
              className="flex-1 h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check In
            </button>
          </div>
        </div>
      )}

      {/* Room Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((r, idx) => {
          const st = ROOM_ST[r.status] || ROOM_ST.available;
          return (
            <div
              key={r.id}
              className="relative bg-surface rounded-xl p-3 border-2 cursor-default transition-all hover:border-primary hover:-translate-y-0.5 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{ borderColor: `${st.c}20`, animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
            >
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-40" style={{ background: st.c }} />

              {/* Top row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-black text-text-primary">Rm {r.number}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{ background: st.bg, color: st.c }}
                >
                  {st.i} {st.l}
                </span>
              </div>

              {/* Type & Price */}
              <div className="text-[10px] text-text-secondary font-medium mb-2">
                {r.type}{r.floor ? ` · Fl ${r.floor}` : ''} · {fmt(r.price)}/n
              </div>

              {/* Status-specific content */}
              {r.status === 'occupied' && r.guestName && (
                <div className="bg-bg rounded-lg p-2 mb-1">
                  <div className="text-xs font-bold text-text-primary truncate">{r.guestName}</div>
                  <button
                    onClick={() => handleCheckOut(r.id)}
                    className="mt-1.5 w-full py-1.5 rounded-md bg-error/5 text-error border border-error/10 text-[9px] font-semibold hover:bg-error/10 transition-colors"
                  >
                    Check Out
                  </button>
                </div>
              )}

              {r.status === 'available' && (
                <button
                  onClick={() => setShowCI(r)}
                  className="w-full mt-1 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors"
                >
                  🛎️ Check In
                </button>
              )}

              {r.status === 'dirty' && (
                <button
                  onClick={() => handleStatus(r.id, 'available')}
                  className="w-full mt-1 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-text-secondary hover:bg-bg transition-colors"
                >
                  Mark Clean ✓
                </button>
              )}

              {r.status === 'maintenance' && (
                <button
                  onClick={() => handleStatus(r.id, 'available')}
                  className="w-full mt-1 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-text-secondary hover:bg-bg transition-colors"
                >
                  Mark Fixed ✓
                </button>
              )}

              {r.status === 'reserved' && r.guestName && (
                <div className="bg-warning/5 border border-warning/10 rounded-lg p-2 text-[10px] text-warning font-semibold mt-1">
                  Reserved: {r.guestName}
                </div>
              )}

              {r.status === 'checkout' && (
                <button
                  onClick={() => handleStatus(r.id, 'available')}
                  className="w-full mt-1 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors"
                >
                  ✓ Complete Checkout
                </button>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-text-secondary text-sm">
            No rooms found in this status.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsGrid;
