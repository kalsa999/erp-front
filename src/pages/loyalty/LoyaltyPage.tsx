import { useQuery, useMutation } from '@tanstack/react-query';
import { Gift, Trophy, Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { loyaltyApi } from '../../api/loyalty';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import type { LoyaltyTransactionType } from '../../types';

const txTypeLabel: Record<LoyaltyTransactionType, { label: string; color: string }> = {
  EARN_ORDER: { label: 'Order reward', color: 'text-emerald-600' },
  BONUS_MILESTONE: { label: 'Milestone bonus', color: 'text-blue-600' },
  REDEEM_REWARD: { label: 'Reward redeemed', color: 'text-purple-600' },
  MANUAL_ADJUSTMENT: { label: 'Manual adjustment', color: 'text-gray-600' },
};

export function LoyaltyPage() {
  const [showRedeem, setShowRedeem] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['loyalty'],
    queryFn: loyaltyApi.getMyAccount,
  });

  const redeemMutation = useMutation({
    mutationFn: loyaltyApi.redeem,
    onSuccess: () => { toast.success('Reward redeemed!'); refetch(); setShowRedeem(false); },
    onError: () => toast.error('Redemption failed. Check your point balance.'),
  });

  const loyalty = data?.data?.data;
  const account = loyalty?.account;
  const transactions = loyalty?.transactions ?? [];

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
        <p className="text-sm text-gray-500 mt-0.5">Earn points with every order</p>
      </div>

      {/* Points card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Available Points</p>
            <p className="text-5xl font-bold mt-1">{account?.points ?? 0}</p>
            <p className="mt-2 text-sm opacity-70">
              {account?.lifetimePoints ?? 0} lifetime · {account?.completedOrders ?? 0} orders
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
            <Gift className="h-8 w-8" />
          </div>
        </div>
        <Button
          variant="secondary"
          className="mt-4 text-gray-900"
          onClick={() => setShowRedeem(true)}
          disabled={!account || account.points < 10}
        >
          <Star className="h-4 w-4" /> Redeem Reward
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Points', value: account?.points ?? 0, icon: Star },
          { label: 'Lifetime', value: account?.lifetimePoints ?? 0, icon: Trophy },
          { label: 'Orders', value: account?.completedOrders ?? 0, icon: Gift },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <Icon className="mx-auto h-5 w-5 text-blue-600" />
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody className="p-0">
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No transactions yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx: { id: string; type: LoyaltyTransactionType; pointsDelta: number; balanceAfter: number; reason?: string; createdAt: string }) => {
                const { label, color } = txTypeLabel[tx.type] ?? { label: tx.type, color: 'text-gray-600' };
                return (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className={`text-sm font-medium ${color}`}>{label}</p>
                      {tx.reason && <p className="text-xs text-gray-400">{tx.reason}</p>}
                      <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${tx.pointsDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.pointsDelta >= 0 ? '+' : ''}{tx.pointsDelta} pts
                      </p>
                      <p className="text-xs text-gray-400">Balance: {tx.balanceAfter}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Redeem modal */}
      <RedeemModal
        open={showRedeem}
        onClose={() => setShowRedeem(false)}
        currentPoints={account?.points ?? 0}
        onRedeem={(qty) => redeemMutation.mutate(qty)}
        isLoading={redeemMutation.isPending}
      />
    </div>
  );
}

function RedeemModal({
  open, onClose, currentPoints, onRedeem, isLoading,
}: {
  open: boolean; onClose: () => void; currentPoints: number; onRedeem: (qty: number) => void; isLoading: boolean;
}) {
  const [qty, setQty] = useState(1);
  return (
    <Modal open={open} onClose={onClose} title="Redeem Reward" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">You have <strong>{currentPoints}</strong> points. Each reward costs <strong>10 points</strong>.</p>
        <div>
          <label className="block text-sm font-medium text-gray-700">How many rewards?</label>
          <input type="number" min="1" max={Math.floor(currentPoints / 10)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} />
        </div>
        <p className="text-sm text-gray-500">This will use <strong>{qty * 10}</strong> points.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onRedeem(qty)} isLoading={isLoading}>Redeem</Button>
        </div>
      </div>
    </Modal>
  );
}
