import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard,
  Grid,
  Utensils,
  Coffee,
  Receipt,
  Bed,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  History,
  Waves,
  ChevronDown,
  Settings
} from 'lucide-react';
import NotificationDrawer, { NotificationItem } from '../components/NotificationDrawer';
import { notificationApi, getWsUrl } from '../lib/api';

type Role = 'Waiter' | 'Kitchen' | 'Bar' | 'Cashier' | 'Receptionist' | 'Manager' | 'Admin';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  roles: Role[];
  id: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={24} />, roles: ['Manager', 'Admin'] },
  { id: 'tables', label: 'Tables', icon: <Grid size={24} />, roles: ['Waiter', 'Manager', 'Admin'] },
  { id: 'my-bills', label: 'My Bills', icon: <History size={24} />, roles: ['Waiter'] },
  { id: 'kitchen', label: 'Kitchen', icon: <Utensils size={24} />, roles: ['Kitchen', 'Manager', 'Admin'] },
  { id: 'bar', label: 'Bar', icon: <Coffee size={24} />, roles: ['Bar', 'Manager', 'Admin'] },
  { id: 'bills', label: 'Bills', icon: <Receipt size={24} />, roles: ['Cashier', 'Manager', 'Admin'] },
  { id: 'rooms', label: 'Rooms', icon: <Bed size={24} />, roles: ['Receptionist', 'Manager', 'Admin'] },
  { id: 'facilities', label: 'Facilities', icon: <Waves size={24} />, roles: ['Receptionist', 'Admin'] },
  { id: 'stock', label: 'Stock', icon: <Package size={24} />, roles: ['Admin'] },
  { id: 'users', label: 'Users', icon: <Users size={24} />, roles: ['Admin'] },
];

interface MainLayoutProps {
  children?: React.ReactNode;
  userId?: string;
  userRole: Role;
  userName?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, userId, userRole, userName, activeTab, setActiveTab, onLogout }) => {
  const displayName = userName || userRole;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

  const isNotifEnabled = ['Waiter', 'Admin', 'Manager'].includes(userRole) && Boolean(userId);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!isNotifEnabled || !userId) return;
    setNotifLoading(true);
    try {
      const data = await notificationApi.list(userId);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setNotifLoading(false);
    }
  }, [isNotifEnabled, userId]);

  useEffect(() => {
    if (!isNotifEnabled) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
  }, [isNotifEnabled, fetchNotifications]);

  // Subscribe to WS for incoming notification events
  useEffect(() => {
    if (!isNotifEnabled || !userId) return;
    const ws = new WebSocket(getWsUrl('/kds'));
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.type === 'notification' && msg.data) {
          const notif = msg.data as NotificationItem;
          if (notif.waiter_id !== userId) return;
          setNotifications(prev => {
            if (prev.some(n => n.id === notif.id)) return prev;
            return [notif, ...prev];
          });
        }
      } catch {
        // Non-JSON or order-update message — ignore here
      }
    };
    return () => ws.close();
  }, [isNotifEnabled, userId]);

  const handleMarkRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await notificationApi.markRead(id);
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await notificationApi.markAllRead(userId);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleClear = async () => {
    if (!userId) return;
    setNotifications([]);
    try {
      await notificationApi.clear(userId);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">Codevertex</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full gap-3 px-4 py-3 rounded-card transition-colors ${
                activeTab === item.id 
                  ? 'bg-primary text-white' 
                  : 'text-text-secondary hover:bg-primary-pale hover:text-primary'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-12 bg-white border-b border-border flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-1 -ml-1 text-text-secondary"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-[7px] font-black">CV</span>
            </div>
            <span className="text-[11px] font-bold text-text-primary hidden sm:inline">Codevertex POS</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            {isNotifEnabled && (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="relative w-7 h-7 rounded-md border border-border flex items-center justify-center text-xs hover:bg-bg transition-colors"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-error text-white text-[7px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Avatar + Dropdown */}
            <div className="relative flex items-center">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-0.5 rounded-lg hover:bg-bg transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-bold">{initials}</span>
                </div>
                <ChevronDown size={10} className="text-text-secondary" />
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 top-full w-44 bg-surface rounded-xl shadow-xl border border-border z-50 py-1 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-sm font-bold text-text-primary">{userName || userRole}</p>
                      <p className="text-[10px] text-text-secondary font-medium">{userRole}</p>
                    </div>
                    <div className="py-1">
                      <button
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-text-secondary hover:bg-bg transition-colors"
                      >
                        <Settings size={15} /> Settings
                      </button>
                      <button
                        onClick={() => { onLogout(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-error hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Bottom Nav for Tablet/Mobile */}
        <nav className="lg:hidden bg-surface border-t border-border h-16 flex items-center justify-around px-2 shrink-0">
          {filteredNavItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 ${
                activeTab === item.id ? 'text-primary' : 'text-text-secondary'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface shadow-xl flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">Codevertex</h1>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {filteredNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center w-full gap-3 px-4 py-3 rounded-card transition-colors ${
                    activeTab === item.id 
                      ? 'bg-primary text-white' 
                      : 'text-text-secondary hover:bg-primary-pale hover:text-primary'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        loading={notifLoading}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onClear={handleClear}
      />
    </div>
  );
};

export default MainLayout;
