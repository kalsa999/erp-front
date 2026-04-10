import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, History, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoryApi } from '../../api/inventory';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import type { StockMovementType, InventoryItem } from '../../types';

export function InventoryPage() {
  const [tab, setTab] = useState<'inventory' | 'low-stock' | 'movements'>('inventory');
  const [page, setPage] = useState(1);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);

  const { data: inventoryRes, isLoading } = useQuery({
    queryKey: ['inventory', page],
    queryFn: () => inventoryApi.getInventory({ page, limit: 15 }),
    enabled: tab === 'inventory',
  });

  const { data: lowStockRes, isLoading: loadingLow } = useQuery({
    queryKey: ['low-stock-full'],
    queryFn: () => inventoryApi.getLowStock({ limit: 50 }),
    enabled: tab === 'low-stock',
  });

  const { data: movementsRes, isLoading: loadingMov } = useQuery({
    queryKey: ['movements', page],
    queryFn: () => inventoryApi.getMovements({ page, limit: 15 }),
    enabled: tab === 'movements',
  });

  const inventoryItems = inventoryRes?.data?.data ?? [];
  const inventoryMeta = inventoryRes?.data?.meta;
  const lowStock = lowStockRes?.data?.data ?? [];
  const movements = movementsRes?.data?.data ?? [];
  const movementsMeta = movementsRes?.data?.meta;

  const loading = isLoading || loadingLow || loadingMov;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Stock management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddMovement(true)}>
            <History className="h-4 w-4" /> Stock Movement
          </Button>
          <Button onClick={() => setShowAddIngredient(true)}>
            <Plus className="h-4 w-4" /> Ingredient
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'inventory', label: 'All Stock', icon: Package },
          { key: 'low-stock', label: 'Low Stock Alerts', icon: AlertTriangle },
          { key: 'movements', label: 'Movement History', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key as typeof tab); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : tab === 'inventory' ? (
        <InventoryTable items={inventoryItems} meta={inventoryMeta} page={page} onPageChange={setPage} />
      ) : tab === 'low-stock' ? (
        <LowStockTable items={lowStock} />
      ) : (
        <MovementsTable items={movements} meta={movementsMeta} page={page} onPageChange={setPage} />
      )}

      <AddIngredientModal open={showAddIngredient} onClose={() => setShowAddIngredient(false)} />
      <AddMovementModal open={showAddMovement} onClose={() => setShowAddMovement(false)} />
    </div>
  );
}

function InventoryTable({
  items,
  meta,
  page,
  onPageChange,
}: {
  items: InventoryItem[];
  meta?: { total: number; limit: number; page: number };
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (items.length === 0) return <EmptyState title="No inventory items" description="Add ingredients first." />;

  return (
    <Card>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Ingredient</th>
                <th className="px-6 py-3 text-left">Unit</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-right">Min Level</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isLow = Number(item.currentStock) <= Number(item.ingredient?.minStockLevel ?? 0);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{item.ingredient?.name}</td>
                    <td className="px-6 py-3 text-gray-500">{item.ingredient?.unit}</td>
                    <td className={`px-6 py-3 text-right font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {String(item.currentStock)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">{String(item.ingredient?.minStockLevel)}</td>
                    <td className="px-6 py-3">
                      <Badge variant={isLow ? 'danger' : 'success'}>{isLow ? 'Low' : 'OK'}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {meta && <Pagination page={page} total={meta.total} limit={meta.limit} onChange={onPageChange} />}
      </CardBody>
    </Card>
  );
}

function LowStockTable({ items }: { items: InventoryItem[] }) {
  if (items.length === 0)
    return <EmptyState title="No low-stock alerts" description="All ingredients are well stocked!" />;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="font-semibold text-gray-900">{items.length} items below minimum stock level</h2>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">{item.ingredient?.name}</p>
                <p className="text-xs text-gray-500">Min: {String(item.ingredient?.minStockLevel)} {item.ingredient?.unit}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">{String(item.currentStock)} {item.ingredient?.unit}</p>
                <p className="text-xs text-gray-500">
                  Deficit: {(Number(item.ingredient?.minStockLevel) - Number(item.currentStock)).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function MovementsTable({
  items,
  meta,
  page,
  onPageChange,
}: {
  items: { id: string; ingredient?: { name: string; unit: string }; type: string; quantity: string | number; reason?: string; createdAt: string }[];
  meta?: { total: number; limit: number; page: number };
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (items.length === 0) return <EmptyState title="No movements recorded" description="Stock movements will appear here." />;

  return (
    <Card>
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Ingredient</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-left">Reason</th>
                <th className="px-6 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{m.ingredient?.name ?? '–'}</td>
                  <td className="px-6 py-3">
                    <Badge variant={m.type === 'IN' ? 'success' : m.type === 'OUT' ? 'danger' : 'warning'}>
                      {m.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-right font-medium">{String(m.quantity)} {m.ingredient?.unit}</td>
                  <td className="px-6 py-3 text-gray-500">{m.reason ?? '–'}</td>
                  <td className="px-6 py-3 text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && <Pagination page={page} total={meta.total} limit={meta.limit} onChange={onPageChange} />}
      </CardBody>
    </Card>
  );
}

function AddIngredientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', unit: '', minStockLevel: '', initialStock: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryApi.createIngredient({
        name: form.name,
        unit: form.unit,
        minStockLevel: parseFloat(form.minStockLevel),
        initialStock: parseFloat(form.initialStock),
      });
      toast.success('Ingredient created!');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
      setForm({ name: '', unit: '', minStockLevel: '', initialStock: '' });
    } catch {
      toast.error('Failed to create ingredient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Ingredient" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="kg, L, pcs..." value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min stock *</label>
            <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Initial stock *</label>
            <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: e.target.value })} required />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddMovementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ingredientId: '', type: 'IN' as StockMovementType, quantity: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const { data: ingredientsRes } = useQuery({
    queryKey: ['all-ingredients'],
    queryFn: inventoryApi.getIngredients,
    enabled: open,
  });

  const ingredients = ingredientsRes?.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inventoryApi.addMovement({
        ingredientId: form.ingredientId,
        type: form.type,
        quantity: parseFloat(form.quantity),
        reason: form.reason || undefined,
      });
      toast.success('Stock movement recorded!');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['movements'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      onClose();
      setForm({ ingredientId: '', type: 'IN', quantity: '', reason: '' });
    } catch {
      toast.error('Failed to record movement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Stock Movement" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ingredient *</label>
          <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.ingredientId} onChange={(e) => setForm({ ...form, ingredientId: e.target.value })} required>
            <option value="">Select...</option>
            {ingredients.map((ing: { id: string; name: string; unit: string }) => (
              <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type *</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as StockMovementType })}>
              <option value="IN">IN (received)</option>
              <option value="OUT">OUT (used)</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity *</label>
            <input type="number" step="0.01" min="0.01" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Reason</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Record</Button>
        </div>
      </form>
    </Modal>
  );
}
