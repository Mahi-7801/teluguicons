import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import OtpVote from '../components/OtpVote';
import { api } from '../api';

export default function NomineeProfile() {
  const { id } = useParams();
  const [nominee, setNominee] = useState(null);
  const [error, setError] = useState(null);
  const [voted, setVoted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/nominees/${id}`).then((data) => {
      if (data && data.id) setNominee(data);
      else setError('Nominee not found');
    }).catch(() => setError('Nominee not found'));
  }, [id]);

  if (error && !nominee) {
    return (
      <PageTransition>
        <div className="min-h-[70vh] flex items-center justify-center bg-hero-gradient">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold gold-text mb-4">Nominee Not Found</h1>
            <a href="/nominees" className="btn-outline">Back to Nominees</a>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!nominee) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <section className="relative py-12 sm:py-20 bg-hero-gradient overflow-hidden px-3 sm:px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8 items-start">
            <div className="md:col-span-2">
              <div className="glass-card overflow-hidden max-w-xs mx-auto md:max-w-none">
                <div className="aspect-square bg-gradient-to-br from-ink-700 to-burgundy-900 flex items-center justify-center">
                  {nominee.photo_url ? (
                    <img src={nominee.photo_url} alt={nominee.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-7xl sm:text-9xl">🏆</span>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-champagne-500/15 border border-champagne-500/40 text-champagne-300 text-[11px] sm:text-xs font-semibold mb-3">
                ⭐ Official Nominee • {nominee.nominee_code}
              </span>
              <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-1.5 sm:mb-2">{nominee.full_name}</h1>
              <p className="text-champagne-400 text-sm sm:text-base md:text-lg mb-3">{nominee.category_name}</p>
              {nominee.social_handle && (
                <p className="text-white/60 text-xs sm:text-sm mb-3">📱 {nominee.social_handle}</p>
              )}
              <p className="text-white/50 text-xs sm:text-sm leading-relaxed mb-5">
                {nominee.bio || 'No bio provided yet. Follow this creator\'s journey!'}
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
                <div className="glass-card p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-display font-bold gold-text">{nominee.vote_count.toLocaleString()}</div>
                  <div className="text-white/40 text-[10px] sm:text-xs mt-1">Votes</div>
                </div>
                <div className="glass-card p-3 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl font-display font-bold gold-text">
                    {nominee.followers_count ? nominee.followers_count.toLocaleString() : '—'}
                  </div>
                  <div className="text-white/40 text-[10px] sm:text-xs mt-1">Followers</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-display font-bold gold-text">2026</div>
                  <div className="text-white/40 text-xs mt-1">Inducted</div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="font-display text-xl font-bold text-white mb-4">Cast Your Vote 🗳️</h2>
                {voted ? (
                  <div className="text-center py-4">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="text-champagne-300 font-semibold mb-2">Your vote has been recorded!</p>
                    <p className="text-white/50 text-sm mb-4">Thank you for supporting the Telugu digital creator community.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Support ${nominee.full_name} at the Telugu Icon Digital & Influencer Awards 2026 ${window.location.href}`)}`} target="_blank" rel="noreferrer" className="btn-outline text-xs">WhatsApp</a>
                      <button
                        onClick={() => navigator.clipboard?.writeText(window.location.href)}
                        className="btn-outline text-xs"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                ) : (
                  <OtpVote nominee={nominee} onVoted={() => setVoted(true)} />
                )}
              </div>

              <div className="glass-card p-6 mt-6">
                <h2 className="font-display text-xl font-bold text-white mb-2">Share This Nomination</h2>
                <p className="text-white/50 text-sm mb-5">
                  Support <span className="text-champagne-400">{nominee.full_name}</span> — share this official profile
                  with your community and rally the votes.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Support ${nominee.full_name} — Official Nominee at the Telugu Icon Digital & Influencer Awards 2026. Cast your vote: ${window.location.href}`)}`}
                    target="_blank" rel="noreferrer"
                    className="btn-outline text-xs"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank" rel="noreferrer"
                    className="btn-outline text-xs"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Support ${nominee.full_name} — Official Nominee at the Telugu Icon Digital & Influencer Awards 2026.`)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank" rel="noreferrer"
                    className="btn-outline text-xs"
                  >
                    X
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Vote for ${nominee.full_name} — Telugu Icon Awards 2026`)}&body=${encodeURIComponent(`Support ${nominee.full_name}, an Official Nominee at the Telugu Icon Digital & Influencer Awards 2026.\n\nVote here: ${window.location.href}`)}`}
                    className="btn-outline text-xs"
                  >
                    Email
                  </a>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-ink-800 border border-white/10 flex items-center justify-between gap-3">
                  <span className="text-white/40 text-xs truncate">{window.location.href}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`btn-outline text-xs px-4 py-2 shrink-0 ${copied ? 'border-champagne-500 text-champagne-400' : ''}`}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}