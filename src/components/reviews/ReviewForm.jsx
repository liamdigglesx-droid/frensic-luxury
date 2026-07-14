import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import RatingInput from '@/components/reviews/RatingInput';

const emptyForm = { guest_name: '', service_type: 'stay', rating: 5, headline: '', body: '' };
const fieldClass = 'w-full bg-transparent p-3 text-sm outline-none';
const fieldStyle = { border: '1px solid rgba(255,255,255,0.12)', color: '#F9F9F9' };

export default function ReviewForm({ onSubmitted }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault(); setSubmitting(true); setMessage('');
    try {
      const review = await base44.entities.Review.create(form);
      onSubmitted(review); setForm(emptyForm); setMessage('Thank you. Your review has been submitted.');
    } catch {
      setMessage('Your review could not be submitted. Please try again.');
    } finally { setSubmitting(false); }
  };
  return (
    <form onSubmit={submit} className="p-6 md:p-8 space-y-5" style={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h3 className="font-serif text-2xl" style={{ color: '#F9F9F9' }}>Share Your Experience</h3>
      <RatingInput value={form.rating} onChange={value => update('rating', value)} />
      <input required value={form.guest_name} onChange={e => update('guest_name', e.target.value)} placeholder="Your name" aria-label="Your name" className={fieldClass} style={fieldStyle} />
      <select value={form.service_type} onChange={e => update('service_type', e.target.value)} aria-label="Service type" className={fieldClass} style={{ ...fieldStyle, backgroundColor: '#080808' }}>
        <option value="stay">Apartment stay</option><option value="drive">Car rental</option>
      </select>
      <input required value={form.headline} onChange={e => update('headline', e.target.value)} placeholder="Review headline" aria-label="Review headline" className={fieldClass} style={fieldStyle} />
      <textarea required rows={5} value={form.body} onChange={e => update('body', e.target.value)} placeholder="Write your review" aria-label="Written review" className={fieldClass} style={fieldStyle} />
      {message && <p className="text-sm" role="status" style={{ color: message.startsWith('Thank') ? '#C9A84C' : '#f87171' }}>{message}</p>}
      <button disabled={submitting} className="w-full h-12 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-60" style={{ backgroundColor: '#C9A84C', color: '#050505' }}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}