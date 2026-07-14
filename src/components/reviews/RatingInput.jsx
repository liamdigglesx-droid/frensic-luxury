import { Star } from 'lucide-react';

export default function RatingInput({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#aaaaaa' }}>Rating</label>
      <div className="flex gap-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map(rating => (
          <button key={rating} type="button" role="radio" aria-checked={value === rating} aria-label={`${rating} star${rating > 1 ? 's' : ''}`} onClick={() => onChange(rating)}>
            <Star size={24} fill={rating <= value ? '#C9A84C' : 'transparent'} color={rating <= value ? '#C9A84C' : '#666666'} />
          </button>
        ))}
      </div>
    </div>
  );
}