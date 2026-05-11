import React from 'react';
import { Users, UserPlus, Shield, Mail, Phone, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', role: 'Admin', email: 'john@codevertex.com', phone: '0712 345 678', status: 'Active' },
  { id: '2', name: 'Sarah M.', role: 'Manager', email: 'sarah@codevertex.com', phone: '0722 456 789', status: 'Active' },
  { id: '3', name: 'Peter K.', role: 'Waiter', email: 'peter@codevertex.com', phone: '0733 567 890', status: 'Active' },
  { id: '4', name: 'Lucy W.', role: 'Cashier', email: 'lucy@codevertex.com', phone: '0744 678 901', status: 'Active' },
  { id: '5', name: 'Mike R.', role: 'Kitchen', email: 'mike@codevertex.com', phone: '0755 789 012', status: 'Inactive' },
];

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">User Management</h2>
          <p className="text-sm text-text-secondary">Manage staff accounts and permissions</p>
        </div>
        <button className="btn-primary flex items-center gap-2 h-12 px-6">
          <UserPlus size={20} />
          Add New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockUsers.map((user) => (
          <div key={user.id} className="card p-6 flex flex-col relative group">
            <button className="absolute top-4 right-4 p-2 text-text-secondary hover:bg-bg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical size={16} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-bold text-text-primary">{user.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Shield size={12} className="text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{user.role}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-text-secondary">
                <Mail size={16} />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary">
                <Phone size={16} />
                <span className="text-sm">{user.phone}</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                user.status === 'Active' ? 'bg-success/10 text-success' : 'bg-text-secondary/10 text-text-secondary'
              }`}>
                {user.status}
              </span>
              <div className="flex gap-2">
                <button className="p-2 text-text-secondary hover:text-primary transition-colors">
                  <Edit2 size={16} />
                </button>
                <button className="p-2 text-text-secondary hover:text-error transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
