import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewsApi } from '../../api/reviews';
import { ordersApi } from '../../api/orders';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Card, CardBody } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Review, Order } from '../../types';

function Stars({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange?.(s)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`h-4 w-4 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const [showWrite, setShowWrite] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewsApi.getMine({ limit: 50 }),
  });

  const reviews = data?.data?.data ?? [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rate the dishes you've ordered</p>
        </div>
        <Button onClick={() => setShowWrite(true)}>
          <Plus className="h-4 w-4" /> Write Review
        </Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Rate your ordered dishes to help us improve!"
          action={<Button onClick={() => setShowWrite(true)}>Write your first review</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review: Review) => (
            <Card key={review.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.menuItem?.name ?? 'Dish'}</p>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600 italic">"{review.comment}"</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <WriteReviewModal open={showWrite} onClose={() => setShowWrite(false)} />
    </div>
  );
}

function WriteReviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [orderId, setOrderId] = useState('');
  const [orderItemId, setOrderItemId] = useState('');
  const [menuItemId, setMenuItemId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: ordersRes } = useQuery({
    queryKey: ['orders-for-review'],
    queryFn: () => ordersApi.getHistory({ limit: 50 }),
    enabled: open,
  });

  const orders: Order[] = (ordersRes?.data?.data ?? []).filter(
    (o: Order) => ['COMPLETED', 'DELIVERED', 'BILLED'].includes(o.status),
  );

  const selectedOrder = orders.find((o) => o.id === orderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !orderItemId || !menuItemId) {
      toast.error('Please select an order and item.');
      return;
    }
    setLoading(true);
    try {
      await reviewsApi.create({ orderId, orderItemId, menuItemId, rating, comment: comment || undefined });
      toast.success('Review submitted!');
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      onClose();
      setOrderId(''); setOrderItemId(''); setMenuItemId(''); setRating(5); setComment('');
    } catch {
      toast.error('Failed to submit review. You may have already reviewed this item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Write a Review" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Order *</label>
          <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={orderId} onChange={(e) => { setOrderId(e.target.value); setOrderItemId(''); setMenuItemId(''); }} required>
            <option value="">Select completed order...</option>
            {orders.map((o) => <option key={o.id} value={o.id}>Order #{o.orderNumber}</option>)}
          </select>
        </div>

        {selectedOrder && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Item to review *</label>
            <select className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={orderItemId} onChange={(e) => {
              const item = selectedOrder.items.find(i => i.id === e.target.value);
              setOrderItemId(e.target.value);
              setMenuItemId(item?.menuItemId ?? '');
            }} required>
              <option value="">Select item...</option>
              {selectedOrder.items.map((item) => (
                <option key={item.id} value={item.id}>{item.menuItem?.name ?? 'Item'}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Rating *</label>
          <div className="mt-2">
            <Stars rating={rating} interactive onChange={setRating} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Comment (optional)</label>
          <textarea rows={3} maxLength={800} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Submit Review</Button>
        </div>
      </form>
    </Modal>
  );
}
