import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Star, Trash2, MapPin, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../../api/clients';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ClientAddress, MenuItem } from '../../types';

export function ProfilePage() {
  const [tab, setTab] = useState<'addresses' | 'preferences' | 'favorites'>('addresses');
  const [showAddAddress, setShowAddAddress] = useState(false);

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your addresses, preferences and favourites</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'addresses', label: 'Addresses', icon: MapPin },
          { key: 'preferences', label: 'Preferences', icon: Settings },
          { key: 'favorites', label: 'Favourites', icon: Star },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'addresses' && <AddressesSection onAdd={() => setShowAddAddress(true)} />}
      {tab === 'preferences' && <PreferencesSection />}
      {tab === 'favorites' && <FavoritesSection />}

      <AddAddressModal open={showAddAddress} onClose={() => setShowAddAddress(false)} />
    </div>
  );
}

function AddressesSection({ onAdd }: { onAdd: () => void }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: clientsApi.getAddresses,
  });

  const setDefault = useMutation({
    mutationFn: clientsApi.setDefaultAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-addresses'] }); toast.success('Default address set!'); },
    onError: () => toast.error('Failed.'),
  });

  const deleteAddr = useMutation({
    mutationFn: clientsApi.deleteAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-addresses'] }); toast.success('Address deleted.'); },
    onError: () => toast.error('Failed.'),
  });

  const addresses = data?.data?.data ?? [];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={onAdd}><Plus className="h-4 w-4" /> Add address</Button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState title="No addresses" description="Add a delivery address." action={<Button size="sm" onClick={onAdd}>Add address</Button>} />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr: ClientAddress) => (
            <Card key={addr.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{addr.label}</p>
                      {addr.isDefault && <Badge variant="primary">Default</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{addr.addressLine}</p>
                    <p className="text-sm text-gray-500">{addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!addr.isDefault && (
                      <Button size="sm" variant="ghost" onClick={() => setDefault.mutate(addr.id)}>
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteAddr.mutate(addr.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PreferencesSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-preferences'], queryFn: clientsApi.getPreferences });
  const [form, setForm] = useState({ dietaryRestrictions: '', allergens: '', preferredDeliveryNotes: '', marketingOptIn: false });
  const [initialized, setInitialized] = useState(false);

  const prefs = data?.data?.data;
  if (prefs && !initialized) {
    setForm({
      dietaryRestrictions: prefs.dietaryRestrictions ?? '',
      allergens: prefs.allergens ?? '',
      preferredDeliveryNotes: prefs.preferredDeliveryNotes ?? '',
      marketingOptIn: prefs.marketingOptIn,
    });
    setInitialized(true);
  }

  const updatePref = useMutation({
    mutationFn: () => clientsApi.updatePreferences(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-preferences'] }); toast.success('Preferences updated!'); },
    onError: () => toast.error('Failed to update.'),
  });

  if (isLoading) return <PageLoader />;

  return (
    <Card>
      <CardHeader><h2 className="font-semibold text-gray-900">My Preferences</h2></CardHeader>
      <CardBody className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dietary restrictions</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Halal, Vegan..." value={form.dietaryRestrictions} onChange={(e) => setForm({ ...form, dietaryRestrictions: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Allergens</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Peanuts, Gluten..." value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Delivery notes</label>
          <textarea rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.preferredDeliveryNotes} onChange={(e) => setForm({ ...form, preferredDeliveryNotes: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.marketingOptIn} onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })} className="rounded border-gray-300 text-blue-600" />
          Receive marketing communications
        </label>
        <div className="flex justify-end">
          <Button onClick={() => updatePref.mutate()} isLoading={updatePref.isPending}>Save preferences</Button>
        </div>
      </CardBody>
    </Card>
  );
}

function FavoritesSection() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-favorites'], queryFn: clientsApi.getFavorites });

  const removeFav = useMutation({
    mutationFn: clientsApi.removeFavorite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-favorites'] }); toast.success('Removed from favourites.'); },
    onError: () => toast.error('Failed.'),
  });

  const favorites = data?.data?.data ?? [];

  if (isLoading) return <PageLoader />;
  if (favorites.length === 0) return <EmptyState title="No favourites" description="Use the menu page to add dishes to your favourites." />;

  return (
    <div className="grid grid-cols-2 gap-4">
      {favorites.map((item: MenuItem) => (
        <Card key={item.id}>
          <CardBody>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-blue-600 font-bold mt-0.5">${Number(item.price).toFixed(2)}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeFav.mutate(item.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function AddAddressModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ label: '', addressLine: '', city: '', postalCode: '', isDefault: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clientsApi.createAddress({
        label: form.label, addressLine: form.addressLine,
        city: form.city, postalCode: form.postalCode || undefined,
        isDefault: form.isDefault,
      });
      toast.success('Address saved!');
      qc.invalidateQueries({ queryKey: ['my-addresses'] });
      onClose();
      setForm({ label: '', addressLine: '', city: '', postalCode: '', isDefault: false });
    } catch {
      toast.error('Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Address" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Label *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Home, Office..." value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">City *</label>
            <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal code</label>
            <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-gray-300 text-blue-600" />
          Set as default address
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
