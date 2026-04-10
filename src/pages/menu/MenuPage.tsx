import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ShoppingCart, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuApi } from '../../api/menu';
import { ordersApi } from '../../api/orders';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import type { MenuItem, Category } from '../../types';

export function MenuPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  const { data: menuRes, isLoading } = useQuery({
    queryKey: ['menu', { search, categoryId, availableOnly, page }],
    queryFn: () =>
      menuApi.getItems({ search: search || undefined, categoryId: categoryId || undefined, availableOnly: availableOnly || undefined, page, limit: 12 }),
  });

  const { data: catRes } = useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.getCategories,
  });

  const addToCart = useMutation({
    mutationFn: (menuItemId: string) => ordersApi.addToCart(menuItemId, 1),
    onSuccess: () => {
      toast.success('Added to cart!');
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => toast.error('Failed to add to cart.'),
  });

  const items = menuRes?.data?.data ?? [];
  const meta = menuRes?.data?.meta;
  const categories = catRes?.data?.data ?? [];

  const isStaff = user?.role !== 'CLIENT';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse our dishes and formulas</p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCreateCategory(true)}>
              <Plus className="h-4 w-4" /> Category
            </Button>
            <Button onClick={() => setShowCreateItem(true)}>
              <Plus className="h-4 w-4" /> Item
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((c: Category) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Filter className="h-3 w-3" /> Available only
        </label>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState
          title="No menu items found"
          description="Try adjusting your filters"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item: MenuItem) => (
              <MenuItemCard
                key={item.id}
                item={item}
                isClient={user?.role === 'CLIENT'}
                onAddToCart={() => addToCart.mutate(item.id)}
              />
            ))}
          </div>
          {meta && (
            <Pagination page={page} total={meta.total} limit={meta.limit} onChange={setPage} />
          )}
        </>
      )}

      {/* Create item modal */}
      {isStaff && (
        <>
          <CreateItemModal
            open={showCreateItem}
            categories={categories}
            onClose={() => setShowCreateItem(false)}
          />
          <CreateCategoryModal
            open={showCreateCategory}
            onClose={() => setShowCreateCategory(false)}
          />
        </>
      )}
    </div>
  );
}

function MenuItemCard({
  item,
  isClient,
  onAddToCart,
}: {
  item: MenuItem;
  isClient: boolean;
  onAddToCart: () => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="danger">Unavailable</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</h3>
          <span className="flex-shrink-0 text-sm font-bold text-blue-600">${Number(item.price).toFixed(2)}</span>
        </div>
        {item.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {item.category && (
            <Badge variant="info">{item.category.name}</Badge>
          )}
          {isClient && item.isAvailable && (
            <Button size="sm" onClick={onAddToCart}>
              <ShoppingCart className="h-3 w-3" /> Add
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function CreateItemModal({
  open,
  categories,
  onClose,
}: {
  open: boolean;
  categories: Category[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) return;
    setLoading(true);
    try {
      await menuApi.createItem({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        isAvailable: form.isAvailable,
      });
      toast.success('Menu item created!');
      qc.invalidateQueries({ queryKey: ['menu'] });
      onClose();
      setForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true });
    } catch {
      toast.error('Failed to create item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add menu item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isAvailable"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="isAvailable" className="text-sm text-gray-700">Available for ordering</label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Create item</Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateCategoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await menuApi.createCategory(name.trim());
      toast.success('Category created!');
      qc.invalidateQueries({ queryKey: ['categories'] });
      onClose();
      setName('');
    } catch {
      toast.error('Failed to create category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create category" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category name *</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}
