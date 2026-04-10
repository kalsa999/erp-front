import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import type { OrderStatus } from '../../types';

const statusVariant: Record<OrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange'> = {
  PENDING: 'warning', CONFIRMED: 'primary', PREPARING: 'info', READY: 'purple',
  SERVED: 'success', BILLED: 'success', OUT_FOR_DELIVERY: 'orange',
  DELIVERED: 'success', COMPLETED: 'success', CANCELLED: 'danger',
};

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getOrder(orderId!),
    enabled: !!orderId,
  });

  const order = data?.data?.data;

  if (isLoading) return <PageLoader />;
  if (!order) return <div className="p-6 text-gray-500">Order not found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={statusVariant[order.status]} className="text-sm px-3 py-1">
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Type', value: order.orderType.replace('_', ' ') },
          { label: 'Bill #', value: order.billNumber ?? '–' },
          { label: 'Table', value: order.tableNumber ? `#${order.tableNumber}` : '–' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="mt-1 font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Items</h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.menuItem?.name ?? 'Item'}</p>
                  <p className="text-xs text-gray-500">× {item.quantity} @ ${Number(item.unitPrice).toFixed(2)}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">${Number(item.totalPrice).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-6 py-4 space-y-1">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
          </div>
        </CardBody>
      </Card>

      {order.notes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Notes</p>
          <p className="mt-0.5">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
