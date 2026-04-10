import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders';
import { tablesApi } from '../../api/tables';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { OrderType } from '../../types';

export function CartPage() {
  const qc = useQueryClient();
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const { data: cartRes, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: ordersApi.getCart,
  });

  const clearCart = useMutation({
    mutationFn: ordersApi.clearCart,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cart'] }); toast.success('Cart cleared'); },
    onError: () => toast.error('Failed to clear cart'),
  });

  const cart = cartRes?.data?.data;
  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.menuItem?.price ?? 0) * item.quantity, 0);

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Cart</h1>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearCart.mutate()} isLoading={clearCart.isPending}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Browse the menu and add dishes you'd like to order."
          action={<Button onClick={() => window.history.back()}>Browse menu</Button>}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Items ({items.length})</h2>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </CardFooter>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowPlaceOrder(true)}
          >
            <ShoppingBag className="h-5 w-5" />
            Place Order
          </Button>
        </>
      )}

      <PlaceOrderModal
        open={showPlaceOrder}
        onClose={() => setShowPlaceOrder(false)}
        total={total}
      />
    </div>
  );
}

function CartItemRow({ item }: { item: { id: string; menuItemId: string; menuItem?: { name: string; price: number; imageUrl?: string }; quantity: number } }) {
  const qc = useQueryClient();

  const updateItem = useMutation({
    mutationFn: ({ qty }: { qty: number }) => {
      // The cart doesn't have orderId at cart stage — we add/update the item
      return ordersApi.addToCart(item.menuItemId, qty);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Update failed'),
  });

  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
        {item.menuItem?.imageUrl ? (
          <img src={item.menuItem.imageUrl} alt="" className="h-full w-full rounded-lg object-cover" />
        ) : '🍽️'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.menuItem?.name ?? 'Item'}</p>
        <p className="text-xs text-gray-500">${Number(item.menuItem?.price ?? 0).toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateItem.mutate({ qty: Math.max(1, item.quantity - 1) })}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => updateItem.mutate({ qty: item.quantity + 1 })}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <span className="w-16 text-right text-sm font-bold text-gray-900">
        ${(Number(item.menuItem?.price ?? 0) * item.quantity).toFixed(2)}
      </span>
    </div>
  );
}

function PlaceOrderModal({
  open,
  onClose,
  total,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
}) {
  const qc = useQueryClient();
  const [orderType, setOrderType] = useState<OrderType>('TAKEAWAY');
  const [tableId, setTableId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: tablesRes } = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getAll,
    enabled: orderType === 'DINE_IN',
  });

  const tables = tablesRes?.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderType === 'DINE_IN' && !tableId) {
      toast.error('Please select a table for dine-in orders.');
      return;
    }
    setLoading(true);
    try {
      await ordersApi.placeOrder({
        orderType,
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        notes: notes || undefined,
      });
      toast.success('Order placed successfully!');
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      onClose();
    } catch {
      toast.error('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Place Order" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Order type</label>
          <div className="mt-1 flex gap-2">
            {(['TAKEAWAY', 'DINE_IN', 'DELIVERY'] as OrderType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${orderType === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {orderType === 'DINE_IN' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Table *</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              required
            >
              <option value="">Select a table...</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>{t.code} ({t.seats} seats)</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions..."
          />
        </div>

        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 flex justify-between">
          <span>Order total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Confirm order</Button>
        </div>
      </form>
    </Modal>
  );
}
