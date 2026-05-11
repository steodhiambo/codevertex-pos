import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ChevronRight, Receipt, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { menuApi, orderApi } from '../lib/api';

// Removed simple generator, using crypto.randomUUID() for real UUIDs

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  category?: string;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

interface OrderEntryProps {
  context: { tableId: string; tableName: string; guestCount: number } | null;
  waiterId: string;
  onBack: () => void;
}

const OrderEntry: React.FC<OrderEntryProps> = ({ context, waiterId, onBack }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const [menuData, catData] = await Promise.all([
          menuApi.getAll(),
          menuApi.getCategories()
        ]);
        setMenuItems(menuData);
        const catNames = catData.map((c: any) => c.name);
        setCategories(['All', ...catNames]);
      } catch (error) {
        console.error('Failed to fetch menu data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const filteredMenu = menuItems.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSendToKitchen = async () => {
    setIsSending(true);
    try {
      const orderData = {
        id: crypto.randomUUID(),
        table_id: context?.tableId || "T1",
        waiter_id: waiterId || "W1",
        guest_count: context?.guestCount || 1,
        items: cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.note
        }))
      };

      await orderApi.create(orderData);
      setIsSuccess(true);
      setTimeout(() => {
        setCart([]);
        setIsSuccess(false);
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Failed to send order:', error);
      alert('Failed to send order. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading Menu...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">Order Sent!</h2>
        <p className="text-text-secondary">The kitchen has received your order.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 overflow-hidden -m-6"> {/* Negative margin to use full layout space */}
      {/* Left Side: Category Rail - Fixed Width */}
      <div className="w-28 flex flex-col bg-surface border-r border-border overflow-y-auto shrink-0 py-4 px-2 gap-3">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-2xl aspect-square transition-all border-2
              ${selectedCategory === cat 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'bg-bg border-transparent text-text-secondary hover:border-primary-light hover:text-primary'
              }
            `}
          >
            <div className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">
              {cat}
            </div>
          </button>
        ))}
      </div>

      {/* Center: Menu Selection - Flexible */}
      <div className="flex-1 flex flex-col min-w-0 py-6 pr-2">
        {/* Search Header */}
        <div className="flex gap-4 mb-6">
          <button 
            onClick={onBack}
            className="p-4 bg-surface border-2 border-border rounded-2xl text-text-secondary hover:text-primary hover:border-primary-light transition-all active:scale-90 shrink-0 shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary" size={24} />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-16 pl-14 pr-6 rounded-2xl bg-surface border-2 border-border focus:outline-none focus:border-primary transition-all text-lg font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Menu Grid - Improved Spacing */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="card flex flex-col p-5 text-left hover:border-primary hover:shadow-xl transition-all active:scale-95 border-2 group bg-surface min-h-[220px]"
            >
              <div className="w-full h-32 rounded-xl bg-primary-pale mb-4 flex items-center justify-center text-primary font-black text-4xl group-hover:scale-105 transition-transform shrink-0">
                {item.name.charAt(0)}
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="font-black text-text-primary mb-2 line-clamp-2 text-base leading-tight uppercase tracking-tight">{item.name}</h3>
                <div className="mt-auto flex justify-between items-center">
                  <span className="text-primary font-black text-lg font-mono">KES {item.price.toLocaleString()}</span>
                  <div className="p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={20} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Side: Cart Panel - Fixed Width */}
      <div className="w-[400px] flex flex-col bg-surface border-l border-border shadow-2xl shrink-0">
        <div className="p-6 border-b border-border bg-bg/30">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-text-primary flex items-center gap-2 uppercase tracking-tighter">
              <Receipt size={24} className="text-primary" />
              Cart
            </h2>
            <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-black">
              #NEW
            </span>
          </div>
          <p className="text-sm text-text-secondary font-bold">Table {context?.tableName || 'T1'} · {context?.guestCount || 2} Guests</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 rounded-full bg-bg border-4 border-dashed border-border flex items-center justify-center mb-4">
                <Plus size={40} className="text-text-secondary" />
              </div>
              <p className="text-text-secondary font-black uppercase tracking-widest text-xs">Empty Cart</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 items-center animate-in slide-in-from-right-4 duration-200">
                <div className="w-12 h-12 rounded-xl bg-primary-pale flex items-center justify-center font-black text-primary shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm text-text-primary uppercase truncate tracking-tight">{item.name}</h4>
                  <p className="text-xs text-primary font-bold font-mono">KES {item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 bg-bg p-1 rounded-xl border border-border">
                  <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary transition-all active:scale-90"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-sm font-black font-mono">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-primary transition-all active:scale-90"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-text-secondary hover:text-error transition-all active:scale-90"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-border bg-bg/50 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono">KES {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-text-secondary">
              <span>VAT (16%)</span>
              <span className="font-mono">KES {(total * 0.16).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-2xl font-black pt-4 border-t-4 border-border border-dotted">
              <span className="text-text-primary tracking-tighter">TOTAL</span>
              <span className="text-primary font-mono">KES {(total * 1.16).toLocaleString()}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0 || isSending}
            onClick={handleSendToKitchen}
            className="w-full h-20 rounded-2xl bg-primary text-white text-xl font-black uppercase tracking-widest hover:bg-primary-light shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {isSending ? (
              <>
                <Loader2 className="animate-spin" size={28} />
                Sending...
              </>
            ) : (
              <>
                Confirm Order
                <ChevronRight size={28} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEntry;
