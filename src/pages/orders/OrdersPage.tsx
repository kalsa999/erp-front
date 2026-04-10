import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import type { Order, OrderStatus } from '../../types';

const statusVariant: Record<OrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'> = {
  PENDING: 'warning',
  CONFIRMED: 'primary',
  PREPARING: 'info',
  READY: 'purple',
  SERVED: 'success',
  BILLED: 'success',
  OUT_FOR_DELIVERY: 'orange',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function OrdersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.getHistory({ page, limit: 10 }),
  });

  const orders = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your order history</p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Place your first order from the menu."
          action={<Link to="/menu"><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">Browse menu</button></Link>}
        />
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-700">
              {meta?.total ?? orders.length} orders
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {orders.map((order: Order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    #{order.orderNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{order.orderType.replace('_', ' ')}</span>
                      <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {order.items?.length ?? 0} items · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${Number(order.total).toFixed(2)}</p>
                    <ChevronRight className="mt-0.5 h-4 w-4 text-gray-400 ml-auto" />
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
          {meta && (
            <Pagination page={page} total={meta.total} limit={meta.limit} onChange={setPage} />
          )}
        </Card>
      )}
    </div>
  );
}
