import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TESTIMONIALS } from '@/lib/constants';

export default function Reviews() {
  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* Hero */}
      <section
        className="relative h-64 md:h-80 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#C9A84C' }}>Home / Reviews</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Reviews</h1>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#C9A84C' }}>Guest Testimonials</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <h2 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
                Read our real testimonial services
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                Our guests enjoy more than just a stay — they indulge in a true escape. Here's what our distinguished guests have to say.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: (i % 2) * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-5 gap-0"
                style={{ backgroundColor: '#080808', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="md:col-span-1 p-8 flex flex-col items-center md:items-start justify-center" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <img src={t.avatar_url} alt={t.guest_name} className="w-20 h-20 rounded-full object-cover mb-4" />
                  <div className="font-serif text-base" style={{ color: '#F9F9F9' }}>{t.guest_name}</div>
                  <div className="text-xs tracking-wider uppercase mt-1" style={{ color: '#888888' }}>{t.guest_title}</div>
                  <div className="flex gap-1 mt-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={11} fill="#C9A84C" color="#C9A84C" />
                    ))}
                  </div>
                  <div className="mt-3 px-2 py-1 text-[9px] tracking-[0.15em] uppercase" style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
                    {t.service_type === 'stay' ? 'Apartment Stay' : 'Car Rental'}
                  </div>
                </div>
                <div className="md:col-span-4 p-8 md:p-12 flex flex-col justify-center">
                  <div className="font-serif text-2xl md:text-3xl mb-5 italic" style={{ color: '#C9A84C' }}>{t.headline}</div>
                  <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>{t.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback CTA */}
      <section className="py-20 px-6 lg:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>Do You Have Any Problem With Our Services?</div>
            <h2 className="font-serif font-light text-4xl mb-6" style={{ color: '#F9F9F9' }}>
              We hear you, let us know what you feel and get your compensation
            </h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#888888' }}>
              Your feedback matters to us because your experience is our top priority. Whether you have a compliment, a concern, or a suggestion, we'd love to hear from you. Every message helps us improve our services and deliver the exceptional luxury experience you deserve.
            </p>
            <p className="text-sm leading-relaxed mb-8 italic" style={{ color: '#888888' }}>
              Speak up. We'll listen. We'll make it right.
            </p>
            <Link
              to="/contact"
              className="inline-flex px-8 h-12 items-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
            >
              Tell Us Your Feedback
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=500',
              'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500',
              'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/d7450e02f_generated_21bb45e6.png',
              'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/556ba3447_generated_e98d5d1f.png',
            ].map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}