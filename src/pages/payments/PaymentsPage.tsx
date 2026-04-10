import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CreditCard, CheckCircle, Clock, XCircle, Plus, DollarSign, Calendar, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { paymentsApi } from "../../api/payments";
import { ordersApi } from "../../api/orders";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import type { UserRole, PaymentMethod, PaymentStatus, Payment } from "../../types";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  TRANSFER: "Transfer",
};

const STATUS_CONFIGS: Record<PaymentStatus, { variant: "success" | "warning" | "danger" | "info"; icon: React.ReactNode }> = {
  PAID:     { variant: "success", icon: <CheckCircle className="h-3 w-3" /> },
  PENDING:  { variant: "warning", icon: <Clock className="h-3 w-3" /> },
  REFUNDED: { variant: "danger",  icon: <XCircle className="h-3 w-3" /> },
  FAILED:   { variant: "danger",  icon: <AlertCircle className="h-3 w-3" /> },
};

const STAFF_ROLES: UserRole[] = ["ADMIN", "MANAGER", "EMPLOYEE"];

export function PaymentsPage() {
  const { user } = useAuth();
  const isStaff = user ? STAFF_ROLES.includes(user.role) : false;
  const [tab, setTab] = useState<"payments" | "closing">("payments");
  const [showCreate, setShowCreate] = useState(false);
  const [showClosing, setShowClosing] = useState(false);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage payment transactions</p>
        </div>
        {isStaff && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowClosing(true)}>
              <Calendar className="h-4 w-4" /> Daily Closing
            </Button>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New Payment
            </Button>
          </div>
        )}
      </div>

      {isStaff && (
        <div className="flex gap-1 border-b border-gray-200">
          {["payments", "closing"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as typeof tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${
                tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "closing" ? "Daily Closings" : "Payments"}
            </button>
          ))}
        </div>
      )}

      {tab === "payments" ? <PaymentsList isStaff={isStaff} /> : <ClosingsList />}

      <CreatePaymentModal open={showCreate} onClose={() => setShowCreate(false)} />
      <DailyClosingModal open={showClosing} onClose={() => setShowClosing(false)} />
    </div>
  );
}

function PaymentsList({ isStaff }: { isStaff: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => (isStaff ? paymentsApi.getAll() : paymentsApi.getMine()),
  });

  const payments: Payment[] = (data as any)?.data?.data ?? [];

  if (isLoading) return <PageLoader />;
  if (payments.length === 0) return <EmptyState title="No payments" description="No payment records found." />;

  return (
    <div className="space-y-3">
      {payments.map((p) => {
        const statusCfg = STATUS_CONFIGS[p.status as PaymentStatus] ?? { variant: "default" as const, icon: null };
        return (
          <Card key={p.id}>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Order #{String(p.orderId).slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {METHOD_LABELS[p.method as PaymentMethod]}  {new Date(p.createdAt).toLocaleString()}
                    </p>
                    {p.transactionRef && (
                      <p className="text-xs text-gray-400">Ref: {p.transactionRef}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-bold text-gray-900">${Number(p.amount).toFixed(2)}</span>
                  <Badge variant={statusCfg.variant}>
                    <span className="flex items-center gap-1">{statusCfg.icon} {p.status}</span>
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function ClosingsList() {
  const { data, isLoading } = useQuery({
    queryKey: ["daily-closings"],
    queryFn: () => paymentsApi.getDailyClosing(),
  });

  const closing = (data as any)?.data?.data;
  const closings = closing ? [closing] : [];

  if (isLoading) return <PageLoader />;
  if (closings.length === 0) return <EmptyState title="No closings yet" description="Run a daily closing to record end-of-day totals." />;

  return (
    <div className="space-y-3">
      {closings.map((c: any, idx: number) => (
        <Card key={idx}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{new Date(c.date ?? c.closedAt ?? Date.now()).toLocaleDateString()}</p>
                <div className="flex gap-4 mt-1 text-sm text-gray-500">
                  <span>Cash: <span className="font-medium text-gray-900">${Number(c.cashTotal ?? 0).toFixed(2)}</span></span>
                  <span>Card: <span className="font-medium text-gray-900">${Number(c.cardTotal ?? 0).toFixed(2)}</span></span>
                  <span>Transfer: <span className="font-medium text-gray-900">${Number(c.transferTotal ?? 0).toFixed(2)}</span></span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">${Number(c.total ?? c.totalRevenue ?? 0).toFixed(2)}</p>
                <p className="text-xs text-gray-400">{c.transactionCount ?? 0} transactions</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function CreatePaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ orderId: string; amount: string; method: PaymentMethod; transactionRef: string }>({
    orderId: "", amount: "", method: "CASH", transactionRef: "",
  });
  const [loading, setLoading] = useState(false);

  const { data: ordersData } = useQuery({ queryKey: ["orders-all"], queryFn: () => ordersApi.getHistory() });
  const orders = (ordersData as any)?.data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId) { toast.error("Select an order."); return; }
    setLoading(true);
    try {
      await paymentsApi.create({
        orderId: form.orderId,
        amount: parseFloat(form.amount),
        method: form.method,
        transactionRef: form.transactionRef || undefined,
      });
      toast.success("Payment recorded!");
      qc.invalidateQueries({ queryKey: ["payments"] });
      onClose();
      setForm({ orderId: "", amount: "", method: "CASH", transactionRef: "" });
    } catch {
      toast.error("Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Payment" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Order *</label>
          <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} required>
            <option value="">Select order</option>
            {orders.map((o: any) => (
              <option key={o.id} value={o.id}>#{String(o.id).slice(0, 8).toUpperCase()}  ${Number(o.total).toFixed(2)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amount *</label>
          <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Method *</label>
          <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}>
            {(Object.entries(METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {form.method !== "CASH" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Transaction ref.</label>
            <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Optional reference" value={form.transactionRef} onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}><DollarSign className="h-4 w-4" /> Record</Button>
        </div>
      </form>
    </Modal>
  );
}

function DailyClosingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [actualCash, setActualCash] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    if (!actualCash) { toast.error("Enter actual cash amount."); return; }
    setLoading(true);
    try {
      await paymentsApi.closeDailyCash({ actualCash: parseFloat(actualCash) });
      toast.success("Daily closing completed!");
      qc.invalidateQueries({ queryKey: ["daily-closings"] });
      onClose();
      setActualCash("");
    } catch {
      toast.error("Failed to run daily closing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Daily Closing" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          This will record today&apos;s end-of-day cash count. The system will automatically compute card and transfer totals.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700">Actual cash in drawer ($) *</label>
          <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={actualCash} onChange={(e) => setActualCash(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleClose} isLoading={loading}>Run Closing</Button>
        </div>
      </div>
    </Modal>
  );
}
