import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ChevronRight, Receipt, ArrowLeft, Loader2, CheckCircle2, ShoppingCart, PlusCircle, ChevronDown, ChevronUp, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface ExistingOrderItem {
  id: string;
  name?: string;
  quantity: number;
  unit_price: number;
  is_cooked: boolean;
}

const BAR_CATEGORIES = new Set(['Drinks', 'Cocktails', 'Beverages', 'Hot Drinks']);
const destinationOf = (item: MenuItem): Destination => {
  if (item.production_area) return item.production_area;
  if (item.category_name && BAR_CATEGORIES.has(item.category_name)) return 'bar';
  return 'kitchen';
};

interface OrderEntryProps {
  context: { tableId: string; tableName: string; guestCount: number; existingOrderId?: string } | null;
  waiterId: string;
  isWaiter?: boolean;
  onBack: () => void;
  onOrderPlaced?: () => void;
}

const AUTO_LOGOUT_SECONDS = 3;

const OrderEntry: React.FC<OrderEntryProps> = ({ context, waiterId, isWaiter = false, onBack, onOrderPlaced }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(AUTO_LOGOUT_SECONDS);
  const [voidingItem, setVoidingItem] = useState<CartItem | null>(null);
  const [existingItems, setExistingItems] = useState<ExistingOrderItem[]>([]);
  const [showExistingItems, setShowExistingItems] = useState(true);
  const isAddToBillMode = Boolean(context?.existingOrderId);

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

  // Fetch existing order items when in Add-to-Bill mode
  useEffect(() => {
    if (context?.existingOrderId && context?.tableId) {
      orderApi.getByTable(context.tableId)
        .then((order: any) => setExistingItems(order.items || []))
        .catch(() => setExistingItems([]));
    }
  }, [context?.existingOrderId, context?.tableId]);

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

  const newItemsTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const existingTotal = existingItems.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setIsSending(true);
    try {
      if (isAddToBillMode && context?.existingOrderId) {
        // Add-to-Bill: PATCH existing order
        await orderApi.addItems(context.existingOrderId, cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          notes: item.note || ''
        })));
      } else {
        // New order: POST
        await orderApi.create({
          id: crypto.randomUUID(),
          table_id: context?.tableId || 'T1',
          waiter_id: waiterId || 'W1',
          guest_count: context?.guestCount || 1,
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            notes: item.note || ''
          }))
        });
      }
      setIsSuccess(true);
      if (!isWaiter) {
        setTimeout(() => {
          setCart([]);
          setIsSuccess(false);
          if (onOrderPlaced) onOrderPlaced();
          else onBack();
        }, 2000);
      }
      // Waiter path: countdown effect below drives the logout
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-success/10 text-success rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-success/10">
          <CheckCircle2 size={56} />
        </div>
        <h2 className="text-4xl font-black text-text-primary mb-3 tracking-tighter uppercase">
          {isAddToBillMode ? 'Items Added!' : 'Order Sent!'}
        </h2>
        <p className="text-text-secondary text-lg font-medium opacity-70">
          {isAddToBillMode ? 'New items appended to the existing bill.' : 'The production units have been notified.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px-48px)] gap-0 overflow-hidden bg-bg/50 rounded-[2.5rem] border border-border/40 shadow-inner relative">
      {/* Left Side: Category Rail - Compact */}
      <div className="w-20 flex flex-col bg-white border-r border-border/40 overflow-y-auto shrink-0 py-6 px-2 gap-3">
        <div className="flex items-center justify-center mb-4">
          <div className="p-2 bg-primary/5 rounded-xl text-primary">
            <ShoppingCart size={18} />
          </div>
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`
              flex flex-col items-center justify-center p-2.5 rounded-[1.5rem] aspect-square transition-all duration-300 relative group
              ${selectedCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                : 'text-text-secondary hover:bg-bg/80 hover:text-primary'
              }
            `}
          >
            <span className="text-[9px] font-black uppercase tracking-tight text-center leading-[1.1] z-10 break-words">
              {cat}
            </span>
            {selectedCategory === cat && (
              <motion.div 
                layoutId="activeCat"
                className="absolute inset-0 bg-primary rounded-[1.5rem] -z-0"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Center: Menu Selection - Auto-filling Grid */}
      <div className="flex-1 flex flex-col min-w-0 py-6 px-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 p-3 bg-white border border-border/40 rounded-xl text-text-secondary hover:text-primary transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={20} />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-6 rounded-[1.5rem] bg-white border border-border/40 focus:outline-none focus:border-primary/50 transition-all text-base font-bold tracking-tight shadow-sm"
            />
          </div>

          <div className={`hidden lg:flex items-center gap-3 px-4 h-12 border rounded-[1.5rem] shadow-sm shrink-0 ${
            isAddToBillMode ? 'bg-info/10 border-info/30' : 'bg-white border-border/40'
          }`}>
            {isAddToBillMode && <PlusCircle size={14} className="text-info" />}
            <span className={`text-sm font-black leading-none ${isAddToBillMode ? 'text-info' : 'text-primary'}`}>
              {context?.tableName || 'T1'}
            </span>
            <div className="w-px h-4 bg-border/60" />
            <span className={`text-sm font-black leading-none ${isAddToBillMode ? 'text-info' : 'text-primary'}`}>
              {isAddToBillMode ? 'Add to Bill' : `${context?.guestCount || 2}p`}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <motion.div 
            layout
            className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5 pb-10"
          >
            <AnimatePresence mode="popLayout">
              {filteredMenu.map((item, idx) => {
                const dest = destinationOf(item);
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: idx * 0.01 }}
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="group relative flex flex-col p-5 text-left bg-white rounded-[2rem] border border-border/40 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all active:scale-[0.98]"
                  >
                    <div className="absolute top-3 right-3">
                      <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        dest === 'bar' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                      }`}>
                        {dest}
                      </div>
                    </div>

                    <div className="w-full h-32 rounded-[1.5rem] bg-bg flex items-center justify-center text-primary/20 font-black text-5xl group-hover:scale-105 transition-transform duration-500 overflow-hidden mb-4">
                      {item.name.charAt(0)}
                    </div>

                    <div className="flex flex-col flex-1">
                      <h3 className="font-black text-text-primary leading-tight uppercase tracking-tight text-sm line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                      
                      <div className="mt-auto flex justify-between items-center pt-3 border-t border-dashed border-border/60">
                        <span className="text-lg font-black text-primary font-mono tracking-tighter">
                          {Number(item.price).toLocaleString()}
                        </span>
                        {inCart ? (
                          <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">
                            {inCart.quantity}
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-primary/5 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                            <Plus size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Cart Panel */}
      <div className="w-[380px] flex flex-col bg-white border-l border-border/40 shadow-2xl shrink-0">
        <div className={`p-6 border-b border-border/40 flex items-center justify-between ${isAddToBillMode ? 'bg-info/5' : 'bg-bg/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isAddToBillMode ? 'bg-info/10' : 'bg-primary/10'}`}>
              {isAddToBillMode
                ? <PlusCircle size={18} className="text-info" />
                : <Receipt size={18} className="text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-text-primary uppercase tracking-tighter leading-none">
                {isAddToBillMode ? 'Add to Bill' : 'Cart'}
              </h2>
              {isAddToBillMode && (
                <p className="text-[10px] font-bold text-info/70 uppercase tracking-widest mt-0.5">Appending to existing order</p>
              )}
            </div>
          </div>
          <button onClick={clearCart} className="p-2 text-text-secondary hover:text-error transition-all">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Collapsible existing bill items */}
        {isAddToBillMode && existingItems.length > 0 && (
          <div className="border-b border-border/40">
            <button
              onClick={() => setShowExistingItems(p => !p)}
              className="w-full flex items-center justify-between px-6 py-3 hover:bg-bg/50 transition-colors"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-secondary">
                Current Bill ({existingItems.length} item{existingItems.length !== 1 ? 's' : ''})
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-text-secondary font-mono">KES {existingTotal.toLocaleString()}</span>
                {showExistingItems ? <ChevronUp size={14} className="text-text-secondary" /> : <ChevronDown size={14} className="text-text-secondary" />}
              </div>
            </button>
            <AnimatePresence>
              {showExistingItems && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 space-y-2 bg-bg/30">
                    {existingItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-dashed border-border/40 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 ${item.is_cooked ? 'bg-success' : 'bg-warning'}`}>
                            {item.quantity}
                          </span>
                          <span className="text-xs font-bold text-text-secondary truncate">{item.name || '—'}</span>
                        </div>
                        <span className="text-xs font-black text-text-secondary font-mono shrink-0 ml-2">
                          {(Number(item.unit_price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {isAddToBillMode && cart.length > 0 && (
            <div className="text-[9px] font-black uppercase tracking-[0.15em] text-info flex items-center gap-2">
              <PlusCircle size={12} /> New Items to Add
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center opacity-20 px-8">
                <ShoppingCart size={48} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">
                  {isAddToBillMode ? 'Select items to add' : 'Select Items'}
                </p>
              </div>
            ) : (
              (['kitchen', 'bar'] as Destination[]).map(dest => {
                const groupItems = cart.filter(c => destinationOf(c) === dest);
                if (groupItems.length === 0) return null;
                return (
                  <div key={dest} className="space-y-3">
                    <div className={`text-[9px] font-black uppercase tracking-widest ${dest === 'bar' ? 'text-info' : 'text-warning'}`}>
                      {dest} Orders
                    </div>
                    {groupItems.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={item.id} 
                        className="flex flex-col gap-3 p-4 bg-bg/50 rounded-[1.5rem] border border-border/40 hover:bg-white transition-all"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-xs text-text-primary uppercase truncate">{item.name}</h4>
                            <p className="text-xs text-primary font-mono">{Number(item.price).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-border/40 shadow-sm">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-bg transition-all">
                              <Minus size={12} />
                            </button>
                            <span className="w-4 text-center text-[10px] font-black">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-bg transition-all">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => requestRemove(item)} className="p-1.5 text-text-secondary hover:text-error">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Notes..."
                          value={item.note || ''}
                          onChange={(e) => updateNote(item.id, e.target.value)}
                          className="bg-white/50 px-3 py-1.5 rounded-lg text-[9px] font-bold focus:outline-none border border-transparent focus:border-primary/20"
                        />
                      </motion.div>
                    ))}
                  </div>
                );
              })
            )}
          </AnimatePresence>
        </div>{/* end flex-1 scrollable */}

        {/* Summary Footer */}
        <div className="p-6 border-t border-border/40 bg-surface shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.03)] space-y-4">
          <div className="space-y-2">
            {isAddToBillMode && existingItems.length > 0 && (
              <div className="flex justify-between text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">
                <span>Existing Bill</span>
                <span className="font-mono">KES {existingTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-black text-text-secondary uppercase tracking-widest">
              <span>{isAddToBillMode ? 'New Items' : 'Subtotal'}</span>
              <span className="font-mono">KES {newItemsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-border/60">
              <span className="text-xs font-black uppercase tracking-widest text-text-primary">
                {isAddToBillMode ? 'Updated Total' : 'Total Payable'}
              </span>
              <span className="text-3xl font-black text-primary font-mono tracking-tighter">
                {(isAddToBillMode ? existingTotal + newItemsTotal : newItemsTotal).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            disabled={cart.length === 0 || isSending}
            onClick={handleSendToKitchen}
            className={`w-full h-16 rounded-[1.5rem] text-white text-base font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale overflow-hidden relative group ${
              isAddToBillMode ? 'bg-info hover:bg-info/90 shadow-info/20' : 'premium-gradient shadow-primary/20'
            }`}
          >
            {isSending ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                {isAddToBillMode && <PlusCircle size={18} />}
                {isAddToBillMode ? 'Add to Bill' : 'Place Order'}
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>{/* end Summary Footer */}
      </div>{/* end w-[380px] cart panel */}

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
