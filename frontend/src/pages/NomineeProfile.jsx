import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import OtpVote from '../components/OtpVote';
import { api, getAssetUrl, API_BASE } from '../api';

const getSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://teluguiconawards.in';
};

// ── Tiny QR code generator (no library needed) using Google Charts API ──
function QRCode({ value, size = 160 }) {
  if (!value) return null;
  const src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&bgcolor=0a0a0a&color=D4AF37&margin=8&format=png`;
  return (
    <img
      src={src}
      alt="QR Code"
      width={size}
      height={size}
      className="rounded-xl border border-champagne-500/40"
      loading="lazy"
    />
  );
}

// ── Dynamic OG / meta tags via document head manipulation ──
function useNomineeMetaTags(nominee) {
  useEffect(() => {
    if (!nominee) return;
    const siteUrl = getSiteUrl();
    const prev = {
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
      ogDesc: document.querySelector('meta[property="og:description"]')?.content,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content,
    };

    const title = `${nominee.full_name} — ${nominee.category_name} | Telugu Icon Digital & Influencer Awards 2026`;
    const desc = `${nominee.full_name} is an Official Nominee for ${nominee.category_name} at the Telugu Icon Digital & Influencer Awards 2026. Vote now and support your favourite Telugu creator!`;
    const canonicalUrl = `${siteUrl}/nominee/${nominee.slug || nominee.id}`;
    const photoUrl = nominee.photo_url ? getAssetUrl(nominee.photo_url) : `${siteUrl}/og-default.jpg`;

    document.title = title;
    setMeta('description', desc);
    setOgMeta('og:title', title);
    setOgMeta('og:description', desc);
    setOgMeta('og:image', photoUrl);
    setOgMeta('og:url', canonicalUrl);
    setOgMeta('og:type', 'profile');
    setOgMeta('twitter:card', 'summary_large_image');
    setOgMeta('twitter:title', title);
    setOgMeta('twitter:description', desc);
    setOgMeta('twitter:image', photoUrl);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    return () => {
      document.title = prev.title || 'Telugu Icon Awards 2026';
      if (prev.desc) setMeta('description', prev.desc);
      if (prev.ogTitle) setOgMeta('og:title', prev.ogTitle);
      if (prev.ogDesc) setOgMeta('og:description', prev.ogDesc);
      if (prev.ogImage) setOgMeta('og:image', prev.ogImage);
      if (prev.ogUrl) setOgMeta('og:url', prev.ogUrl);
    };
  }, [nominee]);
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function setOgMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

export default function NomineeProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoVote = searchParams.get('vote') === 'true';

  const [nominee, setNominee] = useState(null);
  const [error, setError] = useState(null);
  const [voted, setVoted] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [qrDownloading, setQrDownloading] = useState(false);
  const voteRef = useRef(null);

  useNomineeMetaTags(nominee);

  useEffect(() => {
    api.get(`/nominees/${id}`).then((data) => {
      if (data && data.id) setNominee(data);
      else setError('Nominee not found');
    }).catch(() => setError('Nominee not found'));
  }, [id]);

  // Auto-scroll to vote section if ?vote=true
  useEffect(() => {
    if (autoVote && nominee && voteRef.current) {
      setTimeout(() => {
        voteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [autoVote, nominee]);

  const copyToClipboard = useCallback((text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const siteUrl = getSiteUrl();
  const nomineeUrl = nominee ? `${siteUrl}/nominee/${nominee.slug || nominee.id}` : '';
  const voteUrl = nominee ? `${siteUrl}/nominee/${nominee.slug || nominee.id}?vote=true` : '';
  const waText = nominee
    ? `🏆 Vote for *${nominee.full_name}* — Official Nominee at the *Telugu Icon Digital & Influencer Awards 2026* in *${nominee.category_name}*!\n\n👉 Vote here (30 sec OTP vote):\n${voteUrl}\n\nSupport your favourite Telugu creator! 🙏\n#TeluguIconAwards2026 #TIA2026`
    : '';

  const downloadQR = async () => {
    if (!nominee) return;
    setQrDownloading(true);
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(voteUrl)}&size=400x400&bgcolor=0a0a0a&color=D4AF37&margin=10&format=png`;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `TIA2026-QR-${nominee.slug || nominee.id}.png`;
      a.click();
    } catch {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(voteUrl)}&size=400x400&bgcolor=0a0a0a&color=D4AF37&margin=10`, '_blank');
    } finally {
      setQrDownloading(false);
    }
  };

  if (error && !nominee) {
    return (
      <PageTransition>
        <div className="min-h-[70vh] flex items-center justify-center bg-hero-gradient">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="font-display text-3xl font-bold gold-text mb-3">Nominee Not Found</h1>
            <p className="text-white/50 mb-6">This nominee page may have been removed or the URL is incorrect.</p>
            <a href="/nominees" className="btn-gold">Browse All Nominees</a>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!nominee) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-champagne-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading nominee...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      {/* ── HERO / ABOVE THE FOLD — mobile-first, VOTE NOW prominent ── */}
      <section className="relative min-h-[100svh] bg-hero-gradient overflow-hidden flex flex-col">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,120,30,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(120,10,30,0.10)_0%,transparent_60%)]" />

        {/* Event badge strip */}
        <div className="relative z-10 text-center pt-4 pb-2 px-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-champagne-500/10 border border-champagne-500/30 text-champagne-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            🏆 Telugu Icon Digital &amp; Influencer Awards 2026
          </span>
        </div>

        <div className="relative z-10 flex-1 max-w-lg mx-auto w-full px-4 pb-6 flex flex-col items-center justify-start pt-4 sm:pt-8">
          {/* Official Nominee badge */}
          <div className="mb-3 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/20 text-white/60 text-[10px] uppercase tracking-widest font-semibold">
              ⭐ Official Nominee &nbsp;·&nbsp; {nominee.nominee_code}
            </span>
          </div>

          {/* Photo */}
          <div className="relative mb-4">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-champagne-500/60 shadow-2xl shadow-champagne-500/20 bg-gradient-to-br from-ink-700 to-burgundy-900 flex items-center justify-center mx-auto">
              {nominee.photo_url ? (
                <img
                  src={getAssetUrl(nominee.photo_url)}
                  alt={nominee.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">🏆</span>
              )}
            </div>
            {/* Gold ring glow */}
            <div className="absolute inset-0 rounded-2xl ring-2 ring-champagne-400/20 blur-sm pointer-events-none" />
          </div>

          {/* Name + Category */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-1 leading-tight">
            {nominee.full_name}
          </h1>
          <p className="text-champagne-400 text-sm sm:text-base font-semibold text-center mb-1">
            Nominated for: <span className="text-white">{nominee.category_name}</span>
          </p>
          {nominee.social_handle && (
            <p className="text-white/40 text-xs text-center mb-4">📱 {nominee.social_handle}</p>
          )}

          {/* ── PRIMARY VOTE BUTTON — most prominent ── */}
          <div ref={voteRef} className="w-full mt-1 mb-2">
            {!voted ? (
              <div className="glass-card p-4 sm:p-6 border border-champagne-500/30">
                <p className="text-center text-xs text-white/50 mb-3 uppercase tracking-wider font-semibold">
                  Cast Your Official Vote
                </p>
                <OtpVote nominee={nominee} onVoted={() => setVoted(true)} />
              </div>
            ) : (
              <div className="glass-card p-5 text-center border border-emerald-500/30 bg-emerald-900/10">
                <div className="text-5xl mb-2">✅</div>
                <p className="font-display text-lg font-bold text-emerald-300 mb-1">Vote Recorded!</p>
                <p className="text-white/50 text-xs mb-4">
                  Thank you for supporting the Telugu creator community.
                </p>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                  target="_blank" rel="noreferrer"
                  className="btn-gold w-full mb-2"
                >
                  📲 Share on WhatsApp &amp; Rally More Votes
                </a>
                <button
                  onClick={() => copyToClipboard(voteUrl, 'done-copy')}
                  className="btn-outline w-full text-xs"
                >
                  {copiedKey === 'done-copy' ? '✓ Copied!' : '🔗 Copy Voting Link'}
                </button>
              </div>
            )}
          </div>

          {/* Scroll hint */}
          {!voted && (
            <p className="text-white/25 text-[10px] text-center mt-1">
              Scroll down for QR code, share kit &amp; more about {nominee.full_name}
            </p>
          )}
        </div>
      </section>

      {/* ── VOTE STATS ── */}
      <section className="bg-ink-900 py-6 px-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-lg sm:text-2xl font-display font-bold gold-text">
              {(nominee.vote_count || 0).toLocaleString()}
            </div>
            <div className="text-white/40 text-[10px] sm:text-xs mt-0.5">Votes</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg sm:text-2xl font-display font-bold gold-text">
              {nominee.followers_count ? (nominee.followers_count >= 1000000
                ? `${(nominee.followers_count / 1000000).toFixed(1)}M`
                : nominee.followers_count >= 1000
                  ? `${(nominee.followers_count / 1000).toFixed(0)}K`
                  : nominee.followers_count.toLocaleString()
              ) : '—'}
            </div>
            <div className="text-white/40 text-[10px] sm:text-xs mt-0.5">Followers</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg sm:text-2xl font-display font-bold gold-text">2026</div>
            <div className="text-white/40 text-[10px] sm:text-xs mt-0.5">Season</div>
          </div>
        </div>
      </section>

      {/* ── SHARE YOUR VOTE ── */}
      <section className="bg-ink-900 py-6 px-4">
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-5 border border-champagne-500/20">
            <h2 className="font-display text-lg font-bold text-white mb-1">📣 Share Your Vote</h2>
            <p className="text-white/40 text-xs mb-4">
              Help {nominee.full_name} win — share with friends and family!
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/25 transition-all"
              >
                <span className="text-base">💬</span> WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(voteUrl)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1877F2]/15 border border-[#1877F2]/40 text-[#1877F2] text-xs font-semibold hover:bg-[#1877F2]/25 transition-all"
              >
                <span className="text-base">📘</span> Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just voted for ${nominee.full_name} — Official Nominee at #TeluguIconAwards2026! Vote now:`)}&url=${encodeURIComponent(voteUrl)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white/70 text-xs font-semibold hover:bg-white/10 transition-all"
              >
                <span className="text-base">𝕏</span> X / Twitter
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(voteUrl)}&text=${encodeURIComponent(`Vote for ${nominee.full_name} — Telugu Icon Awards 2026! 🏆`)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2AABEE]/15 border border-[#2AABEE]/40 text-[#2AABEE] text-xs font-semibold hover:bg-[#2AABEE]/25 transition-all"
              >
                <span className="text-base">✈️</span> Telegram
              </a>
            </div>
            {/* Copy link bar */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-800 border border-white/10">
              <span className="text-white/30 text-[10px] truncate flex-1 font-mono">{voteUrl}</span>
              <button
                onClick={() => copyToClipboard(voteUrl, 'share-url')}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${copiedKey === 'share-url' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-champagne-500/10 text-champagne-400 border border-champagne-500/30 hover:bg-champagne-500/20'}`}
              >
                {copiedKey === 'share-url' ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── QR CODE / SCAN TO VOTE ── */}
      <section className="bg-ink-900 py-6 px-4">
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-5 flex flex-col sm:flex-row items-center gap-5 border border-champagne-500/20">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <QRCode value={voteUrl} size={140} />
              <span className="text-champagne-400/60 text-[10px] uppercase tracking-widest font-bold">
                Scan to Vote
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-display text-lg font-bold text-white mb-1">📲 QR Code</h2>
              <p className="text-white/40 text-xs mb-3 leading-relaxed">
                This unique QR code links directly to {nominee.full_name}'s voting page. Use it on posters, stories, reels, and prints.
              </p>
              <button
                onClick={downloadQR}
                disabled={qrDownloading}
                className="btn-gold text-xs !py-2 !px-4 w-full sm:w-auto disabled:opacity-50"
              >
                {qrDownloading ? 'Downloading...' : '⬇ Download QR Code'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOMINEE CAMPAIGN KIT ── */}
      <section className="bg-ink-900 py-6 px-4">
        <div className="max-w-lg mx-auto glass-card p-5 border border-white/10">
          <h2 className="font-display text-lg font-bold text-white mb-3">🎁 Nominee Campaign Kit</h2>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '🔗 My Nominee Page', value: nomineeUrl, key: 'kit-page' },
              { label: '🗳️ My Direct Voting Link', value: voteUrl, key: 'kit-vote' },
              { label: '#️⃣  Nominee Code', value: nominee.nominee_code, key: 'kit-code' },
            ].map(({ label, value, key }) => (
              <div key={key} className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-800 border border-white/8">
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 text-[9px] uppercase tracking-wider font-bold mb-0.5">{label}</p>
                  <p className="text-white/70 text-[11px] font-mono truncate">{value}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(value, key)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${copiedKey === key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  {copiedKey === key ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
            <a
              href={`/nominee-kit?nominee=${nominee.slug || nominee.id}`}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-champagne-500/10 border border-champagne-500/30 text-champagne-400 text-xs font-semibold hover:bg-champagne-500/15 transition-all mt-1"
            >
              🖼️ Download Official Nominee Poster
            </a>
          </div>
        </div>
      </section>

      {/* ── ABOUT THE NOMINEE ── */}
      {(nominee.bio || nominee.social_handle) && (
        <section className="bg-ink-900 py-6 px-4">
          <div className="max-w-lg mx-auto glass-card p-5 border border-white/10">
            <h2 className="font-display text-lg font-bold text-white mb-3">About {nominee.full_name}</h2>
            {nominee.bio && (
              <p className="text-white/60 text-sm leading-relaxed mb-4">{nominee.bio}</p>
            )}
            {nominee.social_handle && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-ink-800 border border-white/8">
                <span className="text-champagne-400 text-sm">📱</span>
                <span className="text-white/60 text-sm">{nominee.social_handle}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SPONSOR BRANDING PLACEHOLDER ── */}
      <section className="bg-ink-900 pb-4 px-4">
        <div className="max-w-lg mx-auto">
          <div className="py-3 px-4 rounded-xl bg-white/[0.02] border border-white/8 flex items-center justify-center gap-2">
            <span className="text-white/20 text-[10px] uppercase tracking-widest font-bold">
              Voting Powered by
            </span>
            <span className="text-white/20 text-[10px] font-bold">Pracharam Media</span>
          </div>
        </div>
      </section>

      {/* ── MORE NOMINEES ── */}
      <section className="bg-ink-900 py-6 px-4 border-t border-white/5">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-white/30 text-xs mb-3">Explore more official nominees</p>
          <a href="/nominees" className="btn-outline text-xs">
            View All Nominees →
          </a>
        </div>
      </section>
    </PageTransition>
  );
}