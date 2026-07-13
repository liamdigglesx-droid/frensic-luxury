import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Car, Calendar, Users, User, Mail, Phone, MessageSquare,
  ChevronRight, ChevronLeft, Check, Lock, Loader2
} from 'lucide-react';
import { ROOMS, CARS } from '@/lib/constants';
import { base44 } from '@/api/base44Client';
import { initPaystack } from '@/lib/paystack';

export default function Book() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);

  const [step, setStep] = useState(1); // 1=Type+Item, 2=Dates, 3=Details, 4=Confirm
  const [type, setType] = useState(urlParams.get('type') || 'stay');
  const [selectedRoom, setSelectedRoom] = useState(urlParams.get('room') || '');
  const [selectedCar, setSelectedCar] = useState(urlParams.get('car') || '');
  const [startDate, setStartDate] = useState(urlParams.get('start') || '');
  const [endDate, setEndDate] = useState(urlParams.get('end') || '');
  const [guests, setGuests] = useState(Number(urlParams.get('guests')) || 2);
  const [chauffeur, setChauffeur] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '', requests: '' });
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const selectedItem = type === 'stay'
    ? ROOMS.find(r => r.id === selectedRoom) || ROOMS[0]
    : CARS.find(c => c.id === selectedCar) || CARS[0];

  const nights = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
    : 1;

  const unitPrice = type === 'stay' ? selectedItem?.price_per_night : selectedItem?.price_per_day;
  const chauffeurFee = chauffeur ? 30000 : 0;
  const subtotal = (unitPrice || 0) * nights;
  const total = subtotal + chauffeurFee;

  const canProceedStep1 = type && (type === 'stay' ? selectedRoom : selectedCar);
  const canProceedStep2 = startDate && endDate && new Date(endDate) > new Date(startDate);
  const canProceedStep3 = guestInfo.name && guestInfo.email && guestInfo.phone;

  const handlePayment = async () => {
    if (!canProceedStep3) return;
    setLoading(true);

    try {
      const booking = await base44.entities.Booking.create({
        booking_type: type,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        start_date: startDate,
        end_date: endDate,
        guest_name: guestInfo.name,
        guest_email: guestInfo.email,
        guest_phone: guestInfo.phone,
        guests_count: guests,
        chauffeur,
        special_requests: guestInfo.requests,
        nights_or_days: nights,
        unit_price: unitPrice,
        total_amount: total,
        payment_status: 'pending',
      });

      setLoading(false);

      initPaystack({
        email: guestInfo.email,
        amount: total,
        ref: `FRENSIC_${booking.id.slice(-8).toUpperCase()}_${Date.now()}`,
        onSuccess: async (response) => {
          await base44.entities.Booking.update(booking.id, {
            payment_status: 'paid',
            payment_reference: response.reference,
          });
          setBooked(true);
          setStep(5);
        },
        onClose: async () => {
          await base44.entities.Booking.update(booking.id, { payment_status: 'failed' });
        },
      });
    } catch (err) {
      setLoading(false);
      alert('Booking error. Please try again.');
    }
  };

  const stepLabels = ['Select', 'Dates', 'Details', 'Confirm'];

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        className="relative h-64 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#2D5BFF' }}>Home / Book Now</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Book Now</h1>
        </div>
      </section>

      {/* Stepper + Form */}
      <section className="py-16 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Step Indicator */}
          {step <= 4 && (
            <div className="flex items-center justify-center mb-12 gap-0">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 flex items-center justify-center text-xs font-medium transition-all"
                      style={{
                        backgroundColor: step > i + 1 ? '#2D5BFF' : step === i + 1 ? '#2D5BFF' : 'transparent',
                        border: `1px solid ${step >= i + 1 ? '#2D5BFF' : 'rgba(255,255,255,0.15)'}`,
                        color: step >= i + 1 ? '#F9F9F9' : '#888888',
                      }}
                    >
                      {step > i + 1 ? <Check size={14} /> : i + 1}
                    </div>
                    <div className="text-[10px] tracking-widest uppercase mt-2" style={{ color: step === i + 1 ? '#F9F9F9' : '#888888' }}>
                      {label}
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="w-16 md:w-24 h-px mx-2 mb-5" style={{ backgroundColor: step > i + 1 ? '#2D5BFF' : 'rgba(255,255,255,0.1)' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* STEP 1: Type & Item Selection */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-3xl mb-8 text-center" style={{ color: '#F9F9F9' }}>What are you booking?</h2>

                {/* Type Toggle */}
                <div className="flex gap-4 mb-10 justify-center">
                  {[{ key: 'stay', label: 'Apartment Stay', icon: Building2 }, { key: 'drive', label: 'Car Rental', icon: Car }].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setType(key)}
                      className="flex-1 max-w-xs flex flex-col items-center gap-3 py-6 px-8 transition-all"
                      style={{
                        border: `1px solid ${type === key ? '#2D5BFF' : 'rgba(255,255,255,0.1)'}`,
                        backgroundColor: type === key ? 'rgba(45,91,255,0.1)' : 'transparent',
                      }}
                    >
                      <Icon size={24} style={{ color: type === key ? '#2D5BFF' : '#888888' }} />
                      <span className="text-sm tracking-widest uppercase" style={{ color: type === key ? '#F9F9F9' : '#888888' }}>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Item Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {(type === 'stay' ? ROOMS : CARS).map(item => (
                    <button
                      key={item.id}
                      onClick={() => type === 'stay' ? setSelectedRoom(item.id) : setSelectedCar(item.id)}
                      className="text-left overflow-hidden transition-all group"
                      style={{
                        border: `1px solid ${(type === 'stay' ? selectedRoom : selectedCar) === item.id ? '#2D5BFF' : 'rgba(255,255,255,0.08)'}`,
                        backgroundColor: (type === 'stay' ? selectedRoom : selectedCar) === item.id ? 'rgba(45,91,255,0.07)' : '#080808',
                      }}
                    >
                      <div className="aspect-video overflow-hidden">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4">
                        <div className="font-serif text-base mb-1" style={{ color: '#F9F9F9' }}>{item.name}</div>
                        <div className="text-xs" style={{ color: '#888888' }}>
                          {type === 'stay' ? `₦${item.price_per_night.toLocaleString()} / night` : `₦${item.price_per_day.toLocaleString()} / day`}
                        </div>
                      </div>
                      {(type === 'stay' ? selectedRoom : selectedCar) === item.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center" style={{ backgroundColor: '#2D5BFF' }}>
                          <Check size={12} color="#fff" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => canProceedStep1 && setStep(2)}
                    disabled={!canProceedStep1}
                    className="flex items-center gap-2 px-10 h-13 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                    style={{ height: '52px', backgroundColor: canProceedStep1 ? '#2D5BFF' : '#333', color: canProceedStep1 ? '#F9F9F9' : '#666' }}
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Dates */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-3xl mb-8 text-center" style={{ color: '#F9F9F9' }}>Select Your Dates</h2>
                <div className="max-w-2xl mx-auto">
                  <div className="p-8 mb-8" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-4 mb-6">
                      <img src={selectedItem?.image_url} alt={selectedItem?.name} className="w-16 h-16 object-cover" />
                      <div>
                        <div className="font-serif text-xl" style={{ color: '#F9F9F9' }}>{selectedItem?.name}</div>
                        <div className="text-xs mt-1" style={{ color: '#888888' }}>
                          {type === 'stay' ? `₦${selectedItem?.price_per_night?.toLocaleString()} / night` : `₦${selectedItem?.price_per_day?.toLocaleString()} / day`}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>
                          {type === 'stay' ? 'Check-In Date' : 'Pick-Up Date'}
                        </label>
                        <input
                          type="date"
                          min={today}
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full h-12 px-4 text-sm bg-transparent outline-none"
                          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9', colorScheme: 'dark' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>
                          {type === 'stay' ? 'Check-Out Date' : 'Return Date'}
                        </label>
                        <input
                          type="date"
                          min={startDate || today}
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full h-12 px-4 text-sm bg-transparent outline-none"
                          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9', colorScheme: 'dark' }}
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>
                        {type === 'stay' ? 'Number of Guests' : 'Number of Passengers'}
                      </label>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 flex items-center justify-center text-xl" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#2D5BFF' }}>−</button>
                        <span className="text-lg font-medium w-8 text-center" style={{ color: '#F9F9F9' }}>{guests}</span>
                        <button onClick={() => setGuests(Math.min(10, guests + 1))} className="w-10 h-10 flex items-center justify-center text-xl" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#2D5BFF' }}>+</button>
                      </div>
                    </div>

                    {type === 'drive' && (
                      <label className="flex items-center gap-3 mt-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={chauffeur}
                          onChange={e => setChauffeur(e.target.checked)}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-sm" style={{ color: '#888888' }}>Add Chauffeur Service (+₦30,000/day)</span>
                      </label>
                    )}
                  </div>

                  {startDate && endDate && canProceedStep2 && (
                    <div className="p-5 mb-8" style={{ backgroundColor: 'rgba(45,91,255,0.07)', border: '1px solid rgba(45,91,255,0.2)' }}>
                      <div className="text-xs tracking-widest uppercase mb-3" style={{ color: '#2D5BFF' }}>Booking Summary</div>
                      <div className="flex justify-between text-sm mb-2" style={{ color: '#888888' }}>
                        <span>{selectedItem?.name}</span>
                        <span>₦{unitPrice?.toLocaleString()} × {nights} {type === 'stay' ? 'nights' : 'days'}</span>
                      </div>
                      {chauffeur && (
                        <div className="flex justify-between text-sm mb-2" style={{ color: '#888888' }}>
                          <span>Chauffeur Service</span>
                          <span>₦{(chauffeurFee).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-serif text-lg mt-3 pt-3" style={{ borderTop: '1px solid rgba(45,91,255,0.2)', color: '#F9F9F9' }}>
                        <span>Total</span>
                        <span>₦{total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center gap-2 px-8 h-12 text-xs tracking-[0.2em] uppercase transition-all"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}
                    >
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button
                      onClick={() => canProceedStep2 && setStep(3)}
                      disabled={!canProceedStep2}
                      className="flex items-center gap-2 px-10 h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                      style={{ height: '52px', backgroundColor: canProceedStep2 ? '#2D5BFF' : '#333', color: canProceedStep2 ? '#F9F9F9' : '#666' }}
                    >
                      Continue <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Guest Details */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-3xl mb-8 text-center" style={{ color: '#F9F9F9' }}>Your Details</h2>
                <div className="max-w-2xl mx-auto">
                  <div className="space-y-5 mb-8">
                    {[
                      { field: 'name', label: 'Full Name', icon: User, type: 'text', required: true },
                      { field: 'email', label: 'Email Address', icon: Mail, type: 'email', required: true },
                      { field: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', required: true },
                    ].map(({ field, label, icon: Icon, type: t, required }) => (
                      <div key={field}>
                        <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>{label}</label>
                        <div className="relative">
                          <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#888888' }} />
                          <input
                            type={t}
                            required={required}
                            value={guestInfo[field]}
                            onChange={e => setGuestInfo({ ...guestInfo, [field]: e.target.value })}
                            className="w-full h-12 pl-10 pr-4 text-sm bg-transparent outline-none"
                            style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#2D5BFF'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888888' }}>Special Requests (Optional)</label>
                      <div className="relative">
                        <MessageSquare size={14} className="absolute left-4 top-4" style={{ color: '#888888' }} />
                        <textarea
                          rows={3}
                          value={guestInfo.requests}
                          onChange={e => setGuestInfo({ ...guestInfo, requests: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 text-sm bg-transparent outline-none resize-none"
                          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                          onFocus={e => { e.target.style.borderColor = '#2D5BFF'; }}
                          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setStep(2)} className="flex items-center gap-2 px-8 h-12 text-xs tracking-[0.2em] uppercase transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button
                      onClick={() => canProceedStep3 && setStep(4)}
                      disabled={!canProceedStep3}
                      className="flex items-center gap-2 px-10 h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                      style={{ height: '52px', backgroundColor: canProceedStep3 ? '#2D5BFF' : '#333', color: canProceedStep3 ? '#F9F9F9' : '#666' }}
                    >
                      Review Booking <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Confirm & Pay */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                <h2 className="font-serif text-3xl mb-8 text-center" style={{ color: '#F9F9F9' }}>Confirm & Pay</h2>
                <div className="max-w-2xl mx-auto">
                  {/* Summary Card */}
                  <div className="p-8 mb-6" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-4 pb-5 mb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <img src={selectedItem?.image_url} alt={selectedItem?.name} className="w-20 h-20 object-cover" />
                      <div>
                        <div className="font-serif text-xl mb-1" style={{ color: '#F9F9F9' }}>{selectedItem?.name}</div>
                        <div className="text-xs tracking-widest uppercase" style={{ color: '#2D5BFF' }}>
                          {type === 'stay' ? 'Apartment Stay' : 'Car Rental'}
                        </div>
                      </div>
                    </div>

                    {[
                      { label: type === 'stay' ? 'Check-In' : 'Pick-Up', value: startDate },
                      { label: type === 'stay' ? 'Check-Out' : 'Return', value: endDate },
                      { label: 'Duration', value: `${nights} ${type === 'stay' ? 'nights' : 'days'}` },
                      { label: 'Guests', value: guests },
                      { label: 'Name', value: guestInfo.name },
                      { label: 'Email', value: guestInfo.email },
                      { label: 'Phone', value: guestInfo.phone },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="text-xs tracking-widest uppercase" style={{ color: '#888888' }}>{label}</span>
                        <span className="text-sm" style={{ color: '#F9F9F9' }}>{value}</span>
                      </div>
                    ))}

                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex justify-between text-sm mb-2" style={{ color: '#888888' }}>
                        <span>Subtotal ({nights} {type === 'stay' ? 'nights' : 'days'})</span>
                        <span>₦{subtotal.toLocaleString()}</span>
                      </div>
                      {chauffeur && (
                        <div className="flex justify-between text-sm mb-2" style={{ color: '#888888' }}>
                          <span>Chauffeur Service</span>
                          <span>₦{chauffeurFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-serif text-2xl mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#F9F9F9' }}>
                        <span>Total</span>
                        <span>₦{total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-6" style={{ color: '#888888' }}>
                    <Lock size={12} style={{ color: '#2D5BFF' }} />
                    Secured by Paystack — Your payment is 256-bit SSL encrypted
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 px-8 h-12 text-xs tracking-[0.2em] uppercase transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#888888' }}>
                      <ChevronLeft size={16} /> Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 h-14 text-sm tracking-[0.2em] uppercase font-medium transition-all"
                      style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D5BFF'; }}
                    >
                      {loading ? (
                        <><Loader2 size={18} className="animate-spin" /> Processing...</>
                      ) : (
                        <><Lock size={16} /> Pay ₦{total.toLocaleString()}</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Success */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                <div
                  className="w-20 h-20 flex items-center justify-center mx-auto mb-8"
                  style={{ backgroundColor: 'rgba(45,91,255,0.1)', border: '1px solid rgba(45,91,255,0.4)' }}
                >
                  <Check size={36} style={{ color: '#2D5BFF' }} />
                </div>
                <h2 className="font-serif text-4xl mb-4" style={{ color: '#F9F9F9' }}>Booking Confirmed!</h2>
                <p className="text-sm leading-relaxed max-w-md mx-auto mb-3" style={{ color: '#888888' }}>
                  Your booking for <strong style={{ color: '#F9F9F9' }}>{selectedItem?.name}</strong> has been confirmed and payment processed.
                </p>
                <p className="text-sm mb-10" style={{ color: '#888888' }}>
                  A confirmation will be sent to <strong style={{ color: '#F9F9F9' }}>{guestInfo.email}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/')}
                    className="px-10 h-12 text-xs tracking-[0.2em] uppercase transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#F9F9F9' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D5BFF'; e.currentTarget.style.color = '#2D5BFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#F9F9F9'; }}
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={() => navigate('/contact')}
                    className="px-10 h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                    style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}
                  >
                    Contact Support
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </section>

      {/* Support Section */}
      {step <= 4 && (
        <section className="py-16 px-6 lg:px-16" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs tracking-[0.35em] uppercase mb-3" style={{ color: '#2D5BFF' }}>Get Any Problem With The Booking?</div>
              <h2 className="font-serif font-light text-3xl mb-4" style={{ color: '#F9F9F9' }}>Let our team help you</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#888888' }}>
                From selecting the perfect luxury vehicle to arranging your ideal stay, our experienced team is here to make every step effortless.
              </p>
              <div className="space-y-3 mb-6">
                {[
                  ['Monday – Tuesday', '8am – 10pm'],
                  ['Wednesday – Friday', '8am – 11pm'],
                  ['Weekend', '6am – 11pm'],
                ].map(([day, time]) => (
                  <div key={day} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-sm" style={{ color: '#2D5BFF' }}>{day}</span>
                    <span className="text-sm" style={{ color: '#F9F9F9' }}>{time}</span>
                  </div>
                ))}
              </div>
              <a
                href="tel:+2347046007419"
                className="inline-flex items-center gap-2 px-8 h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                style={{ backgroundColor: '#2D5BFF', color: '#F9F9F9' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1a45e8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2D5BFF'; }}
              >
                <Phone size={14} />
                Call: +234 704 600 7419
              </a>
            </div>
            <div
              className="aspect-[4/3] overflow-hidden"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1568992688065-536aad8a12f6?w=800)',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}