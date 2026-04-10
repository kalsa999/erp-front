import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import {
  DollarSign, ShoppingBag, TrendingUp, Clock,
  AlertTriangle,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { inventoryApi } from '../../api/inventory';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
  const { data: overviewRes, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => dashboardApi.getOverview({ period: 'monthly' }),
  });

  const { data: lowStockRes } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryApi.getLowStock({ limit: 5 }),
  });

  const overview = overviewRes?.data?.data;
  const lowStock = lowStockRes?.data?.data ?? [];

  if (isLoading) return <PageLoader />;

  const revenueData = overview?.revenueByDay ?? [];
  const ordersByStatus = overview?.ordersByStatus ?? [];
  const ordersByType = overview?.ordersByType ?? [];
  const topItems = overview?.topSellingItems ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Restaurant performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${(overview?.totalRevenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subtitle="This month"
        />
        <StatCard
          title="Total Orders"
          value={overview?.totalOrders ?? 0}
          icon={ShoppingBag}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtitle="This month"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${(overview?.averageOrderValue ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Pending Orders"
          value={overview?.pendingOrders ?? 0}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subtitle="Needs attention"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
          </CardHeader>
          <CardBody>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No revenue data available yet
              </div>
            )}
          </CardBody>
        </Card>

        {/* Order distribution pie */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Orders by Type</h3>
          </CardHeader>
          <CardBody>
            {ordersByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={ordersByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(props) => {
                      const { name, percent } = props;
                      return `${name} ${((percent ?? 0) * 100).toFixed(0)}%`;
                    }}
                    labelLine={false}
                  >
                    {ordersByType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No order data yet
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top selling items */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Top Selling Items</h3>
          </CardHeader>
          <CardBody className="p-0">
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topItems} margin={{ left: -10, right: 10, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Qty sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400 px-6">
                No sales data yet
              </div>
            )}
          </CardBody>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
            {lowStock.length > 0 && (
              <Badge variant="danger">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {lowStock.length} items
              </Badge>
            )}
          </CardHeader>
          <CardBody className="p-0">
            {lowStock.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.ingredient?.name}</p>
                      <p className="text-xs text-gray-500">Min: {String(item.ingredient?.minStockLevel)} {item.ingredient?.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{String(item.currentStock)} {item.ingredient?.unit}</p>
                      <Badge variant="danger" className="mt-0.5">Low stock</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                All stock levels are healthy
              </div>
            )}
          </CardBody>
        </Card>

        {/* Orders by status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Orders by Status</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {ordersByStatus.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2">
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                    {count}
                  </span>
                </div>
              ))}
              {ordersByStatus.length === 0 && (
                <p className="text-sm text-gray-400">No order status breakdown available</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
