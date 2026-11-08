import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, Check, X, Trash2 } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => base44.entities.Review.list('-created_date', 500).then(setReviews).catch(err => setError(err.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const setStatus = async (review, status) => {
    setError('');
    try { await base44.entities.Review.update(review.id, { status }); await load(); }
    catch (err) { setError(err.message || 'Review could not be updated.'); }
  };
  const remove = async review => {
    if (!window.confirm('Delete this review?')) return;
    try { await base44.entities.Review.delete(review.id); await load(); }
    catch (err) { setError(err.message || 'Review could not be deleted.'); }
  };
  return <div className="space-y-6">
    <div><h1 className="font-serif text-3xl text-foreground">Review Moderation</h1><p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">Only approved reviews appear publicly</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading ? <p className="text-sm text-muted-foreground">Loading reviews…</p> : reviews.map(review => <article key={review.id} className="border border-border bg-card p-5 space-y-3">
      <div className="flex flex-wrap justify-between gap-3"><div><div className="text-sm text-foreground">{review.guest_name}</div><div className="flex gap-1 mt-1">{Array.from({ length: review.rating || 5 }).map((_, i) => <Star key={i} size={12} className="text-primary" fill="currentColor" />)}</div></div><span className="text-xs uppercase tracking-widest text-primary">{review.status || 'pending'}</span></div>
      <div className="font-serif text-xl text-foreground">{review.headline}</div><p className="text-sm text-muted-foreground">{review.body}</p>
      <div className="flex gap-2">
        {review.status !== 'approved' && <button onClick={() => setStatus(review, 'approved')} className="h-9 px-3 border border-primary/30 text-xs text-primary inline-flex items-center gap-2"><Check size={13} /> Approve</button>}
        {review.status !== 'rejected' && <button onClick={() => setStatus(review, 'rejected')} className="h-9 px-3 border border-border text-xs text-muted-foreground inline-flex items-center gap-2"><X size={13} /> Reject</button>}
        <button onClick={() => remove(review)} className="h-9 px-3 border border-destructive/30 text-xs text-destructive inline-flex items-center gap-2"><Trash2 size={13} /> Delete</button>
      </div>
    </article>)}
  </div>;
}
