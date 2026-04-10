import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { tablesApi } from '../../api/tables';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DiningTable, TableStatus } from '../../types';

const statusVariant: Record<TableStatus, 'success' | 'danger' | 'warning'> = {
  AVAILABLE: 'success',
  OCCUPIED: 'danger',
  RESERVED: 'warning',
};

const statusColors: Record<TableStatus, string> = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50',
  OCCUPIED: 'border-red-200 bg-red-50',
  RESERVED: 'border-amber-200 bg-amber-50',
};

export function TablesPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getAll,
  });

  const updateStatus = useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: TableStatus }) =>
      tablesApi.updateStatus(tableId, status),
    onSuccess: () => { toast.success('Table updated!'); qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: () => toast.error('Failed to update table.'),
  });

  const tables = data?.data?.data ?? [];

  const counts = tables.reduce((acc: Record<string, number>, t: DiningTable) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dining Tables</h1>
          <p className="text-sm text-gray-500 mt-0.5">Floor plan & status</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Table
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        {(['AVAILABLE', 'OCCUPIED', 'RESERVED'] as TableStatus[]).map((s) => (
          <div key={s} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{counts[s] ?? 0}</p>
            <p className="text-xs text-gray-500">{s}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : tables.length === 0 ? (
        <EmptyState title="No tables configured" description="Add dining tables to start managing your floor." action={<Button onClick={() => setShowCreate(true)}>Add first table</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table: DiningTable) => (
            <div
              key={table.id}
              className={`rounded-xl border-2 p-4 text-center shadow-sm transition-all ${statusColors[table.status]}`}
            >
              <p className="text-xl font-bold text-gray-900">{table.code}</p>
              <p className="text-xs text-gray-500 mt-0.5">{table.seats} seats</p>
              <Badge variant={statusVariant[table.status]} className="mt-2">
                {table.status}
              </Badge>
              {table.assignedWaiter && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
                  <UserCheck className="h-3 w-3" />
                  {table.assignedWaiter.fullName?.split(' ')[0]}
                </div>
              )}
              <div className="mt-3 flex flex-col gap-1">
                {table.status !== 'AVAILABLE' && (
                  <button
                    onClick={() => updateStatus.mutate({ tableId: table.id, status: 'AVAILABLE' })}
                    className="w-full rounded-lg bg-white px-2 py-1 text-xs font-medium text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
                  >
                    Free
                  </button>
                )}
                {table.status === 'AVAILABLE' && (
                  <button
                    onClick={() => updateStatus.mutate({ tableId: table.id, status: 'OCCUPIED' })}
                    className="w-full rounded-lg bg-white px-2 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Occupy
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTableModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function CreateTableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ code: '', seats: '4' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await tablesApi.create({ code: form.code, seats: parseInt(form.seats) });
      toast.success('Table added!');
      qc.invalidateQueries({ queryKey: ['tables'] });
      onClose();
      setForm({ code: '', seats: '4' });
    } catch {
      toast.error('Failed to add table. Code may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Dining Table" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Table Code *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="T01, T02..." value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Seats *</label>
          <input type="number" min="1" max="30" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} required />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Add Table</Button>
        </div>
      </form>
    </Modal>
  );
}
