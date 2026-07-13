export default function Privacy() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information to provide you with the best luxury experience possible.

Personal Information:
• Full name and contact details
• Email address
• Phone number
• Payment information
• Government-issued ID (for verification)

Booking Information:
• Dates of stay or rental
• Selected room or vehicle
• Guest count
• Special requests

Payment Information: Payment details are processed securely through Paystack. We do not store full card numbers on our servers.

Technical Information:
• Browser type and version
• Device information
• IP address
• Cookies and session data`
    },
    {
      title: '2. How We Use Your Information',
      content: `We use your information to:
• Process and manage your bookings
• Send booking confirmations and reminders
• Provide customer support
• Improve our services
• Send promotional updates (with your consent)
• Comply with legal obligations
• Prevent fraud and ensure security`
    },
    {
      title: '3. Cookies',
      content: `We use cookies to enhance your browsing experience. Cookies help us remember your preferences and improve our website. You can disable cookies in your browser settings, though this may affect some features of our website.`
    },
    {
      title: '4. Information Sharing',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:
• Payment processors (Paystack) to complete transactions
• Service providers who assist us in operating our website
• Legal authorities when required by law

All third-party service providers are bound by strict data protection obligations.`
    },
    {
      title: '5. Data Security',
      content: `We implement industry-standard security measures to protect your personal information, including:
• SSL encryption for all data transmissions
• Secure payment processing via Paystack
• Access controls and authentication
• Regular security audits`
    },
    {
      title: '6. Your Privacy Rights',
      content: `You have the right to:
• Access your personal data we hold
• Request correction of inaccurate data
• Request deletion of your personal data
• Opt out of marketing communications
• Lodge a complaint with relevant authorities`
    },
    {
      title: '7. Data Retention',
      content: `We retain your personal data for as long as necessary to provide our services and comply with legal obligations. Booking records are typically retained for 7 years for accounting purposes.`
    },
    {
      title: '8. Children\'s Privacy',
      content: `Our services are not directed at children under 18 years of age. We do not knowingly collect personal information from children.`
    },
    {
      title: '9. Third-Party Services',
      content: `Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites and encourage you to review their privacy policies.`
    },
    {
      title: '10. Marketing Communications',
      content: `With your consent, we may send you promotional emails about special offers, new services, and updates. You can unsubscribe at any time by clicking the unsubscribe link in our emails or contacting us directly.`
    },
    {
      title: '11. International Users',
      content: `If you access our services from outside Nigeria, please be aware that your information may be transferred to and processed in Nigeria, where data protection laws may differ from those in your country.`
    },
    {
      title: '12. Changes to This Policy',
      content: `We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page with an updated date.`
    },
    {
      title: '13. Contact Us',
      content: `If you have any questions about this privacy policy or our data practices, please contact us:

Frensic Luxury Apartment
Durumi, Abuja, Nigeria
Email: info@frensicluxuryapartment.com.ng
Phone: +234 704 600 7419`
    },
  ];

  return (
    <div style={{ backgroundColor: '#050505' }}>
      {/* Hero */}
      <section
        className="relative h-64 md:h-80 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#C9A84C' }}>Home / Privacy Policy</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>Privacy Policy</h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="text-xs tracking-[0.35em] uppercase mb-4" style={{ color: '#C9A84C' }}>Who We Are</div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#888888' }}>
              <strong style={{ color: '#F9F9F9' }}>Frensic Luxury Apartment</strong> is committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information when you use our website and services.
            </p>
            <p className="text-xs" style={{ color: '#888888' }}>
              <strong style={{ color: '#888888' }}>Last updated:</strong> July 2026
            </p>
          </div>

          <div className="space-y-0">
            {sections.map((sec, i) => (
              <div
                key={i}
                className="grid grid-cols-1 lg:grid-cols-4 gap-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="lg:sticky lg:top-24 self-start p-8 lg:pr-12">
                  <h2
                    className="font-serif text-2xl font-light leading-tight"
                    style={{ color: '#F9F9F9' }}
                  >
                    {sec.title}
                  </h2>
                </div>
                <div className="lg:col-span-3 p-8" style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    className="text-sm leading-relaxed whitespace-pre-line"
                    style={{ color: '#888888' }}
                  >
                    {sec.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}