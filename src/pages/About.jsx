import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Award, Users, Clock } from 'lucide-react';

const stats = [
  { label: 'Happy Guests', value: '500+' },
  { label: 'Luxury Vehicles', value: '20+' },
  { label: 'Suites Available', value: '3' },
  { label: 'Years of Service', value: '5+' },
];

const values = [
  { icon: Shield, title: 'Safety & Trust', desc: 'Your safety and trust are paramount. All vehicles are fully insured and regularly serviced. Our apartments meet the highest security standards.' },
  { icon: Award, title: 'Excellence', desc: 'We pursue excellence in every interaction. From the first booking to final check-out, we deliver a flawless, world-class experience.' },
  { icon: Users, title: 'Personalized Service', desc: 'Every guest is unique. We tailor our services to your specific needs, ensuring a truly personalized luxury experience.' },
  { icon: Clock, title: '24/7 Support', desc: 'Our dedicated support team is available around the clock to assist you with any requests, questions, or special arrangements.' },
];

export default function About() {
  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* Hero */}
      <section
        className="relative h-80 md:h-96 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full text-center">
          <h1 className="font-serif font-light" style={{ color: '#F9F9F9', fontSize: 'clamp(3rem, 8vw, 7rem)' }}>ABOUT US</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-base leading-relaxed mb-6" style={{ color: '#888888' }}>
            <strong style={{ color: '#F9F9F9' }}>Frensic Luxury</strong> is a premium lifestyle and hospitality brand dedicated to delivering exceptional luxury transportation and accommodation experiences. We specialize in luxury automobile rentals, executive chauffeur services, airport transfers, and a beautifully furnished 5-bedroom luxury apartment designed to provide comfort, elegance, and convenience for every guest.
          </p>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#888888' }}>
            Founded on the principles of excellence, professionalism, and customer satisfaction, Frensic Luxury was created to redefine the way people travel and stay. Whether you're a business executive, tourist, family, couple, or event guest, we provide personalized services that combine sophistication with reliability, ensuring every journey and every stay is truly memorable.
          </p>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#888888' }}>
            Our fleet of meticulously maintained luxury vehicles offers the perfect solution for corporate travel, weddings, special occasions, airport transfers, vacations, and everyday luxury. Complementing our transportation services is our spacious luxury apartment, thoughtfully designed with modern amenities, stylish interiors, and premium comforts to create a relaxing home away from home.
          </p>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#888888' }}>
            At Frensic Luxury, every detail matters. From seamless online bookings and transparent pricing to professional chauffeurs and dedicated customer support, we are committed to providing a first-class experience from beginning to end.
          </p>
          <p className="text-lg font-serif italic" style={{ color: '#F9F9F9' }}>
            Frensic Luxury — Where Every Journey Begins in Style, and Every Stay Feels Like Home.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 lg:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-0">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="text-center py-8 px-4"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
            >
              <div className="font-serif text-4xl md:text-5xl mb-2" style={{ color: '#2D5BFF' }}>{s.value}</div>
              <div className="text-xs tracking-[0.2em] uppercase" style={{ color: '#888888' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#2D5BFF' }}>Our Mission</div>
            <h2 className="font-serif font-light text-4xl mb-6" style={{ color: '#F9F9F9' }}>Built on Trust, Driven by Excellence</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#888888' }}>
              Our mission is to exceed expectations by delivering world-class luxury services built on trust, safety, integrity, and exceptional hospitality. As we continue to grow, we remain focused on becoming one of Africa's most respected luxury mobility and hospitality brands, known for quality, innovation, and outstanding customer care.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
              Whether you're planning a business trip, celebrating a special occasion, enjoying a family vacation, or simply seeking the finest in luxury transportation and accommodation, Frensic Luxury is your trusted partner.
            </p>
          </div>
          <div
            className="aspect-[4/3] overflow-hidden"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900)',
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          />
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 lg:px-16" style={{ backgroundColor: '#080808' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#2D5BFF' }}>Our Values</div>
            <h2 className="font-serif font-light text-4xl" style={{ color: '#F9F9F9' }}>What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="p-8"
                style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-10 h-10 flex items-center justify-center mb-5" style={{ border: '1px solid rgba(45,91,255,0.3)', color: '#2D5BFF' }}>
                  <Icon size={18} />
                </div>
                <h3 className="font-serif text-lg mb-3" style={{ color: '#F9F9F9' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-16 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif font-light text-4xl mb-6" style={{ color: '#F9F9F9' }}>Ready for the Luxury Experience?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book"
              className="px-10 h-13 flex items-center justify-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9', height: '52px' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D5BFF'; }}
            >
              Book Now
            </Link>
            <Link
              to="/contact"
              className="px-10 flex items-center justify-center text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#F9F9F9', height: '52px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D5BFF'; e.currentTarget.style.color = '#2D5BFF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#F9F9F9'; }}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}