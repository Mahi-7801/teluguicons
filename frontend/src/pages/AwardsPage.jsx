import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../api';

export default function AwardsPage() {
  const [jury, setJury] = useState([]);
  const [selfNomination, setSelfNomination] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get('/categories/jury').then(setJury).catch(() => {});
    api.get('/categories/self-nomination').then(setSelfNomination).catch(() => {});
  }, []);

  const all = [...jury, ...selfNomination];
  const filtered = activeTab === 'all'
    ? all
    : activeTab === 'jury'
      ? jury
      : selfNomination;

  return (
    <PageTransition>
      <section className="relative py-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="section-subtitle">The Categories</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
            <span className="gold-text">50 Awards.</span> <span className="text-white">One Digital Community.</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto mb-10">
            The Telugu Icon Digital & Influencer Awards 2026 — 40 self-nomination categories open for creators, and
            10 Jury & Special Recognition Awards selected by the official jury.
          </p>
          <div className="inline-flex rounded-xl bg-ink-800 border border-white/10 p-1">
            {[
              { key: 'all', label: 'All Awards' },
              { key: 'jury', label: 'Jury & Special Recognition' },
              { key: 'self', label: 'Self-Nomination' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === t.key ? 'bg-champagne-500 text-ink-900' : 'text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 group hover:border-champagne-500/40 hover:bg-white/[0.07] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{cat.type === 'jury' ? '👑' : '🏆'}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                    cat.type === 'jury'
                      ? 'bg-champagne-500/15 text-champagne-400 border border-champagne-500/30'
                      : 'bg-white/10 text-white/50 border border-white/10'
                  }`}>
                    {cat.type === 'jury' ? 'Jury Award' : 'Self-Nomination'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-champagne-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {cat.description || (cat.type === 'jury'
                    ? 'Selected through the official jury/organizing process.'
                    : 'Open for creator self-nomination and public voting.')}
                </p>
                <div className="mt-5">
                  {cat.type === 'jury' ? (
                    <span className="inline-flex items-center text-xs text-white/40">
                      👑 Jury Award — not open for nomination
                    </span>
                  ) : (
                    <a href="/nominate" className="btn-gold text-sm py-2 px-4">Nominate Yourself</a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
          {filtered.length === 0 && (
            <div className="text-center text-white/40 py-20">
              Loading categories...
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-ink-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-subtitle">The Journey</p>
            <h2 className="section-title">How the Awards Work</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Forty People's Choice categories are decided by creator-led campaigns and public votes.
              Ten Jury &amp; Special Recognition Awards are selected by the official jury. Here's how it all unfolds.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Nominate', d: 'Creators submit their self-nomination in the category that best fits their content and audience.' },
              { n: '02', t: 'Get Verified', d: 'Our team verifies every nomination — profile, digital presence and supporting content.' },
              { n: '03', t: 'Official Nominee Profiles', d: 'Approved creators receive unique shareable profiles with the Official Nominee badge.' },
              { n: '04', t: 'Rally & Get Voted', d: 'Nominees share their voting links, communities vote, and People\'s Choice champions rise.' },
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
          <div className="mt-10 glass-card p-6 max-w-3xl mx-auto text-center">
            <p className="text-white/60 text-sm leading-relaxed">
              👑 <strong className="text-white">Jury &amp; Special Recognition Awards</strong> are evaluated by the official jury on contribution,
              influence, originality, impact and achievement — announced live at the grand gala ceremony on
              <span className="text-champagne-300"> Sunday, August 30, 2026</span> at Hitex Exhibition Center, Hyderabad.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-ink-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="section-title">Your Content. Your Voice. Your Moment.</h2>
          <p className="text-white/60 mb-8">
            Are you a Telugu digital creator, influencer, YouTuber, storyteller, entrepreneur or digital personality?
            Put yourself forward for the Telugu Icon Digital & Influencer Awards 2026.
          </p>
          <a href="/nominate" className="btn-gold">Nominate Yourself</a>
        </div>
      </section>
    </PageTransition>
  );
}