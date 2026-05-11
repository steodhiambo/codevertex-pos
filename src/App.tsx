import { useState, useEffect } from 'react';
import PinLogin from './screens/PinLogin';
import StartShift from './screens/StartShift';
import EndShift from './screens/EndShift';
import MainLayout from './layouts/MainLayout';
import FloorPlan from './screens/FloorPlan';
import OrderEntry from './screens/OrderEntry';
import KDS from './screens/KDS';
import BillsList from './screens/BillsList';
import MyBills from './screens/MyBills';
import RoomsGrid from './screens/RoomsGrid';
import Facilities from './screens/Facilities';
import Dashboard from './screens/Dashboard';
import Stock from './screens/Stock';
import UserManagement from './screens/UserManagement';
import PaymentModal from './components/PaymentModal';
import VoidBillModal from './components/VoidBillModal';
import { authApi } from './lib/api';

type AppStep = 'login' | 'start-shift' | 'main' | 'end-shift';
type Role = 'Waiter' | 'Kitchen' | 'Bar' | 'Cashier' | 'Receptionist' | 'Manager' | 'Admin';

interface User {
  id: string;
  full_name: string;
  role: Role;
}

function App() {
  const [step, setStep] = useState<AppStep>('login');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('tables');
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [currentOrderContext, setCurrentOrderContext] = useState<{tableId: string, tableName: string, guestCount: number} | null>(null);

  // Persistence check on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pos_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setStep('main');
      // Set default tab based on role
      setDefaultTab(parsedUser.role);
    }
  }, []);

  const setDefaultTab = (role: Role) => {
    switch (role) {
      case 'Waiter': setActiveTab('tables'); break;
      case 'Kitchen': setActiveTab('kitchen'); break;
      case 'Bar': setActiveTab('bar'); break;
      case 'Cashier': setActiveTab('bills'); break;
      case 'Receptionist': setActiveTab('rooms'); break;
      default: setActiveTab('dashboard'); break;
    }
  };

  const handleLogin = async (pin: string) => {
    try {
      const response = await authApi.login(pin);
      const userData = response.user;
      
      setUser({
        id: userData.id,
        full_name: userData.full_name,
        role: userData.role
      });
      
      localStorage.setItem('pos_user', JSON.stringify(userData));
      
      // If it's a waiter/manager/admin, they might need to start shift
      if (['Waiter', 'Manager', 'Admin'].includes(userData.role)) {
        setStep('start-shift');
      } else {
        setStep('main');
        setDefaultTab(userData.role);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Let PinLogin handle the error (shake)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_user');
    setUser(null);
    setStep('login');
  };

  const handleStartShift = () => {
    setStep('main');
  };

  const handleEndShift = () => {
    setStep('end-shift');
  };

  const handleTableSelect = (tableId: string, tableName: string, guestCount: number) => {
    setCurrentOrderContext({ tableId, tableName, guestCount });
    setActiveTab('order-entry');
  };

  if (step === 'login') {
    return <PinLogin onLogin={handleLogin} />;
  }

  if (step === 'start-shift') {
    return <StartShift onConfirm={handleStartShift} />;
  }

  if (step === 'end-shift') {
    return <EndShift onConfirm={() => setStep('login')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tables':
        return <FloorPlan onTableSelect={handleTableSelect} />;
      case 'order-entry':
        return <OrderEntry context={currentOrderContext} waiterId={user?.id || ''} onBack={() => setActiveTab('tables')} />;
      case 'kitchen':
        return <KDS type="kitchen" />;
      case 'bar':
        return <KDS type="bar" />;
      case 'my-bills':
        return <MyBills />;
      case 'bills':
        return (
          <BillsList 
            onBillSelect={(bill) => {
              setSelectedBill(bill);
              setIsPaymentModalOpen(true);
            }} 
          />
        );
      case 'rooms':
        return <RoomsGrid />;
      case 'facilities':
        return <Facilities />;
      case 'stock':
        return <Stock />;
      case 'users':
        return <UserManagement />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab}</h2>
            <p>This module is coming soon...</p>
          </div>
        );
    }
  };

  return (
    <MainLayout 
      userRole={user?.role || 'Waiter'} 
      activeTab={activeTab === 'order-entry' ? 'tables' : activeTab} 
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    >
      {renderContent()}

      {selectedBill && (
        <>
          <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onSuccess={() => {
              setIsPaymentModalOpen(false);
              setSelectedBill(null);
            }}
            bill={selectedBill}
          />
          <VoidBillModal 
            isOpen={isVoidModalOpen}
            onClose={() => setIsVoidModalOpen(false)}
            onConfirm={(reason) => {
              console.log('Voiding bill with reason:', reason);
              setIsVoidModalOpen(false);
              setSelectedBill(null);
            }}
            bill={selectedBill}
          />
        </>
      )}
    </MainLayout>
  );
}

export default App;
