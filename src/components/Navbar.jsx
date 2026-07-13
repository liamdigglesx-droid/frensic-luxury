import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about' },
  { label: 'Rooms', path: '/rooms' },
  { label: 'Cars', path: '/cars' },
  { label: 'Reviews', path: '/reviews' },
  { label: 'My Bookings', path: '/my-bookings' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          backgroundColor: scrolled ? 'rgba(5,5,5,0.97)' : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-6 lg:px-12 h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/622215c82_FrensicLuxuryApartmentLogo.png"
              alt="Frensic Luxury Apartment"
              className="h-14 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.25))' }}
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className="text-xs tracking-[0.15em] uppercase transition-colors duration-200"
                style={{ color: location.pathname === path ? '#C9A84C' : '#888888' }}
                onMouseEnter={e => { if (location.pathname !== path) e.target.style.color = '#F9F9F9'; }}
                onMouseLeave={e => { if (location.pathname !== path) e.target.style.color = '#888888'; }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-4">
            <Link
              to="/book"
              className="hidden lg:flex items-center px-6 h-11 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-200"
              style={{ backgroundColor: '#C9A84C', color: '#050505' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#b8943e'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
            >
              Book Now
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2"
              style={{ color: '#F9F9F9' }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 flex flex-col pt-20"
            style={{ backgroundColor: 'rgba(5,5,5,0.98)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex flex-col items-center justify-center flex-1 gap-8 px-8">
              {links.map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className="text-2xl font-serif font-light tracking-widest transition-colors"
                  style={{ color: location.pathname === path ? '#C9A84C' : '#F9F9F9' }}
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/book"
                className="mt-4 px-10 h-14 flex items-center text-sm tracking-[0.2em] uppercase font-medium"
                style={{ backgroundColor: '#C9A84C', color: '#050505' }}
                            >
                              Book Now
                            </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}