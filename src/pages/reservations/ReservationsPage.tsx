import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationsApi } from '../../api/reservations';
import { tablesApi } from '../../api/tables';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import type { ReservationStatus, Reservation } from '../../types';

const statusVariant: Record<ReservationStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  PENDING: 'warning', CONFIRMED: 'primary', SEATED: 'info',
  COMPLETED: 'success', CANCELLED: 'danger', NO_SHOW: 'default',
};

export function ReservationsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const isClient = user?.role === 'CLIENT';

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, isClient],
    queryFn: () =>
      isClient
        ? reservationsApi.getMine({ page, limit: 10 })
        : reservationsApi.getAll({ page, limit: 10 }),
  });

  const cancelMutation = useMutation({
    mutationFn: reservationsApi.cancel,
    onSuccess: () => { toast.success('Reservation cancelled.'); queryClient.invalidateQueries({ queryKey: ['reservations'] }); },
    onError: () => toast.error('Failed to cancel.'),
  });

  const queryClient = useQueryClient();

  const reservations = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isClient ? 'Your reservations' : 'All table reservations'}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Reservation
        </Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No reservations"
          description="Book a table for your guests."
          action={<Button onClick={() => setShowCreate(true)}>Book a table</Button>}
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {reservations.map((r: Reservation) => (
                <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        Table {r.table?.code ?? r.tableId} · {r.guestCount} guests
                      </p>
                      <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {new Date(r.startAt).toLocaleString()} – {new Date(r.endAt).toLocaleTimeString()}
                    </p>
                    {r.notes && <p className="mt-0.5 text-xs italic text-gray-400">{r.notes}</p>}
                  </div>
                  {r.status !== 'CANCELLED' && r.status !== 'COMPLETED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => cancelMutation.mutate(r.id)}
                      isLoading={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {meta && <Pagination page={page} total={meta.total} limit={meta.limit} onChange={setPage} />}
          </CardBody>
        </Card>
      )}

      <CreateReservationModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function CreateReservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    tableId: '',
    guestCount: '2',
    startAt: '',
    endAt: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const { data: tablesRes } = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getAll,
    enabled: open,
  });

  const tables = tablesRes?.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tableId || !form.startAt || !form.endAt) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      await reservationsApi.create({
        tableId: form.tableId,
        guestCount: parseInt(form.guestCount),
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        notes: form.notes || undefined,
      });
      toast.success('Reservation created!');
      qc.invalidateQueries({ queryKey: ['reservations'] });
      onClose();
      setForm({ tableId: '', guestCount: '2', startAt: '', endAt: '', notes: '' });
    } catch {
      toast.error('Failed to create reservation. The table may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Reservation" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Table *</label>
          <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} required>
            <option value="">Select table...</option>
            {tables.map((t: { id: string; code: string; seats: number }) => <option key={t.id} value={t.id}>{t.code} ({t.seats} seats)</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Guests *</label>
          <input type="number" min="1" max="20" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start *</label>
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End *</label>
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special requests..." />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Book Table</Button>
        </div>
      </form>
    </Modal>
  );
}
