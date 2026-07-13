import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Tv, Users, Maximize2, BedDouble, Star } from 'lucide-react';
import { ROOMS } from '@/lib/constants';

export default function Rooms() {
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
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#2D5BFF' }}>Home / Rooms</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Rooms</h1>
        </div>
      </section>

      {/* Rooms List */}
      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#2D5BFF' }}>Our Suites</div>
            <h2 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>
              A unique stay to meet your needs
            </h2>
          </div>

          <div className="space-y-24">
            {ROOMS.map((room, i) => (
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
                  <div className="absolute top-6 left-6 px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase" style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}>
                    {room.tagline}
                  </div>
                </div>
                <div
                  className="flex flex-col justify-center p-10 lg:p-16"
                  style={{ backgroundColor: '#080808', direction: 'ltr' }}
                >
                  <h3 className="font-serif text-3xl mb-3" style={{ color: '#F9F9F9' }}>{room.name}</h3>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>{room.description}</p>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { icon: BedDouble, label: 'Bedrooms', value: room.bedrooms },
                      { icon: Users, label: 'Max Guests', value: room.max_guests },
                      { icon: Maximize2, label: 'Size', value: `${room.size_sqm} m²` },
                      { icon: Star, label: 'Rating', value: '5.0 / 5.0' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <Icon size={14} style={{ color: '#2D5BFF' }} />
                        <div>
                          <div className="text-[10px] tracking-widest uppercase" style={{ color: '#888888' }}>{label}</div>
                          <div className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Amenities */}
                  <div className="mb-8">
                    <div className="text-[10px] tracking-[0.2em] uppercase mb-4" style={{ color: '#888888' }}>Amenities</div>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map(a => (
                        <span key={a} className="px-3 py-1 text-xs" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}>{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
                    <div>
                      <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#888888' }}>Starting From</div>
                      <div className="font-serif text-2xl" style={{ color: '#F9F9F9' }}>
                        ₦{room.price_per_night.toLocaleString()} <span className="text-sm font-sans" style={{ color: '#888888' }}>/ night</span>
                      </div>
                    </div>
                    <Link
                      to={`/book?type=stay&room=${room.id}`}
                      className="px-8 h-12 flex items-center text-xs tracking-[0.15em] uppercase font-medium transition-all"
                      style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D5BFF'; }}
                    >
                      Book This Suite
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#2D5BFF' }}>We Will Plan Your Perfect Trip</div>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4" style={{ color: '#F9F9F9' }}>Extend Your Luxury Stay</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>
              Every moment deserves more than just a night. When you're traveling for business, a family getaway, or a well-deserved retreat, let us continue to provide what you need — setting nothing short of the very best.
            </p>
            <p className="text-sm italic mb-8" style={{ color: '#888888' }}>
              Stay at Frensic Luxury. Experience luxury without waiting.
            </p>
            <Link
              to="/book"
              className="inline-flex px-8 h-12 items-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D5BFF'; }}
            >
              Extend My Stay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}