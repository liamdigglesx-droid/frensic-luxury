import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="mb-6">
            <img
              src="https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/622215c82_FrensicLuxuryApartmentLogo.png"
              alt="Frensic Luxury Apartment"
              className="h-20 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.2))' }}
            />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#aaaaaa' }}>
            Where every journey begins in style, and every stay feels like home.
          </p>
          <div className="flex gap-4 mt-6">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 flex items-center justify-center transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888888'; }}
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs tracking-[0.3em] uppercase mb-6 font-medium" style={{ color: '#F9F9F9' }}>Navigation</h4>
          <ul className="space-y-3">
            {[
              { label: 'Home', path: '/' },
              { label: 'About Us', path: '/about' },
              { label: 'Rooms', path: '/rooms' },
              { label: 'Cars', path: '/cars' },
              { label: 'Reviews', path: '/reviews' },
              { label: 'Book Now', path: '/book' },
            ].map(({ label, path }) => (
              <li key={path}>
                <Link
                  to={path}
                  className="text-sm transition-colors"
                  style={{ color: '#aaaaaa' }}
                  onMouseEnter={e => { e.target.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.target.style.color = '#888888'; }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-xs tracking-[0.3em] uppercase mb-6 font-medium" style={{ color: '#F9F9F9' }}>Services</h4>
          <ul className="space-y-3">
            {['Luxury Apartments', 'Executive Car Rental', 'Chauffeur Service', 'Airport Transfers', 'Event Transportation', 'Corporate Bookings'].map(s => (
              <li key={s}>
                <span className="text-sm" style={{ color: '#aaaaaa' }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-xs tracking-[0.3em] uppercase mb-6 font-medium" style={{ color: '#F9F9F9' }}>Contact</h4>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <MapPin size={14} className="mt-1 flex-shrink-0" style={{ color: '#C9A84C' }} />
              <span className="text-sm leading-relaxed" style={{ color: '#aaaaaa' }}>Durumi, Abuja, Nigeria</span>
            </li>
            <li className="flex gap-3 items-center">
              <Phone size={14} className="flex-shrink-0" style={{ color: '#C9A84C' }} />
              <a href="tel:+2347046007419" className="text-sm" style={{ color: '#aaaaaa' }}>+234 704 600 7419</a>
            </li>
            <li className="flex gap-3 items-center">
              <Phone size={14} className="flex-shrink-0" style={{ color: '#C9A84C' }} />
              <a href="tel:+2348037068065" className="text-sm" style={{ color: '#aaaaaa' }}>+234 803 706 8065</a>
            </li>
            <li className="flex gap-3 items-center">
              <Mail size={14} className="flex-shrink-0" style={{ color: '#C9A84C' }} />
              <a href="mailto:info@frensicluxuryapartment.com.ng" className="text-sm break-all" style={{ color: '#aaaaaa' }}>
                info@frensicluxuryapartment.com.ng
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs" style={{ color: '#aaaaaa' }}>
          © {new Date().getFullYear()} Frensic Luxury Apartment. All rights reserved.
        </p>
        <div className="flex gap-6">
          <Link to="/privacy" className="text-xs transition-colors" style={{ color: '#aaaaaa' }}
            onMouseEnter={e => { e.target.style.color = '#C9A84C'; }}
            onMouseLeave={e => { e.target.style.color = '#888888'; }}>
            Privacy Policy
          </Link>
          <Link to="/contact" className="text-xs transition-colors" style={{ color: '#aaaaaa' }}
            onMouseEnter={e => { e.target.style.color = '#C9A84C'; }}
            onMouseLeave={e => { e.target.style.color = '#888888'; }}>
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}