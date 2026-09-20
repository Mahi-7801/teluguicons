import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';

const FAQS = [
  {
    category: 'general',
    q: 'What is the Telugu Icon Digital & Influencer Awards 2026?',
    a: 'Telugu Icon Digital & Influencer Awards 2026 is South India’s premier creator recognition platform honoring outstanding digital creators, influencers, and media personalities across 40 curated categories with 100% verified, transparent public voting and expert jury validation.',
  },
  {
    category: 'general',
    q: 'When and where is the event taking place?',
    a: 'The grand gala takes place on Sunday, August 30, 2026, at the prestigious Hitex Exhibition Center, Hitec City, Hyderabad.',
  },
  {
    category: 'event',
    q: 'What are the two event sessions on August 30, 2026?',
    a: 'The gala is split into two power-packed sessions:\n• Session 1 (10:00 AM – 2:00 PM): Digital Creators & Emerging Voices (Includes Buffet Lunch).\n• Session 2 (3:00 PM – 7:00 PM): Mega Influencers, Celebrity Icons & Grand Finale (Includes Gala Dinner).\nSeparate tickets are required for each session.',
  },
  {
    category: 'nominations',
    q: 'Who is eligible to nominate for an award?',
    a: 'Any Telugu creator, influencer, streamer, podcaster, or digital organization producing Telugu content across YouTube, Instagram, Facebook, X, or podcast platforms is eligible. Self-nominations and public peer nominations are both accepted.',
  },
  {
    category: 'nominations',
    q: 'Is there any entry or nomination submission fee?',
    a: 'No. Submitting a nomination is completely free of charge. The platform is committed to merit and authentic audience impact without financial paywalls.',
  },
  {
    category: 'nominations',
    q: 'What happens after I submit a nomination?',
    a: 'Our editorial screening team verifies follower legitimacy, content guidelines, and channel authenticity. Once verified, nominations move to the shortlisting phase where official nominees are announced for public voting.',
  },
  {
    category: 'voting',
    q: 'How does the public voting process work?',
    a: 'Voting is 100% OTP-verified. To vote, enter your Indian mobile number, verify the 6-digit verification code provided by our secure verification engine, and cast your vote. You can vote once per category per mobile number.',
  },
  {
    category: 'voting',
    q: 'How do you prevent fraudulent or bot votes?',
    a: 'Our anti-fraud engine employs IP rate limiting, device fingerprinting, disposable number detection, and automated audit flags. Any vote spike exceeding statistical thresholds is reviewed and quarantined.',
  },
  {
    category: 'voting',
    q: 'Can I vote for nominees in multiple categories?',
    a: 'Yes! Your verified mobile number grants you one vote in each of the 40 award categories.',
  },
  {
    category: 'voting',
    q: 'How are the final winners determined?',
    a: 'Final winners are calculated using a weighted hybrid system combining verified public votes with an esteemed grand jury panel score to ensure both popularity and artistic excellence are rewarded.',
  },
  {
    category: 'tickets',
    q: 'What ticket types are available and how much do they cost?',
    a: 'Tickets are offered in two tiers per session:\n• VVIP Pass: ₹500 (Priority Seating + Session Food Entitlement)\n• MIP (Most Important Person): ₹1,000 (Front Zone Seating + Red Carpet Walkway Access + Food Entitlement)',
  },
  {
    category: 'tickets',
    q: 'Is food and beverage included with the tickets?',
    a: 'Yes! Session 1 tickets include an elaborate Andhra & Telangana buffet lunch. Session 2 tickets include the Grand Gala dinner buffet. Food coupons are tied to your digital ticket QR code.',
  },
  {
    category: 'tickets',
    q: 'Are tickets refundable or transferable?',
    a: 'No. As per our strict ticketing policy, all purchases are strictly non-refundable and non-exchangeable. Please verify your session time and attendee names before confirming payment.',
  },
  {
    category: 'event',
    q: 'Can nominees attend the awards ceremony for free?',
    a: 'Official shortlisted nominees receive an official Nominee Pass granting them access to their designated category session. Companion or guest passes must be booked via the Tickets page.',
  },
  {
    category: 'sponsors',
    q: 'How can brands sponsor or partner with Telugu Icon Awards 2026?',
    a: 'We offer Title, Powered-By, Co-Powered, Category, and Experience Zone partnership tiers reaching 5M+ digital impressions. You can explore our deck on the Sponsors page or submit a query through our Partner enquiry form.',
  },
];

const CATEGORIES = [
  { key: '', label: 'All Questions' },
  { key: 'general', label: 'General' },
  { key: 'nominations', label: 'Nominations' },
  { key: 'voting', label: 'Voting & Audits' },
  { key: 'tickets', label: 'Tickets & Food' },
  { key: 'event', label: 'Event Day' },
  { key: 'sponsors', label: 'Partnerships' },
];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openIdx, setOpenIdx] = useState(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = !activeCategory || faq.category === activeCategory;
    const matchesSearch = !searchTerm ||
      faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a.replace(/\n/g, '<br/>'),
      },
    })),
  };

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="relative py-24 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="section-subtitle">Help & Transparency</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            Frequently Asked <span className="gold-text">Questions</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg">
            Everything you need to know about nominations, OTP-verified voting, ticketing, sessions, and gala day protocols.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions (e.g., tickets, voting, food)..."
              className="w-full px-5 py-3.5 pl-12 rounded-2xl bg-ink-800/90 border border-white/10 text-white placeholder-white/30 focus:border-champagne-500 focus:outline-none shadow-lg text-sm"
            />
            <svg
              className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs uppercase"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Accordion Section */}
      <section className="py-16 bg-ink-900 min-h-[60vh]">
        <div className="max-w-4xl mx-auto px-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setActiveCategory(cat.key);
                  setOpenIdx(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.key
                    ? 'bg-champagne-500 text-ink-900 shadow-gold font-bold'
                    : 'bg-ink-800 text-white/60 border border-white/10 hover:border-champagne-500/40 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 bg-ink-800/40 rounded-2xl border border-white/5 p-8">
              <p className="text-white/40 text-base mb-3">No matching questions found for "{searchTerm}".</p>
              <button
                onClick={() => { setSearchTerm(''); setActiveCategory(''); }}
                className="text-xs font-semibold text-champagne-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((item, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? 'bg-ink-800/90 border-champagne-500/40 shadow-gold'
                        : 'bg-ink-800/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                    >
                      <span className="font-display font-semibold text-white text-base md:text-lg leading-snug">
                        {item.q}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 ${
                          isOpen
                            ? 'rotate-180 bg-champagne-500 text-ink-900 border-champagne-400'
                            : 'bg-white/5 text-white/60 border-white/10'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-6 pb-6 pt-1 text-white/70 text-sm md:text-base leading-relaxed whitespace-pre-line border-t border-white/5">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {/* Still have questions? */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-ink-800 to-burgundy-900/40 border border-white/10 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
            <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
              Our support team is here to assist you with nominations, voting, or ticket queries.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="px-6 py-3 rounded-full bg-champagne-500 text-ink-900 font-semibold text-sm hover:bg-champagne-400 transition-all shadow-gold"
              >
                Contact Support Desk
              </a>
              <a
                href="mailto:help@teluguiconawards.com"
                className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-all"
              >
                help@teluguiconawards.com
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
