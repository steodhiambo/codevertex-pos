import React, { useEffect, useState } from 'react';
import { UserPlus, Shield, Loader2, X, Power } from 'lucide-react';
import { userApi } from '../lib/api';

type Role = 'Admin' | 'Manager' | 'Waiter' | 'Kitchen' | 'Bar' | 'Cashier' | 'Receptionist';

interface UserRow {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

const ROLES: { key: Role; label: string; icon: string; tint: string }[] = [
  { key: 'Admin', label: 'Admin', icon: '🛡️', tint: 'bg-primary-pale text-primary border-primary' },
  { key: 'Manager', label: 'Manager', icon: '👔', tint: 'bg-info/10 text-info border-info' },
  { key: 'Receptionist', label: 'Receptionist', icon: '🛎️', tint: 'bg-teal-500/10 text-teal-600 border-teal-500' },
  { key: 'Cashier', label: 'Cashier', icon: '💰', tint: 'bg-success/10 text-success border-success' },
  { key: 'Waiter', label: 'Waiter', icon: '🍽️', tint: 'bg-info/10 text-info border-info' },
  { key: 'Kitchen', label: 'Kitchen', icon: '🍳', tint: 'bg-orange-500/10 text-orange-500 border-orange-500' },
  { key: 'Bar', label: 'Bar', icon: '🍺', tint: 'bg-info/10 text-info border-info' },
];

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{ full_name: string; role: Role; pin: string }>({
    full_name: '',
    role: 'Waiter',
    pin: '0000',
  });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.full_name.trim()) { setError('Name is required'); return; }
    if (form.pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    setSubmitting(true); setError('');
    try {
      await userApi.create({ full_name: form.full_name.trim(), role: form.role, pin: form.pin });
      setForm({ full_name: '', role: 'Waiter', pin: '0000' });
      setShowForm(false);
      await fetchUsers();
    } catch (e: any) {
      setError(e?.message || 'Failed to create user. PIN may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (u: UserRow) => {
    try {
      await userApi.toggleActive(u.id, !u.is_active);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x));
    } catch (e) {
      alert('Failed to toggle user');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Users...</p>
      </div>
    );
  }

  const activeCount = users.filter(u => u.is_active).length;
  const roleInfo = (r: Role) => ROLES.find(x => x.key === r) || ROLES[4];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-text-primary">⚙️ User Management</h2>
          <p className="text-sm text-text-secondary">{activeCount} active · {users.length} total</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="h-11 px-5 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
        >
          {showForm ? <X size={16} /> : <UserPlus size={16} />}
          {showForm ? 'Cancel' : 'Add New Staff'}
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-2 border-primary/20">
          <h3 className="font-black text-text-primary mb-4">New Staff Member</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">Full Name</label>
              <input
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="e.g. Mary Akinyi"
                className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-1">PIN (4-6 digits)</label>
              <input
                value={form.pin}
                onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
                inputMode="numeric"
                className="w-full h-11 px-3 rounded-lg bg-bg border border-border focus:outline-none focus:border-primary font-mono tracking-widest"
              />
              <p className="text-[10px] text-text-secondary mt-1">Default PIN is <b>0000</b>. Staff can change later via Forgot PIN flow.</p>
            </div>
          </div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-2">Role</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {ROLES.map(r => {
              const active = form.role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setForm(p => ({ ...p, role: r.key }))}
                  className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                    active ? r.tint : 'bg-surface border-border text-text-secondary hover:border-primary-light'
                  }`}
                >
                  {r.icon} {r.label}
                </button>
              );
            })}
          </div>
          {error && <p className="text-xs font-bold text-error mb-3">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="h-11 px-5 rounded-xl bg-bg border border-border font-bold text-text-secondary hover:bg-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting || !form.full_name.trim()}
              className="flex-1 h-11 rounded-xl bg-primary text-white font-black uppercase tracking-wider text-xs hover:bg-primary-light shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
              Create Staff
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const r = roleInfo(u.role);
          return (
            <div key={u.id} className={`card p-5 flex items-center gap-4 ${u.is_active ? '' : 'opacity-50'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border ${r.tint}`}>
                {initials(u.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-text-primary truncate">{u.full_name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Shield size={12} className="text-text-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{r.icon} {r.label}</span>
                </div>
              </div>
              <button
                onClick={() => toggleActive(u)}
                className={`h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 transition-all active:scale-95 ${
                  u.is_active
                    ? 'bg-surface text-error border-error/30 hover:bg-error/5'
                    : 'bg-surface text-success border-success/30 hover:bg-success/5'
                }`}
              >
                <Power size={12} />
                {u.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserManagement;
