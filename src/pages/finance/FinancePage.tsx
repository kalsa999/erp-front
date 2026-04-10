import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { financeApi } from '../../api/finance';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { StatCard } from '../../components/ui/StatCard';
import type { ExpenseCategory, Expense } from '../../types';

export function FinancePage() {
  const [tab, setTab] = useState<'overview' | 'expenses' | 'revenue'>('overview');
  const [page, setPage] = useState(1);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const year = new Date().getFullYear();

  const { data: monthlyRes, isLoading: loadingMonthly } = useQuery({
    queryKey: ['monthly-profit', year],
    queryFn: () => financeApi.getMonthlyProfit(year),
    enabled: tab === 'overview',
  });

  const { data: expensesRes, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => financeApi.getExpenses({ page, limit: 15 }),
    enabled: tab === 'expenses',
  });

  const monthlyData = monthlyRes?.data?.data ?? [];
  const expenses = expensesRes?.data?.data ?? [];
  const expensesMeta = expensesRes?.data?.meta;

  const totalRevenue = monthlyData.reduce((s: number, m: { revenue: number }) => s + Number(m.revenue), 0);
  const totalExpenses = monthlyData.reduce((s: number, m: { expenses: number }) => s + Number(m.expenses), 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue, expenses & P&L</p>
        </div>
        <Button onClick={() => setShowAddExpense(true)}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} iconBg="bg-blue-50" iconColor="text-blue-600" subtitle={`${year}`} />
          <StatCard title="Total Expenses" value={`$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={TrendingDown} iconBg="bg-red-50" iconColor="text-red-600" subtitle={`${year}`} />
          <StatCard title="Net Profit" value={`$${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={TrendingUp} iconBg={netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'} iconColor={netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} subtitle={`${year}`} />
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'overview', label: 'P&L Overview' },
          { key: 'expenses', label: 'Expenses' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key as typeof tab); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        loadingMonthly ? <PageLoader /> :
        monthlyData.length === 0 ? <EmptyState title="No financial data" description="Data will appear once transactions are recorded." /> :
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Monthly P&L — {year}</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(v) => `$${Number(v).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      ) : (
        loadingExpenses ? <PageLoader /> :
        expenses.length === 0 ? <EmptyState title="No expenses recorded" description="Track your expenses here." /> :
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp: Expense) => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{exp.title}</td>
                    <td className="px-6 py-3">
                      <Badge variant={exp.category === 'FIXED' ? 'primary' : 'warning'}>{exp.category}</Badge>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">${Number(exp.amount).toFixed(2)}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{exp.notes ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expensesMeta && <Pagination page={page} total={expensesMeta.total} limit={expensesMeta.limit} onChange={setPage} />}
          </CardBody>
        </Card>
      )}

      <AddExpenseModal open={showAddExpense} onClose={() => setShowAddExpense(false)} />
    </div>
  );
}

function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', category: 'FIXED' as ExpenseCategory, amount: '',
    expenseDate: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await financeApi.createExpense({
        title: form.title,
        category: form.category,
        amount: parseFloat(form.amount),
        expenseDate: form.expenseDate,
        notes: form.notes || undefined,
      });
      toast.success('Expense recorded!');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['monthly-profit'] });
      onClose();
      setForm({ title: '', category: 'FIXED', amount: '', expenseDate: new Date().toISOString().slice(0, 10), notes: '' });
    } catch {
      toast.error('Failed to record expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Expense" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
              <option value="FIXED">Fixed</option>
              <option value="VARIABLE">Variable</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount *</label>
            <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date *</label>
          <input type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea rows={2} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
