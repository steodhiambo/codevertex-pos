import React, { useState } from 'react';
import { Bed, Search, Filter, Calendar, UserPlus } from 'lucide-react';

type RoomStatus = 'Available' | 'Occupied' | 'Dirty' | 'Maintenance' | 'Reserved' | 'Checkout';

interface Room {
  id: string;
  number: string;
  type: 'Single' | 'Double' | 'Suite' | 'Deluxe';
  status: RoomStatus;
  guestName?: string;
  price: number;
}

const mockRooms: Room[] = [
  { id: '1', number: '101', type: 'Single', status: 'Available', price: 5000 },
  { id: '2', number: '102', type: 'Double', status: 'Occupied', guestName: 'John Doe', price: 8000 },
  { id: '3', number: '103', type: 'Suite', status: 'Dirty', price: 15000 },
  { id: '4', number: '104', type: 'Deluxe', status: 'Maintenance', price: 12000 },
  { id: '5', number: '201', type: 'Double', status: 'Reserved', guestName: 'Jane Smith', price: 8000 },
  { id: '6', number: '202', type: 'Single', status: 'Checkout', guestName: 'Bob Brown', price: 5000 },
  { id: '7', number: '203', type: 'Suite', status: 'Available', price: 15000 },
  { id: '8', number: '204', type: 'Double', status: 'Occupied', guestName: 'Alice White', price: 8000 },
];

const statusColors: Record<RoomStatus, string> = {
  Available: 'bg-success text-white border-success',
  Occupied: 'bg-info text-white border-info',
  Dirty: 'bg-orange-500 text-white border-orange-500',
  Maintenance: 'bg-error text-white border-error',
  Reserved: 'bg-purple-500 text-white border-purple-500',
  Checkout: 'bg-yellow-500 text-white border-yellow-500',
};

const statusBgLight: Record<RoomStatus, string> = {
  Available: 'bg-success/5',
  Occupied: 'bg-info/5',
  Dirty: 'bg-orange-500/5',
  Maintenance: 'bg-error/5',
  Reserved: 'bg-purple-500/5',
  Checkout: 'bg-yellow-500/5',
};

const RoomsGrid: React.FC = () => {
  const [filter, setFilter] = useState<RoomStatus | 'All'>('All');

  const filteredRooms = filter === 'All' ? mockRooms : mockRooms.filter(r => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
          {['All', 'Available', 'Occupied', 'Dirty', 'Maintenance', 'Reserved', 'Checkout'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold border transition-all ${
                filter === s 
                  ? 'bg-primary text-white border-primary shadow-md' 
                  : 'bg-surface text-text-secondary border-border hover:border-primary-light'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn-primary flex items-center gap-2 h-11 px-6 whitespace-nowrap">
          <UserPlus size={18} />
          New Booking
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredRooms.map(room => (
          <button
            key={room.id}
            className={`card p-0 overflow-hidden text-left flex flex-col min-h-[140px] transition-all hover:scale-[1.02] active:scale-[0.98] border-2 ${
              statusBgLight[room.status]
            } ${filter === room.status ? 'border-primary' : 'border-transparent'}`}
          >
            <div className={`p-2 text-[10px] font-black uppercase tracking-tighter text-center ${statusColors[room.status]}`}>
              {room.status}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1">
                <span className="text-2xl font-black text-text-primary">{room.number}</span>
                <Bed size={16} className="text-text-secondary" />
              </div>
              <p className="text-[10px] font-bold text-text-secondary uppercase mb-4">{room.type}</p>
              
              <div className="mt-auto">
                {room.guestName ? (
                  <p className="text-xs font-bold text-text-primary truncate">{room.guestName}</p>
                ) : (
                  <p className="text-xs font-bold text-primary">KES {room.price.toLocaleString()}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomsGrid;
