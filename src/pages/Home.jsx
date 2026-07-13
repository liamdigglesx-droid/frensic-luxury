import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronDown, Plus, Minus } from 'lucide-react';
import BookingEngine from '@/components/BookingEngine';
import { ROOMS, CARS, TESTIMONIALS, FAQS } from '@/lib/constants';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);

  return (
    <div style={{ backgroundColor: '#050505' }}>

      {/* Hero */}
      <section className="relative min-h-screen flex items-end pb-24 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          <div
            className="relative overflow-hidden"
            style={{
              backgroundImage: `url(https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/9c3a71054_generated_30df4f42.png)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(5,5,5,0.6), rgba(5,5,5,0.1))' }} />
          </div>
          <div
            className="relative overflow-hidden"
            style={{
              backgroundImage: `url(https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/90c5b7cf8_generated_9081af89.png)`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(5,5,5,0.6), rgba(5,5,5,0.1))' }} />
          </div>
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(5,5,5,0.9) 100%)' }} />

        <div className="relative z-10 w-full px-6 lg:px-16 flex flex-col items-center text-center gap-10">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: '#C9A84C' }}>
              Luxury Apartment & Automobile Rental
            </div>
            <h1
              className="font-serif font-light leading-[1.05]"
              style={{
                color: '#F9F9F9',
                fontSize: 'clamp(2.8rem, 7vw, 8rem)',
                textShadow: '0 2px 40px rgba(0,0,0,0.8)',
              }}
            >
              Let us be your gateway to a{' '}
              <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>Luxurious</span>{' '}
              Living
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-base leading-relaxed" style={{ color: '#888888' }}>
              Redefines luxury with world-class accommodations and Automobile Rental Services in Abuja, Nigeria.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="w-full flex justify-center"
          >
            <BookingEngine />
          </motion.div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-24 px-6 lg:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#C9A84C' }}>Our Suites</div>
            <h2 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>
              Unique stay to comfort your needs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROOMS.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden aspect-[4/3] mb-5">
                  <img
                    src={room.image_url}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 text-[10px] tracking-[0.2em] uppercase" style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}>
                    {room.tagline}
                  </div>
                </div>
                <h3 className="font-serif text-xl mb-2" style={{ color: '#F9F9F9' }}>{room.name}</h3>
                <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: '#888888' }}>{room.description}</p>
                <div className="flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <div>
                    <div className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#888888' }}>Starts From</div>
                    <div className="font-serif text-lg" style={{ color: '#F9F9F9' }}>
                      ₦{(room.price_per_night / 1000).toFixed(0)}k <span className="text-xs font-sans" style={{ color: '#888888' }}>/ night</span>
                    </div>
                  </div>
                  <Link
                    to={`/book?type=stay&room=${room.id}`}
                    className="px-5 h-10 flex items-center text-xs tracking-[0.15em] uppercase transition-all"
                    style={{ border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; e.currentTarget.style.color = '#F9F9F9'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#C9A84C'; }}
                  >
                    Book Suite
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 px-8 h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#F9F9F9'; }}
            >
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* About / Promo Banner */}
      <section className="py-0 mx-6 lg:mx-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div
            className="aspect-square md:aspect-auto"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900)',
              backgroundSize: 'cover', backgroundPosition: 'center', minHeight: 360,
            }}
          />
          <div className="flex flex-col justify-center px-12 py-16" style={{ backgroundColor: '#0d0d0d' }}>
            <div className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>Who We Are</div>
            <h2 className="font-serif font-light text-3xl mb-6" style={{ color: '#F9F9F9' }}>
              Redefines luxury with world-class accommodations and Automobile Rental Services
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#888888' }}>
              Frensic Luxury is a premium lifestyle and hospitality brand dedicated to delivering exceptional luxury transportation and accommodation experiences across Nigeria.
            </p>
            <div className="space-y-3 mb-8">
              {['Luxury Automobile Rentals', 'Executive Chauffeur Services', 'Premium Furnished Apartments'].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm" style={{ color: '#888888' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#C9A84C' }} />
                  {item}
                </div>
              ))}
            </div>
            <Link
              to="/about"
              className="self-start px-8 h-12 flex items-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#C9A84C' }}>Guest Testimonials</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <h2 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
                Read our real testimonial services
              </h2>
              <p className="text-sm leading-relaxed pt-2" style={{ color: '#888888' }}>
                Our guests enjoy more than just a stay — they indulge in a true escape. Here's what our distinguished guests have to say.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.slice(0, 2).map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="p-8"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <img src={t.avatar_url} alt={t.guest_name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                  <div>
                    <div className="font-serif text-lg mb-1" style={{ color: '#C9A84C' }}>{t.headline}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#888888' }}>{t.body}</p>
                <div className="flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{t.guest_name}</div>
                    <div className="text-xs tracking-wider uppercase" style={{ color: '#888888' }}>{t.guest_title}</div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={12} fill="#C9A84C" color="#C9A84C" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 px-8 h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#F9F9F9'; }}
            >
              Read All Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 lg:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#C9A84C' }}>FAQ</div>
            <h2 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}>
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-0">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <button
                  className="w-full flex items-center justify-between py-5 text-left gap-4"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{faq.q}</span>
                  {activeFaq === i ? (
                    <Minus size={16} className="flex-shrink-0" style={{ color: '#C9A84C' }} />
                  ) : (
                    <Plus size={16} className="flex-shrink-0" style={{ color: '#888888' }} />
                  )}
                </button>
                {activeFaq === i && (
                  <div className="pb-5 text-sm leading-relaxed" style={{ color: '#888888' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 px-1 pb-1">
        {[
          'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=600',
          'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600',
          'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/ad6539448_generated_e8ef4aa2.png',
          'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/6e5a5ceee_generated_3119a26d.png',
        ].map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden">
            <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
        ))}
      </div>
    </div>
  );
}