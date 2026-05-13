import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ChevronRight, Receipt, ArrowLeft, Loader2, CheckCircle2, MessageSquare, Utensils, Coffee } from 'lucide-react';
import { menuApi, orderApi } from '../lib/api';
import VoidItemModal from '../components/VoidItemModal';

type Destination = 'kitchen' | 'bar';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  category_name?: string;
  production_area?: Destination;
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
}

const BAR_CATEGORIES = new Set(['Drinks', 'Cocktails', 'Beverages', 'Hot Drinks']);
const destinationOf = (item: MenuItem): Destination => {
  if (item.production_area) return item.production_area;
  if (item.category_name && BAR_CATEGORIES.has(item.category_name)) return 'bar';
  return 'kitchen';
};

interface OrderEntryProps {
  context: { tableId: string; tableName: string; guestCount: number } | null;
  waiterId: string;
  onBack: () => void;
  onOrderPlaced?: () => void;
}

const OrderEntry: React.FC<OrderEntryProps> = ({ context, waiterId, onBack, onOrderPlaced }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [voidingItem, setVoidingItem] = useState<CartItem | null>(null);

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
    (selectedCategory === 'All' || item.category_name === selectedCategory) &&
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

  const updateNote = (id: string, note: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  };

  const requestRemove = (item: CartItem) => {
    setVoidingItem(item);
  };

  const confirmRemove = (_reason: string) => {
    if (voidingItem) {
      setCart(prev => prev.filter(i => i.id !== voidingItem.id));
    }
    setVoidingItem(null);
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCart([]);
    }
  };

  const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    
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
          notes: item.note || ""
        }))
      };

      await orderApi.create(orderData);
      setIsSuccess(true);
      setTimeout(() => {
        setCart([]);
        setIsSuccess(false);
        if (onOrderPlaced) onOrderPlaced();
        else onBack();
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
    <div className="flex h-full gap-4 overflow-hidden -m-6">
      {/* Left Side: Category Rail */}
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

      {/* Center: Menu Selection */}
      <div className="flex-1 flex flex-col min-w-0 py-6 pr-2">
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

        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
          {filteredMenu.map(item => {
            const dest = destinationOf(item);
            const inCart = cart.find(c => c.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="card flex flex-col p-5 text-left hover:border-primary hover:shadow-xl transition-all active:scale-95 border-2 group bg-surface min-h-[220px] relative"
              >
                {/* Destination badge */}
                <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                  dest === 'bar' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                }`}>
                  {dest === 'bar' ? <Coffee size={10} /> : <Utensils size={10} />}
                  {dest}
                </div>
                {/* Cart badge */}
                {inCart && (
                  <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs font-mono shadow-lg">
                    {inCart.quantity}
                  </div>
                )}
                <div className="w-full h-32 rounded-xl bg-primary-pale mb-4 flex items-center justify-center text-primary font-black text-4xl group-hover:scale-105 transition-transform shrink-0">
                  {item.name.charAt(0)}
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="font-black text-text-primary mb-2 line-clamp-2 text-base leading-tight uppercase tracking-tight">{item.name}</h3>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="text-primary font-black text-lg font-mono">KES {Number(item.price).toLocaleString()}</span>
                    <div className="p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={20} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Side: Cart Panel */}
      <div className="w-[450px] flex flex-col bg-surface border-l border-border shadow-2xl shrink-0">
        <div className="p-6 border-b border-border bg-bg/30 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-text-primary flex items-center gap-2 uppercase tracking-tighter">
                <Receipt size={24} className="text-primary" />
                Cart
              </h2>
            </div>
            <p className="text-sm text-text-secondary font-bold">Table {context?.tableName || 'T1'} · {context?.guestCount || 2} Guests</p>
          </div>
          <button 
            onClick={clearCart}
            className="p-2 text-text-secondary hover:text-error transition-colors"
            title="Clear Cart"
          >
            <Trash2 size={20} />
          </button>
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
            (['kitchen', 'bar'] as Destination[]).map(dest => {
              const groupItems = cart.filter(c => destinationOf(c) === dest);
              if (groupItems.length === 0) return null;
              return (
                <div key={dest} className="space-y-2">
                  <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                    dest === 'bar' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                  }`}>
                    {dest === 'bar' ? <Coffee size={12} /> : <Utensils size={12} />}
                    {dest === 'bar' ? 'Bar' : 'Kitchen'} · {groupItems.length} item{groupItems.length > 1 ? 's' : ''}
                  </div>
                  {groupItems.map(item => (
                    <div key={item.id} className="flex flex-col gap-2 p-3 bg-bg rounded-2xl border border-border animate-in slide-in-from-right-4 duration-200">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-primary-pale flex items-center justify-center font-black text-primary shrink-0">
                          {item.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-text-primary uppercase truncate tracking-tight">{item.name}</h4>
                          <p className="text-xs text-primary font-bold font-mono">KES {Number(item.price).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:text-primary transition-all active:scale-90"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-xs font-black font-mono">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:text-primary transition-all active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => requestRemove(item)}
                          className="p-1.5 text-text-secondary hover:text-error transition-all active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Note Field */}
                      <div className="flex items-center gap-2 px-2 py-1 bg-surface/50 rounded-lg border border-dashed border-border group">
                        <MessageSquare size={14} className="text-text-secondary" />
                        <input
                          type="text"
                          placeholder="Add special instructions..."
                          value={item.note || ''}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                          className="flex-1 bg-transparent text-[10px] font-bold focus:outline-none placeholder:text-text-secondary/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
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

      <VoidItemModal
        isOpen={voidingItem !== null}
        onClose={() => setVoidingItem(null)}
        onConfirm={confirmRemove}
        itemName={voidingItem?.name || ''}
      />
    </div>
  );
};

export default OrderEntry;
