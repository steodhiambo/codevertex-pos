import React, { useState } from 'react';
import {
  LayoutDashboard,
  Grid,
  Utensils,
  Coffee,
  Receipt,
  Bed,
  Package,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  History,
  Waves
} from 'lucide-react';
import NotificationDrawer from '../components/NotificationDrawer';

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
  userRole: Role;
  userName?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, userRole, userName, activeTab, setActiveTab, onLogout }) => {
  const displayName = userName || userRole;
  const initials = displayName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

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

        <div className="p-4 border-t border-border">
          <button 
            onClick={onLogout}
            className="flex items-center w-full gap-3 px-4 py-3 text-error hover:bg-red-50 rounded-card transition-colors cursor-pointer"
          >
            <LogOut size={24} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-text-secondary"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-text-primary capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-text-secondary hover:bg-bg rounded-full transition-colors"
            >
              <Bell size={24} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-text-primary">{displayName}</p>
                <p className="text-xs text-text-secondary">{userRole}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                {initials}
              </div>
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
      />
    </div>
  );
};

export default MainLayout;
