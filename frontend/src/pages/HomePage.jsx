import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../api';

const CATEGORIES = [
  { icon: 'crown', label: 'Telugu Digital Icon of the Year' },
  { icon: 'play', label: 'Telugu YouTuber of the Year' },
  { icon: 'chip', label: 'Best Tech Creator' },
  { icon: 'instagram', label: 'Best Instagram Creator' },
];

const STATS = [
  { value: '50', label: 'Total Awards' },
  { value: '40', label: 'Self-Nomination Categories' },
  { value: '10', label: 'Jury & Special Recognition' },
  { value: '1', label: 'Grand Celebration' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [settings, setSettings] = useState({});
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    api.get('/nominees/featured').then((data) => {
      if (Array.isArray(data)) setFeatured(data);
    }).catch(() => {});

    api.get('/settings').then((data) => {
      if (Array.isArray(data)) {
        const obj = {};
        data.forEach((s) => { obj[s.setting_key] = s.setting_value; });
        setSettings(obj);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const target = settings.event_date ? new Date(settings.event_date).getTime() : new Date().getTime() + 90 * 86400000;
    const interval = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.event_date]);

  return (
    <PageTransition>
      <section className="relative bg-hero-gradient min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-burgundy-700/30 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-champagne-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_90%)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-champagne-400 uppercase tracking-[0.3em] text-xs sm:text-sm font-semibold mb-4">
              {settings.event_tagline || 'Celebrating Telugu Digital Excellence'}
            </p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black leading-tight mb-6">
              <span className="gold-text">{settings.hero_headline || 'Where Digital Icons'}</span>
              <br />
              <span className="text-white">Rise.</span>
            </h1>
            <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
              {settings.hero_subheadline || 'The grand celebration of Telugu digital excellence, creators, and culture.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/nominate" className="btn-gold">
                Nominate Yourself
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              </Link>
              <Link to="/vote" className="btn-outline">Vote for Your Icon</Link>
            </div>
            <p className="text-champagne-300 text-sm md:text-base font-semibold mb-4 tracking-wide">
              📅 16 NOVEMBER 2026 &nbsp;•&nbsp; 📍 SHILPAKALA VEDIKA • HYDERABAD
            </p>
            {settings.announcement && (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-champagne-500/10 border border-champagne-500/30 text-champagne-300 text-sm">
                <span className="w-2 h-2 bg-champagne-400 rounded-full animate-pulse mr-2" />
                {settings.announcement}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 bg-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center p-6 glass-card"
              >
                <div className="text-4xl md:text-5xl font-display font-bold gold-text mb-2">{stat.value}</div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-gradient-to-b from-ink-900 to-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-subtitle">The Awards</p>
              <h2 className="section-title">More Than An Awards Night</h2>
              <p className="text-white/60 leading-relaxed mb-8">
                The Telugu Icon Digital & Influencer Awards is a celebration of the creators and influencers shaping
                the Telugu digital world. From YouTube and Instagram to podcasts, technology, food, travel, education,
                gaming, business and lifestyle — we honour the voices who entertain, inspire, educate and connect millions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {CATEGORIES.map((c) => (
                  <div key={c.label} className="flex items-center space-x-3 p-4 glass-card group hover:border-champagne-500/40 transition-all duration-300">
                    <span className="text-2xl">{iconMap(c.icon)}</span>
                    <span className="text-white/80 text-sm group-hover:text-champagne-300 transition-colors">{c.label}</span>
                  </div>
                ))}
              </div>
              <Link to="/awards" className="btn-outline">Explore All Categories</Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-burgundy-800 to-champagne-600 rounded-3xl opacity-20 blur-2xl" />
              <div className="relative glass-card p-8">
                <h3 className="font-display text-2xl font-bold gold-text mb-6 text-center">Countdown to the Big Night</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { v: countdown.days, l: 'Days' },
                    { v: countdown.hours, l: 'Hours' },
                    { v: countdown.mins, l: 'Minutes' },
                    { v: countdown.secs, l: 'Seconds' },
                  ].map((t) => (
                    <div key={t.l} className="text-center p-4 bg-ink-800 rounded-2xl border border-white/10">
                      <div className="text-3xl md:text-4xl font-display font-bold text-white">{String(t.v).padStart(2, '0')}</div>
                      <div className="text-white/40 text-xs mt-1 uppercase tracking-wider">{t.l}</div>
                    </div>
                  ))}
                </div>
                {settings.event_venue && (
                  <p className="text-white/40 text-sm text-center mt-6">
                    📍 {settings.event_venue}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-subtitle">Nominees</p>
            <h2 className="section-title">Creators to Watch</h2>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((n) => (
                <Link key={n.id} to={`/nominee/${n.id}`} className="group">
                  <div className="glass-card overflow-hidden group-hover:border-champagne-500/40 transition-all duration-300">
                    <div className="aspect-[4/3] bg-gradient-to-br from-ink-700 to-burgundy-900 flex items-center justify-center">
                      {n.photo_url ? (
                        <img src={n.photo_url} alt={n.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">🏆</span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white group-hover:text-champagne-400 transition-colors truncate">{n.full_name}</h3>
                      </div>
                      <p className="text-white/40 text-xs mb-3">{n.category_name}</p>
                      <span className="inline-flex items-center text-xs text-champagne-400">
                        {n.vote_count.toLocaleString()} votes
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/40 py-12">
              Featured nominees will appear once creators are shortlisted. Nominate yourself today!
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/nominees" className="btn-gold">View All Nominees</Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-subtitle">The Icon Journey</p>
            <h2 className="section-title">How It Works</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              From self-nomination to the grand stage — four steps to icon status.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Nominate', d: 'Submit your self-nomination in the category that best fits your content and audience.' },
              { n: '02', t: 'Get Verified', d: 'Our team verifies your details, digital profiles and supporting information.' },
              { n: '03', t: 'Official Nominee Profile', d: 'Receive your unique shareable nominee profile with the Official Nominee badge.' },
              { n: '04', t: 'Campaign & Get Votes', d: 'Share your voting link, rally your community and climb the People\'s Choice standings.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative glass-card p-6 group hover:border-champagne-500/40 transition-all duration-300"
              >
                <div className="font-display text-5xl font-black gold-text opacity-30 group-hover:opacity-100 transition-opacity duration-300">{s.n}</div>
                <h3 className="text-xl font-semibold text-white mt-3 mb-2 group-hover:text-champagne-300 transition-colors">{s.t}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-subtitle">The Experience</p>
            <h2 className="section-title">One Night. A Thousand Stories. Fifty Icon Moments.</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              16 November 2026 at Shilpakala Vedika, Hyderabad — a cinematic celebration of Telugu digital culture.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🔴', t: 'Red Carpet', d: 'The spotlight begins the moment the icons arrive.' },
              { icon: '🌟', t: 'Creator Arrivals', d: 'Telugu digital\'s brightest walk the carpet.' },
              { icon: '🎤', t: 'Live Awards', d: '50 awards presented live on the grand stage.' },
              { icon: '🏆', t: 'Icon Moments', d: 'Unforgettable moments — captured forever.' },
              { icon: '🎥', t: 'Media Wall', d: 'Flashes, interviews and press coverage all night.' },
              { icon: '🥂', t: 'Celebration', d: 'A night of Telugu music, dance and culture.' },
            ].map((m, i) => (
              <motion.div
                key={m.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 text-center group hover:border-champagne-500/40 transition-all duration-300"
              >
                <div className="text-4xl mb-3">{m.icon}</div>
                <h3 className="font-semibold text-white mb-1 group-hover:text-champagne-300 transition-colors">{m.t}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{m.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 bg-hero-gradient overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            The Digital World Has Spoken.
            <br />
            <span className="gold-text">Now, Let the Icons Rise.</span>
          </h2>
          <p className="text-white/60 mb-10 text-lg">
            The 2026 Telugu Icon Digital & Influencer Awards is your chance to be recognized on the biggest stage for
            Telugu digital talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/nominate" className="btn-gold">Nominate Yourself</Link>
            <Link to="/sponsors" className="btn-outline">Become a Partner</Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

function iconMap(name) {
  const icons = {
    crown: '👑', star: '⭐', play: '▶️', instagram: '📸', rocket: '🚀',
    chip: '💻', food: '🍔', handshake: '🤝',
  };
  return icons[name] || '🏆';
}