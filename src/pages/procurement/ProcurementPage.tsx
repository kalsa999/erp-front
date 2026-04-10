import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Truck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { procurementApi } from '../../api/procurement';
import { inventoryApi } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { SupplierOrderStatus, Supplier, SupplierOrder } from '../../types';

const statusVariant: Record<SupplierOrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'danger',
};

export function ProcurementPage() {
  const [tab, setTab] = useState<'orders' | 'suppliers'>('orders');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const qc = useQueryClient();

  const { data: ordersRes, isLoading: loadingOrders } = useQuery({
    queryKey: ['supplier-orders'],
    queryFn: procurementApi.getOrders,
    enabled: tab === 'orders',
  });

  const { data: suppliersRes, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: procurementApi.getSuppliers,
    enabled: tab === 'suppliers',
  });

  const receiveOrder = useMutation({
    mutationFn: procurementApi.receiveOrder,
    onSuccess: () => { toast.success('Order received — stock updated!'); qc.invalidateQueries({ queryKey: ['supplier-orders'] }); },
    onError: () => toast.error('Failed to receive order.'),
  });

  const orders = ordersRes?.data?.data ?? [];
  const suppliers = suppliersRes?.data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suppliers & purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowNewSupplier(true)}>
            <Plus className="h-4 w-4" /> Supplier
          </Button>
          <Button onClick={() => setShowNewOrder(true)}>
            <Plus className="h-4 w-4" /> Purchase Order
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'orders', label: 'Purchase Orders' },
          { key: 'suppliers', label: 'Suppliers' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        loadingOrders ? <PageLoader /> :
        orders.length === 0 ? <EmptyState title="No purchase orders" /> :
        <div className="space-y-3">
          {orders.map((order: SupplierOrder) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{order.supplier?.name ?? 'Supplier'}</p>
                    <p className="text-xs text-gray-500">{new Date(order.orderedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">${Number(order.totalAmount).toFixed(2)}</span>
                    <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="py-3">
                <div className="space-y-1 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600">
                      <span>{item.ingredient?.name ?? 'Ingredient'}</span>
                      <span>{String(item.quantity)} × ${Number(item.unitCost).toFixed(2)} = ${Number(item.lineTotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => receiveOrder.mutate(order.id)}
                      isLoading={receiveOrder.isPending}
                    >
                      <CheckCircle className="h-4 w-4" /> Mark Received
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        loadingSuppliers ? <PageLoader /> :
        suppliers.length === 0 ? <EmptyState title="No suppliers" description="Add your first supplier." /> :
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Phone</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((s: Supplier) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-3 text-gray-500">{s.email ?? '–'}</td>
                    <td className="px-6 py-3 text-gray-500">{s.phone ?? '–'}</td>
                    <td className="px-6 py-3">
                      <Badge variant={s.isActive ? 'success' : 'danger'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <CreateSupplierModal open={showNewSupplier} onClose={() => setShowNewSupplier(false)} />
      <CreateOrderModal open={showNewOrder} onClose={() => setShowNewOrder(false)} />
    </div>
  );
}

function CreateSupplierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await procurementApi.createSupplier({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      });
      toast.success('Supplier created!');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      onClose();
      setForm({ name: '', email: '', phone: '', address: '' });
    } catch {
      toast.error('Failed to create supplier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Supplier" size="sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ingredientId: '', quantity: '', unitCost: '' }]);
  const [loading, setLoading] = useState(false);

  const { data: suppliersRes } = useQuery({ queryKey: ['suppliers'], queryFn: procurementApi.getSuppliers, enabled: open });
  const { data: ingredientsRes } = useQuery({ queryKey: ['all-ingredients'], queryFn: inventoryApi.getIngredients, enabled: open });

  const suppliers = suppliersRes?.data?.data ?? [];
  const ingredients = ingredientsRes?.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.ingredientId && i.quantity && i.unitCost);
    if (!supplierId || validItems.length === 0) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await procurementApi.createOrder({
        supplierId,
        notes: notes || undefined,
        items: validItems.map(i => ({
          ingredientId: i.ingredientId,
          quantity: parseFloat(i.quantity),
          unitCost: parseFloat(i.unitCost),
        })),
      });
      toast.success('Purchase order created!');
      qc.invalidateQueries({ queryKey: ['supplier-orders'] });
      onClose();
      setSupplierId(''); setNotes(''); setItems([{ ingredientId: '', quantity: '', unitCost: '' }]);
    } catch {
      toast.error('Failed to create order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Purchase Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier *</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="">Select supplier...</option>
              {suppliers.map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Items *</label>
            <Button type="button" size="sm" variant="ghost" onClick={() => setItems([...items, { ingredientId: '', quantity: '', unitCost: '' }])}>
              <Plus className="h-3 w-3" /> Add line
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <select
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={item.ingredientId}
                  onChange={(e) => { const n = [...items]; n[i].ingredientId = e.target.value; setItems(n); }}
                >
                  <option value="">Ingredient...</option>
                  {ingredients.map((ing: { id: string; name: string }) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                </select>
                <input type="number" step="0.01" min="0" placeholder="Qty" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={item.quantity} onChange={(e) => { const n = [...items]; n[i].quantity = e.target.value; setItems(n); }} />
                <input type="number" step="0.01" min="0" placeholder="Unit cost" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={item.unitCost} onChange={(e) => { const n = [...items]; n[i].unitCost = e.target.value; setItems(n); }} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}><Truck className="h-4 w-4" /> Create Order</Button>
        </div>
      </form>
    </Modal>
  );
}
