import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChefHat, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Order, OrderStatus } from '../../types';

const STATUS_FLOW: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'BILLED', 'COMPLETED',
];

const statusVariant: Record<OrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'> = {
  PENDING: 'warning', CONFIRMED: 'primary', PREPARING: 'info', READY: 'purple',
  SERVED: 'success', BILLED: 'success', OUT_FOR_DELIVERY: 'orange',
  DELIVERED: 'success', COMPLETED: 'success', CANCELLED: 'danger',
};

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED'];

export function PosPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pos-orders'],
    queryFn: () => ordersApi.getHistory({ limit: 50 }),
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated!');
      qc.invalidateQueries({ queryKey: ['pos-orders'] });
    },
    onError: () => toast.error('Failed to update status.'),
  });

  const orders = (data?.data?.data ?? []).filter((o: Order) =>
    filter === 'ALL' ? ACTIVE_STATUSES.includes(o.status) : o.status === filter,
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">POS / Kitchen</h1>
            <p className="text-sm text-gray-500">Manage active orders</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', ...ACTIVE_STATUSES] as (OrderStatus | 'ALL')[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : orders.length === 0 ? (
        <EmptyState title="No active orders" description="All clear in the kitchen!" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order: Order) => (
            <PosOrderCard
              key={order.id}
              order={order}
              onStatusChange={(status) => updateStatus.mutate({ orderId: order.id, status })}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PosOrderCard({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: Order;
  onStatusChange: (s: OrderStatus) => void;
  isUpdating: boolean;
}) {
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;

  return (
    <Card className="border-l-4" style={{
      borderLeftColor: ({
        PENDING: '#f59e0b', CONFIRMED: '#3b82f6', PREPARING: '#06b6d4',
        READY: '#8b5cf6', SERVED: '#10b981', BILLED: '#10b981',
        OUT_FOR_DELIVERY: '#f97316', DELIVERED: '#10b981',
        COMPLETED: '#10b981', CANCELLED: '#ef4444',
      } as Record<string, string>)[order.status] ?? '#e5e7eb',
    }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">#{order.orderNumber}</span>
            <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
          </div>
          <span className="text-xs text-gray-400">{order.orderType.replace('_', ' ')}</span>
        </div>
        {order.tableNumber && (
          <p className="mt-1 text-xs text-gray-500">Table {order.tableNumber}</p>
        )}
      </CardHeader>
      <CardBody className="py-3">
        <div className="space-y-1">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.menuItem?.name ?? 'Item'}</span>
              <span className="font-medium text-gray-900">×{item.quantity}</span>
            </div>
          ))}
        </div>
        {order.notes && (
          <p className="mt-2 text-xs italic text-amber-600 border-t border-gray-100 pt-2">
            📝 {order.notes}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="font-bold text-gray-900">${Number(order.total).toFixed(2)}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={() => onStatusChange('CANCELLED')}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            {nextStatus && (
              <Button
                size="sm"
                onClick={() => onStatusChange(nextStatus)}
                isLoading={isUpdating}
              >
                → {nextStatus}
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
