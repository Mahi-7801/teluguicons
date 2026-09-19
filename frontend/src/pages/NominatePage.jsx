import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { api } from '../api';

const STEPS = ['Category', 'Creator Details', 'Digital Presence', 'Your Story', 'Review & Submit'];

const BASE_FORM = {
  category_id: '',
  full_name: '',
  creator_name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  primary_platform: 'YouTube',
  youtube_url: '',
  instagram_url: '',
  facebook_url: '',
  other_profile_url: '',
  website_url: '',
  journey: '',
  achievements: '',
  support_links: '',
  agree: false,
};

export default function NominatePage() {
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState(BASE_FORM);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [nominationId, setNominationId] = useState(null);

  useEffect(() => {
    api.get('/categories').then((data) => {
      if (Array.isArray(data)) {
        setCategories(data.filter((c) => c.type === 'self_nomination'));
      }
    }).catch(() => {});
  }, []);

  const update = (e) => {
    const target = e.target;
    setForm({ ...form, [target.name]: target.type === 'checkbox' ? target.checked : target.value });
  };

  const next = () => {
    setError(null);
    setMessage(null);
    if (step === 0 && !form.category_id) { setError('Please select a category.'); return; }
    if (step === 1) {
      if (!form.full_name.trim()) { setError('Full name is required.'); return; }
      if (!/^[6-9]\d{9}$/.test(form.phone.replace(/[^\d]/g, ''))) { setError('Enter a valid 10-digit mobile number.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Enter a valid email address.'); return; }
    }
    setStep(Math.min(step + 1, STEPS.length - 1));
  };

  const prev = () => setStep(Math.max(step - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.agree) { setError('Please accept the Terms & Conditions to continue.'); return; }
    try {
      const fd = new FormData();
      ['category_id', 'full_name', 'creator_name', 'email', 'phone', 'city', 'state',
        'primary_platform', 'youtube_url', 'instagram_url', 'facebook_url',
        'other_profile_url', 'website_url', 'journey', 'achievements', 'support_links']
        .forEach((k) => {
          if (String(form[k] || '').trim() !== '') fd.append(k, form[k]);
        });
      if (photo) fd.append('photo', photo);
      const res = await api.postMultipart('/nominations', fd);
      if (res.message) {
        setNominationId(res.nomination_code || res.id);
        setSubmitted(true);
      } else {
        setError(res.message || 'Failed to submit. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (submitted) {
    return (
      <PageTransition>
        <div className="min-h-[70vh] flex items-center justify-center bg-hero-gradient">
          <div className="relative max-w-lg mx-auto px-4 text-center">
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="font-display text-4xl font-bold gold-text mb-4">Nomination Submitted!</h1>
            <p className="text-white/60 mb-2">Thank you for submitting your self-nomination.</p>
            <p className="text-white/40 mb-6">
              Your nomination for the Telugu Icon Digital & Influencer Awards 2026 has been successfully received.
            </p>
            <div className="glass-card p-6 mb-8">
              <p className="text-white/40 text-sm mb-2">YOUR NOMINATION ID</p>
              <p className="font-display text-3xl font-bold gold-text">{nominationId}</p>
              <p className="text-white/30 text-xs mt-3">Please save your Nomination ID for future communication.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/" className="btn-outline">Back to Home</a>
              <button
                onClick={() => navigator.clipboard?.writeText(`${nominationId} — My Nomination at the Telugu Icon Digital & Influencer Awards 2026 ${window.location.origin}/nominees`)}
                className="btn-gold"
              >
                Share My Nomination
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="relative py-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <p className="section-subtitle">Your Content. Your Voice. Your Moment.</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            <span className="gold-text">Nominate</span> <span className="text-white">Yourself</span>
          </h1>
          <p className="text-white/60">
            The Telugu Icon Digital & Influencer Awards 2026 accepts <strong className="text-champagne-300">self-nominations only</strong>.
            Put your own profile forward for recognition.
          </p>
        </div>
      </section>

      <section className="py-16 bg-ink-900">
        <div className="max-w-2xl mx-auto px-4">
          <div className="rounded-xl border border-champagne-500/30 bg-champagne-500/10 px-4 py-3 text-sm text-champagne-300 mb-8">
            <strong>SELF-NOMINATION ONLY</strong> — By proceeding, you confirm that you are submitting your own profile.
          </div>

          <div className="flex items-center justify-between mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1 relative">
                {i > 0 && (
                  <div className={`hidden sm:block absolute top-4 left-[-50%] right-1/2 h-0.5 ${i <= step ? 'bg-champagne-500' : 'bg-white/10'}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                  i === step
                    ? 'bg-champagne-500 text-ink-900 border-champagne-500'
                    : i < step
                      ? 'bg-champagne-500/20 text-champagne-400 border-champagne-500/50'
                      : 'bg-ink-800 text-white/40 border-white/10'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] sm:text-xs mt-2 hidden sm:block ${i <= step ? 'text-champagne-400' : 'text-white/40'}`}>{s}</span>
              </div>
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 sm:p-8"
          >
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-burgundy-900/50 border border-burgundy-500/40 text-white/80 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-sm">
                {message}
              </div>
            )}

            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Select Your Category *</label>
                  <select name="category_id" value={form.category_id} onChange={update} className="input-field">
                    <option value="">Choose one of the 40 self-nomination categories...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>🏆 {c.name}</option>
                    ))}
                  </select>
                  <p className="text-white/30 text-xs mt-2">
                    Jury & Special Recognition Awards are selected by the official jury and are not open for nomination.
                  </p>
                </div>
                <div className="bg-ink-800 border border-white/10 rounded-xl p-4 text-sm text-white/50 leading-relaxed">
                  📌 <strong className="text-white/80">One category per nomination.</strong> Select the category that best fits your content.
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Full Name *</label>
                    <input type="text" name="full_name" value={form.full_name} onChange={update} placeholder="Your legal name" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Creator / Channel Name *</label>
                    <input type="text" name="creator_name" value={form.creator_name} onChange={update} placeholder="Your channel / creator name" className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Mobile Number *</label>
                    <input type="tel" name="phone" value={form.phone} onChange={update} maxLength={10} placeholder="10-digit mobile" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={update} placeholder="you@email.com" className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">City *</label>
                    <input type="text" name="city" value={form.city} onChange={update} placeholder="Hyderabad, Vijayawada..." className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">State *</label>
                    <input type="text" name="state" value={form.state} onChange={update} placeholder="Telangana / Andhra Pradesh..." className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Profile Photograph *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className="input-field file:mr-3 file:rounded-lg file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:text-white"
                  />
                  {photo && <p className="text-champagne-400 text-xs mt-2">✓ {photo.name} selected</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Primary Platform *</label>
                  <select name="primary_platform" value={form.primary_platform} onChange={update} className="input-field">
                    {['YouTube', 'Instagram', 'Facebook', 'Podcast', 'Other'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">YouTube Channel URL</label>
                    <input type="url" name="youtube_url" value={form.youtube_url} onChange={update} placeholder="youtube.com/@yourchannel" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Instagram Profile URL</label>
                    <input type="url" name="instagram_url" value={form.instagram_url} onChange={update} placeholder="instagram.com/@yourhandle" className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Facebook Profile URL</label>
                    <input type="url" name="facebook_url" value={form.facebook_url} onChange={update} placeholder="facebook.com/yourpage" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Other Digital Profile</label>
                    <input type="url" name="other_profile_url" value={form.other_profile_url} onChange={update} placeholder="Podcast / X / LinkedIn..." className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Official Website</label>
                  <input type="url" name="website_url" value={form.website_url} onChange={update} placeholder="yourwebsite.com" className="input-field" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Tell us about your creator journey</label>
                  <textarea
                    name="journey"
                    value={form.journey}
                    onChange={update}
                    rows={6}
                    placeholder="Describe your journey as a digital creator, the content you create, your audience, and what makes your work unique. (Recommended: up to 1,000 words)"
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Achievements, milestones & recognitions</label>
                  <textarea
                    name="achievements"
                    value={form.achievements}
                    onChange={update}
                    rows={4}
                    placeholder="Major achievements, milestones, campaigns, collaborations, community impact, previous awards or recognition..."
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Supporting content (URLs, one per line)</label>
                  <textarea
                    name="support_links"
                    value={form.support_links}
                    onChange={update}
                    rows={3}
                    placeholder="Link to your best video / reel / short / campaign / portfolio / media coverage..."
                    className="input-field resize-none"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-ink-800 border border-white/10 rounded-xl p-4 text-sm text-white/50 leading-relaxed">
                  <strong className="text-white/80">Review your self-nomination:</strong> confirm all details are correct. Our team will verify the information and shortlist eligible creators.
                </div>
                <label className="flex items-start space-x-3 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" name="agree" checked={form.agree} onChange={update} className="mt-1" />
                  <span>
                    I confirm that the information provided in this nomination is accurate to the best of my knowledge and that the digital profiles and supporting information submitted belong to me or are under my control.
                  </span>
                </label>
                <label className="flex items-start space-x-3 text-sm text-white/70 cursor-pointer">
                  <input type="checkbox" checked readOnly className="mt-1 opacity-40" />
                  <span className="opacity-60">
                    I agree to the Telugu Icon Digital & Influencer Awards Terms & Conditions. <a href="/#" className="text-champagne-400 underline">View Terms</a>
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
              <button type="button" onClick={prev} disabled={step === 0} className="btn-outline disabled:opacity-30 disabled:cursor-not-allowed">Back</button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="btn-gold">Continue</button>
              ) : (
                <button type="button" onClick={handleSubmit} className="btn-gold">Submit Self-Nomination</button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-ink-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-subtitle">The Journey After Nomination</p>
            <h2 className="section-title">Your Road to the Icon Stage</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              The moment you hit submit, your story begins. Here's exactly what happens next.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { n: '01', t: 'Nomination Received', d: 'Your self-nomination is logged instantly and our team begins reviewing your submission.', tag: 'Immediate' },
              { n: '02', t: 'Verification & Shortlisting', d: 'We verify your details, digital profiles and supporting content to confirm your eligibility.', tag: 'Within a few days' },
              { n: '03', t: 'Official Nominee Profile', d: 'Approved creators receive a unique shareable profile with the Official Nominee badge — your campaign HQ.', tag: 'On approval' },
              { n: '04', t: 'Campaign & Get Votes', d: 'Share your voting link on WhatsApp, Instagram and YouTube. Every vote your community rallies counts.', tag: 'Voting window' },
              { n: '05', t: 'Results: The Grand Night', d: 'Winners across the 40 People\'s Choice categories are announced live on the grand night.', tag: '16 Nov 2026' },
              { n: '06', t: 'Icon Status', d: 'Champions are celebrated across media, press and the entire Telugu digital community.', tag: 'Forever' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-5 flex items-start gap-5 group hover:border-champagne-500/40 hover:bg-white/[0.07] transition-all duration-300"
              >
                <span className="font-display text-4xl font-black gold-text opacity-40 shrink-0 group-hover:opacity-100 transition-opacity duration-300">{s.n}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-white">{s.t}</h3>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-champagne-500/15 border border-champagne-500/30 text-champagne-400">{s.tag}</span>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-white/50 mb-6">
              Already submitted? Save your Nomination ID and rally your community the moment your profile goes live.
            </p>
            <a href="/vote" className="btn-gold">See How Voting Works</a>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}