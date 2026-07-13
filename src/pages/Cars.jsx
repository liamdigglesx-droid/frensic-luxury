import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gauge, Zap, Users, Settings2, CheckCircle } from 'lucide-react';
import { CARS } from '@/lib/constants';

export default function Cars() {
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

      {/* Cars List */}
      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#C9A84C' }}>Our Fleet</div>
            <h2 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>
              A luxurious ride to meet your needs
            </h2>
          </div>

          <div className="space-y-24">
            {CARS.map((car, i) => (
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
                </div>
                <div
                  className="flex flex-col justify-center p-10 lg:p-16"
                  style={{ backgroundColor: '#080808', direction: 'ltr' }}
                >
                  <h3 className="font-serif text-3xl mb-3" style={{ color: '#F9F9F9' }}>{car.name}</h3>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>{car.description}</p>

                  {/* Specs */}
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

                  {/* Features */}
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
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
                    >
                      Book This Car
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
            backgroundImage: `url(https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/8930a48a6_generated_66061811.png)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(5,5,5,0.82)' }} />
          <div className="relative z-10 max-w-lg">
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>Extend The Journey</div>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4" style={{ color: '#F9F9F9' }}>Extend The Journey and Keep the Experience</h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>
              Why settle when the road still has more to offer? When you've promised yourself a drive that matters — giving the journey days and moments your premium life, whether it's one more day or an entire week, your perfect driver doesn't have to arrive.
            </p>
            <Link
              to="/book?type=drive"
              className="inline-flex px-8 h-12 items-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
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