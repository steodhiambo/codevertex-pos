import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Utensils, Coffee, Clock, Trash2, BellOff } from 'lucide-react';

export interface NotificationItem {
  id: string;
  order_id: string;
  order_number?: string | null;
  table_name?: string | null;
  source: 'Kitchen' | 'Bar';
  message: string;
  is_read: boolean;
  created_at: string;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  loading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClear?: () => void;
  unreadCount?: number;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  loading = false,
  onMarkRead,
  onMarkAllRead,
  onClear,
  unreadCount = 0,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
          />
          
          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[360px] bg-surface shadow-2xl z-[120] flex flex-col"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell size={24} className="text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-error text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-text-primary">Notifications</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClear}
                  disabled={notifications.length === 0}
                  className="p-2 text-text-secondary hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Clear All"
                >
                  <Trash2 size={20} />
                </button>
                <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-text-secondary opacity-40">
                  <Bell size={32} className="mb-2 animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-widest">Loading…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-text-secondary opacity-30">
                  <BellOff size={36} className="mb-3" />
                  <p className="text-sm font-black uppercase tracking-widest">No notifications</p>
                  <p className="text-xs font-medium mt-1">You're all caught up.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => !notif.is_read && onMarkRead?.(notif.id)}
                    className={`w-full text-left p-4 rounded-card border transition-all ${
                      notif.is_read
                        ? 'bg-surface border-border opacity-70'
                        : 'bg-primary-pale/30 border-primary-light shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          notif.source === 'Kitchen' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {notif.source === 'Kitchen' ? <Utensils size={16} /> : <Coffee size={16} />}
                        </div>
                        <span className="font-bold text-text-primary text-sm">
                          #{notif.order_number || notif.order_id.slice(0, 4).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary uppercase">
                        <Clock size={12} />
                        {timeAgo(notif.created_at)}
                      </div>
                    </div>

                    <p className="text-sm font-bold text-text-primary mb-1">{notif.message}</p>
                    <p className="text-xs text-text-secondary">
                      Table {notif.table_name || '—'} · {notif.source} Area
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-border bg-bg/50">
              <button
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="w-full h-12 rounded-card bg-surface border border-border text-primary font-bold hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark All as Read
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
