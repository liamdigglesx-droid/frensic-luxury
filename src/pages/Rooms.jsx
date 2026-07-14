import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Tv, Users, Maximize2, BedDouble, Star, Search, SlidersHorizontal, X } from 'lucide-react';
import { ROOMS } from '@/lib/constants';
import AvailabilityBadge from '@/components/AvailabilityBadge';

const BEDROOM_OPTIONS = ['Any', '3', '4', '5+'];
const GUEST_OPTIONS = ['Any', '1-4', '5-8', '9+'];

export default function Rooms() {
  const [search, setSearch] = useState('');
  const [bedroomFilter, setBedroomFilter] = useState('Any');
  const [guestFilter, setGuestFilter] = useState('Any');
  const [maxPrice, setMaxPrice] = useState('');

  const filtered = ROOMS.filter(room => {
    // Search
    const q = search.toLowerCase();
    if (q && !room.name.toLowerCase().includes(q) && !room.tagline.toLowerCase().includes(q) && !room.description.toLowerCase().includes(q)) return false;
    // Bedrooms
    if (bedroomFilter !== 'Any') {
      if (bedroomFilter === '5+' && room.bedrooms < 5) return false;
      else if (bedroomFilter !== '5+' && room.bedrooms !== parseInt(bedroomFilter)) return false;
    }
    // Guests
    if (guestFilter !== 'Any') {
      if (guestFilter === '1-4' && room.max_guests > 4) return false;
      if (guestFilter === '5-8' && (room.max_guests < 5 || room.max_guests > 8)) return false;
      if (guestFilter === '9+' && room.max_guests < 9) return false;
    }
    // Max price
    if (maxPrice && room.price_per_night > parseInt(maxPrice)) return false;
    return true;
  });

  const hasFilters = search || bedroomFilter !== 'Any' || guestFilter !== 'Any' || maxPrice;

  const clearFilters = () => {
    setSearch('');
    setBedroomFilter('Any');
    setGuestFilter('Any');
    setMaxPrice('');
  };

  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* Page Hero */}
      <section
        className="relative h-64 md:h-80 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/9c3a71054_generated_30df4f42.png)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#C9A84C' }}>Home / Rooms</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Rooms</h1>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="px-6 lg:px-16 pt-12 pb-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#aaaaaa' }} />
              <input
                type="text"
                placeholder="Search suites..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-10 pr-4 text-sm bg-transparent outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            {/* Bedrooms */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#aaaaaa' }}>Bedrooms</span>
              <div className="flex gap-1">
                {BEDROOM_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setBedroomFilter(opt)}
                    className="px-3 h-10 text-xs transition-all"
                    style={{
                      border: `1px solid ${bedroomFilter === opt ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: bedroomFilter === opt ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: bedroomFilter === opt ? '#C9A84C' : '#888888',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Guests */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#aaaaaa' }}>Guests</span>
              <div className="flex gap-1">
                {GUEST_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setGuestFilter(opt)}
                    className="px-3 h-10 text-xs transition-all"
                    style={{
                      border: `1px solid ${guestFilter === opt ? '#C9A84C' : 'rgba(255,255,255,0.1)'}`,
                      backgroundColor: guestFilter === opt ? 'rgba(201,168,76,0.12)' : 'transparent',
                      color: guestFilter === opt ? '#C9A84C' : '#888888',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#aaaaaa' }}>Max Price / Night (₦)</span>
              <input
                type="number"
                placeholder="e.g. 300000"
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

          {/* Results count */}
          <div className="mt-4 text-xs" style={{ color: '#aaaaaa' }}>
            {filtered.length === ROOMS.length
              ? `Showing all ${ROOMS.length} suites`
              : `Showing ${filtered.length} of ${ROOMS.length} suites`}
          </div>
        </div>
      </section>

      {/* Rooms List */}
      <section className="py-12 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <SlidersHorizontal size={40} className="mx-auto mb-4" style={{ color: '#333' }} />
              <p className="text-lg font-serif mb-2" style={{ color: '#aaaaaa' }}>No suites match your filters</p>
              <button onClick={clearFilters} className="text-sm underline" style={{ color: '#C9A84C' }}>Clear all filters</button>
            </div>
          ) : (
            <div className="space-y-24">
              {filtered.map((room, i) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9 }}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
                  style={i % 2 === 1 ? { direction: 'rtl' } : {}}
                >
                  <div style={i % 2 === 1 ? { direction: 'ltr' } : {}} className="relative overflow-hidden min-h-[400px]">
                    <img
                      src={room.image_url}
                      alt={room.name}
                      className="w-full h-full object-cover absolute inset-0 hover:scale-105 transition-transform duration-1000"
                    />
                    <div className="absolute top-6 left-6 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase" style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}>
                      {room.tagline}
                    </div>
                    <div className="absolute bottom-6 left-6">
                      <AvailabilityBadge itemId={room.id} bookingType="stay" />
                    </div>
                  </div>
                  <div
                    className="flex flex-col justify-center p-10 lg:p-16"
                    style={{ backgroundColor: '#080808', direction: 'ltr' }}
                  >
                    <h3 className="font-serif text-3xl mb-3" style={{ color: '#F9F9F9' }}>{room.name}</h3>
                    <p className="text-sm leading-relaxed mb-8" style={{ color: '#aaaaaa' }}>{room.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {[
                        { icon: BedDouble, label: 'Bedrooms', value: room.bedrooms },
                        { icon: Users, label: 'Max Guests', value: room.max_guests },
                        { icon: Maximize2, label: 'Size', value: `${room.size_sqm} m²` },
                        { icon: Star, label: 'Rating', value: '5.0 / 5.0' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <Icon size={14} style={{ color: '#C9A84C' }} />
                          <div>
                            <div className="text-[10px] tracking-widest uppercase" style={{ color: '#aaaaaa' }}>{label}</div>
                            <div className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-8">
                      <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: '#aaaaaa' }}>Amenities</div>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map(a => (
                          <span key={a} className="px-3 py-1 text-xs" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}>{a}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                      <div>
                        <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#aaaaaa' }}>Starting From</div>
                        <div className="font-serif text-2xl" style={{ color: '#F9F9F9' }}>
                          ₦{room.price_per_night.toLocaleString()} <span className="text-sm font-sans" style={{ color: '#aaaaaa' }}>/ night</span>
                        </div>
                      </div>
                      <Link
                        to={`/book?type=stay&room=${room.id}`}
                        className="px-8 h-12 flex items-center text-xs tracking-[0.15em] uppercase font-medium transition-all"
                        style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a8873a'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
                      >
                        Book This Suite
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
            backgroundImage: 'url(https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=1200)',
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(5,5,5,0.8)' }} />
          <div className="relative z-10 max-w-lg">
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>We Will Plan Your Perfect Trip</div>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4" style={{ color: '#F9F9F9' }}>Extend Your Luxury Stay</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#aaaaaa' }}>
              Every moment deserves more than just a night. When you're traveling for business, a family getaway, or a well-deserved retreat, let us continue to provide what you need.
            </p>
            <Link
              to="/book"
              className="inline-flex px-8 h-12 items-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a8873a'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
            >
              Extend My Stay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}