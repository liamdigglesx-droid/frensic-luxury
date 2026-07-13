import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gauge, Zap, Users, Settings2, CheckCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { CARS } from '@/lib/constants';
import AvailabilityBadge from '@/components/AvailabilityBadge';

const SEAT_OPTIONS = ['Any', '4', '5', '7+'];
const STYLE_OPTIONS = ['Any', ...new Set(CARS.map(c => c.style))];

export default function Cars() {
  const [search, setSearch] = useState('');
  const [seatFilter, setSeatFilter] = useState('Any');
  const [styleFilter, setStyleFilter] = useState('Any');
  const [maxPrice, setMaxPrice] = useState('');

  const filtered = CARS.filter(car => {
    const q = search.toLowerCase();
    if (q && !car.name.toLowerCase().includes(q) && !car.style.toLowerCase().includes(q) && !car.description.toLowerCase().includes(q)) return false;
    if (seatFilter !== 'Any') {
      if (seatFilter === '7+' && car.seats < 7) return false;
      else if (seatFilter !== '7+' && car.seats !== parseInt(seatFilter)) return false;
    }
    if (styleFilter !== 'Any' && car.style !== styleFilter) return false;
    if (maxPrice && car.price_per_day > parseInt(maxPrice)) return false;
    return true;
  });

  const hasFilters = search || seatFilter !== 'Any' || styleFilter !== 'Any' || maxPrice;

  const clearFilters = () => {
    setSearch('');
    setSeatFilter('Any');
    setStyleFilter('Any');
    setMaxPrice('');
  };

  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* Page Hero */}
      <section
        className="relative h-64 md:h-80 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/6e5a5ceee_generated_3119a26d.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.2), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#C9A84C' }}>Home / Cars</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Cars</h1>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-6 lg:px-16 pt-12 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-48 relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#888888' }} />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-10 pr-4 text-sm bg-transparent outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            {/* Vehicle Style */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#888888' }}>Type</span>
              <div className="flex gap-1 flex-wrap">
                {STYLE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setStyleFilter(opt)}
                    className="px-3 h-10 text-xs transition-all whitespace-nowrap"
                    style={{
                      border: `1px solid ${styleFilter === opt ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: styleFilter === opt ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: styleFilter === opt ? '#C9A84C' : '#888888',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Seats */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#888888' }}>Seats</span>
              <div className="flex gap-1">
                {SEAT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSeatFilter(opt)}
                    className="px-3 h-10 text-xs transition-all"
                    style={{
                      border: `1px solid ${seatFilter === opt ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: seatFilter === opt ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: seatFilter === opt ? '#C9A84C' : '#888888',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#888888' }}>Max Price / Day (₦)</span>
              <input
                type="number"
                placeholder="e.g. 150000"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="h-10 px-4 text-sm bg-transparent outline-none w-44"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 h-10 text-xs transition-all self-end"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888888'; }}
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div className="mt-4 text-xs" style={{ color: '#888888' }}>
            {filtered.length === CARS.length
              ? `Showing all ${CARS.length} vehicles`
              : `Showing ${filtered.length} of ${CARS.length} vehicles`}
          </div>
        </div>
      </section>

      {/* Cars List */}
      <section className="py-12 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <SlidersHorizontal size={40} className="mx-auto mb-4" style={{ color: '#333' }} />
              <p className="text-lg font-serif mb-2" style={{ color: '#888888' }}>No vehicles match your filters</p>
              <button onClick={clearFilters} className="text-sm underline" style={{ color: '#C9A84C' }}>Clear all filters</button>
            </div>
          ) : (
            <div className="space-y-24">
              {filtered.map((car, i) => (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch"
                  style={i % 2 === 1 ? { direction: 'rtl' } : {}}
                >
                  <div style={{ direction: 'ltr' }} className="relative overflow-hidden min-h-[420px]">
                    <img
                      src={car.image_url}
                      alt={car.name}
                      className="w-full h-full object-cover absolute inset-0 hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute top-6 left-6 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase" style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}>
                      {car.style}
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <AvailabilityBadge itemId={car.id} bookingType="drive" />
                    </div>
                  </div>
                  <div
                    className="flex flex-col justify-center p-10 lg:p-16"
                    style={{ backgroundColor: '#080808', direction: 'ltr' }}
                  >
                    <h3 className="font-serif text-3xl mb-3" style={{ color: '#F9F9F9' }}>{car.name}</h3>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>{car.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {[
                        { icon: Zap, label: 'Horsepower', value: `${car.horsepower} HP` },
                        { icon: Gauge, label: 'Top Speed', value: car.top_speed },
                        { icon: Users, label: 'Seating', value: `${car.seats} Seats` },
                        { icon: Settings2, label: 'Transmission', value: car.transmission },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <Icon size={14} style={{ color: '#C9A84C' }} />
                          <div>
                            <div className="text-[10px] tracking-widest uppercase" style={{ color: '#888888' }}>{label}</div>
                            <div className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-8">
                      <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: '#888888' }}>Features</div>
                      <div className="space-y-2">
                        {car.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-sm" style={{ color: '#888888' }}>
                            <CheckCircle size={13} style={{ color: '#C9A84C' }} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                      <div>
                        <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#888888' }}>From</div>
                        <div className="font-serif text-2xl" style={{ color: '#F9F9F9' }}>
                          ₦{car.price_per_day.toLocaleString()} <span className="text-sm font-sans" style={{ color: '#888888' }}>/ day</span>
                        </div>
                      </div>
                      <Link
                        to={`/book?type=drive&car=${car.id}`}
                        className="px-8 h-12 flex items-center text-xs tracking-[0.15em] uppercase font-medium transition-all"
                        style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a8873a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
                      >
                        Book This Car
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="mx-6 lg:mx-16 mb-20">
        <div
          className="relative p-12 md:p-20 overflow-hidden"
          style={{
            backgroundImage: `url(https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/8930a48a6_generated_66061811.png)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(5,5,5,0.82)' }} />
          <div className="relative z-10 max-w-lg">
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>Extend The Journey</div>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4" style={{ color: '#F9F9F9' }}>Extend The Journey and Keep the Experience</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>
              Why settle when the road still has more to offer? Whether it's one more day or an entire week, your perfect ride is ready.
            </p>
            <Link
              to="/book?type=drive"
              className="inline-flex px-8 h-12 items-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a8873a'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
            >
              Extend My Rental Today
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}