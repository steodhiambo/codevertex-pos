import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { menuApi, orderApi } from '../lib/api';
import VoidItemModal from '../components/VoidItemModal';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  category_name?: string;
  production_area?: 'kitchen' | 'bar';
  image?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface ExistingOrderItem {
  id: string;
  name?: string;
  quantity: number;
  unit_price: number;
  is_cooked: boolean;
}

interface OrderEntryProps {
  context: { tableId: string; tableName: string; guestCount: number; existingOrderId?: string } | null;
  waiterId: string;
  onBack: () => void;
  onOrderPlaced?: () => void;
}

const OrderEntry: React.FC<OrderEntryProps> = ({ context, waiterId, onBack, onOrderPlaced }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [voidingItem, setVoidingItem] = useState<CartItem | null>(null);
  const [existingItems, setExistingItems] = useState<ExistingOrderItem[]>([]);
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
        setCategories(catNames);
        if (catNames.length > 0) setSelectedCategory(catNames[0]);
      } catch (error) {
        console.error('Failed to fetch menu data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  useEffect(() => {
    if (context?.existingOrderId && context?.tableId) {
      orderApi.getByTable(context.tableId)
        .then((order: any) => setExistingItems(order.items || []))
        .catch(() => setExistingItems([]));
    }
  }, [context?.existingOrderId, context?.tableId]);

  const filteredMenu = menuItems.filter(item =>
    (selectedCategory === '' || item.category_name === selectedCategory) &&
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
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    }));
  };

  const confirmRemove = (_reason: string) => {
    if (voidingItem) {
      setCart(prev => prev.filter(i => i.id !== voidingItem.id));
    }
    setVoidingItem(null);
  };

  const newItemsTotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const existingTotal = existingItems.reduce((sum, item) => sum + (Number(item.unit_price) * item.quantity), 0);

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setIsSending(true);
    try {
      if (isAddToBillMode && context?.existingOrderId) {
        await orderApi.addItems(context.existingOrderId, cart.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })));
      } else {
        await orderApi.create({
          id: crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); }),
          table_id: context?.tableId || 'T1',
          waiter_id: waiterId || 'W1',
          guest_count: context?.guestCount || 1,
          items: cart.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
          }))
        });
      }
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-xl font-black text-text-primary font-heading mb-1">
          {isAddToBillMode ? 'Items Added!' : 'Order Sent!'}
        </h2>
        <p className="text-sm text-text-secondary font-medium">
          {isAddToBillMode ? 'New items appended to the existing bill.' : 'Kitchen & Bar have been notified.'}
        </p>
      </div>
    );
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Void Item Modal */}
      {voidingItem && (
        <VoidItemModal
          isOpen={true}
          onClose={() => setVoidingItem(null)}
          onConfirm={confirmRemove}
          itemName={voidingItem.name}
        />
      )}

      {/* Add-to-Bill Banner */}
      {isAddToBillMode && existingItems.length > 0 && (
        <div className="bg-blue-50 px-3 py-1.5 text-[11px] text-blue-600 font-medium shrink-0">
          Current bill: {existingItems.length} items · KES {existingTotal.toLocaleString()}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border shrink-0 shadow-sm">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/30 transition-all active:scale-95"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-primary">{context?.tableName || 'Table'}</span>
          <span className="text-[10px] font-medium text-text-secondary bg-bg px-2 py-0.5 rounded-full">
            {context?.guestCount || 1} guests
          </span>
        </div>
        {isAddToBillMode && (
          <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full ml-auto border border-blue-200">
            + ADD TO BILL
          </span>
        )}
      </div>

      {/* Split Layout */}
      <div className="flex flex-1 overflow-hidden flex-wrap">
        {/* Left: Menu Area */}
        <div className="flex-[1_1_55%] min-w-[260px] flex flex-col bg-surface border-r border-border">
          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 h-9 rounded-lg border border-border text-xs outline-none focus:border-primary/50 transition-colors bg-bg"
              />
            </div>
          </div>

          {/* Categories (hide when searching) */}
          {!searchQuery && (
            <div className="flex gap-1 px-2 pb-2 overflow-x-auto shrink-0 scrollbar-thin">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface text-text-secondary border border-border hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {filteredMenu.length === 0 ? (
                <div className="col-span-full text-center py-12 text-text-secondary text-xs">
                  No items found
                </div>
              ) : filteredMenu.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`relative rounded-xl p-3 cursor-pointer border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      inCart
                        ? 'bg-primary/[0.04] border-primary/40 shadow-sm'
                        : 'bg-bg border-border hover:border-primary/30'
                    }`}
                  >
                    {inCart && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary text-white text-[8px] font-bold flex items-center justify-center shadow-sm">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="text-xs font-semibold leading-snug mb-1.5 text-text-primary line-clamp-2">{item.name}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-primary">KES {Number(item.price).toLocaleString()}</div>
                      {item.production_area === 'bar' && (
                        <span className="text-[8px] font-medium text-info bg-info/10 px-1.5 py-0.5 rounded">Bar</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart Area */}
        <div className="flex-[1_1_35%] min-w-[240px] flex flex-col bg-bg border-l border-border">
          {/* Cart Header */}
          <div className="px-3 py-2.5 border-b border-border bg-surface flex items-center gap-2 shrink-0">
            <ShoppingCart size={14} className="text-primary" />
            <span className="text-xs font-bold text-text-primary">Order</span>
            {cartCount > 0 && (
              <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-auto">
                {cartCount} items
              </span>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary px-4">
                <ShoppingCart size={32} className="opacity-20 mb-2" />
                <p className="text-[11px] font-medium opacity-50">Tap items from menu to start order</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-1">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 px-2.5 py-2 bg-surface rounded-xl border border-border shadow-sm hover:shadow transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-text-primary truncate">{item.name}</div>
                      <div className="text-[9px] text-text-secondary">
                        KES {Number(item.price).toLocaleString()} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md border border-border bg-surface flex items-center justify-center hover:border-primary hover:text-primary transition-all active:scale-90"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-bold text-text-primary w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md border border-border bg-surface flex items-center justify-center hover:border-primary hover:text-primary transition-all active:scale-90"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-primary min-w-[44px] text-right tabular-nums">
                      KES {(Number(item.price) * item.quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => setVoidingItem(item)}
                      className="w-5 h-5 rounded-md bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all active:scale-90"
                    >
                      <Trash2 size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="px-3 py-3 border-t border-border bg-surface space-y-2.5">
              {isAddToBillMode && existingItems.length > 0 && (
                <div className="flex justify-between text-[10px] text-text-secondary">
                  <span>Existing bill</span>
                  <span className="font-semibold">KES {existingTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total</span>
                <span className="text-lg font-black text-primary font-heading">
                  KES {(isAddToBillMode ? existingTotal + newItemsTotal : newItemsTotal).toLocaleString()}
                </span>
              </div>
              <button
                disabled={isSending}
                onClick={handleSendToKitchen}
                className="w-full h-11 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-light transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isSending ? (
                  <><Loader2 className="animate-spin" size={16} /> Sending...</>
                ) : (
                  <><CheckCircle size={16} /> {isAddToBillMode ? 'Add to Bill' : 'Place Order'}</>
                )}
              </button>
              <p className="text-[8px] text-text-secondary text-center opacity-50">Waiters auto-logout after placing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderEntry;
