import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ContactMessage.create(form);
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* Hero */}
      <section
        className="relative h-64 md:h-80 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=1600)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#2D5BFF' }}>Home / Contact</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Contact</h1>
        </div>
      </section>

      {/* Main */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#2D5BFF' }}>Let's Talk</div>
            <h2 className="font-serif font-light mb-6" style={{ color: '#F9F9F9', fontSize: 'clamp(2rem, 4vw, 3.2rem)' }}>
              Don't hesitate to reach our team. We are ready to help
            </h2>
            <p className="text-sm leading-relaxed mb-12" style={{ color: '#888888' }}>
              Whether you have questions about our luxury vehicles, apartment reservations, pricing, availability, or special requests, our dedicated team is just a message or call away. We're committed to providing prompt, friendly, and personalized assistance to ensure your experience with Frensic Luxury is seamless from start to finish.
            </p>

            <div className="space-y-6 mb-12">
              {[
                { icon: MapPin, label: 'Visit Us', value: 'Durumi, Abuja, Nigeria' },
                { icon: Phone, label: 'Call Us', value: '+234 704 600 7419 / +234 803 706 8065' },
                { icon: Mail, label: 'Email Us', value: 'info@frensicluxuryapartment.com.ng' },
                { icon: Clock, label: 'Business Hours', value: 'Mon-Tue: 8am–10pm · Wed-Fri: 8am–11pm · Weekend: 6am–11pm' },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-start gap-5 p-5"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(45,91,255,0.1)', border: '1px solid rgba(45,91,255,0.25)', color: '#2D5BFF' }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888888' }}>{label}</div>
                    <div className="text-sm" style={{ color: '#F9F9F9' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Embed */}
            <div className="w-full h-56 overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <iframe
                title="Frensic Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.7!2d7.4!3d9.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sDurumi%2C+Abuja!5e0!3m2!1sen!2sng!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-6 p-12" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                <CheckCircle size={48} style={{ color: '#2D5BFF' }} />
                <h3 className="font-serif text-2xl" style={{ color: '#F9F9F9' }}>Message Received</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setForm({ name: '', email: '', phone: '', subject: '', message: '' }); setSent(false); }}
                  className="px-8 h-12 text-xs tracking-[0.2em] uppercase transition-all"
                  style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-serif text-2xl mb-8" style={{ color: '#F9F9F9' }}>Send Us a Message</h3>
                {[
                  { field: 'name', label: 'Full Name', type: 'text', required: true },
                  { field: 'email', label: 'Email Address', type: 'email', required: true },
                  { field: 'phone', label: 'Phone Number', type: 'tel', required: false },
                  { field: 'subject', label: 'Subject', type: 'text', required: false },
                ].map(({ field, label, type, required }) => (
                  <div key={field}>
                    <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>{label}</label>
                    <input
                      type={type}
                      required={required}
                      value={form[field]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })}
                      className="w-full h-12 px-4 text-sm bg-transparent outline-none"
                      style={{
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#F9F9F9',
                        borderRadius: 0,
                      }}
                      onFocus={e => { e.target.style.borderColor = '#2D5BFF'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full p-4 text-sm bg-transparent outline-none resize-none"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                    onFocus={e => { e.target.style.borderColor = '#2D5BFF'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 flex items-center justify-center gap-2 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                  style={{ height: '52px', backgroundColor: loading ? '#888888' : '#2D5BFF', color: '#F9F9F9' }}
                >
                  {loading ? 'Sending...' : (
                    <>
                      Send Message
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}