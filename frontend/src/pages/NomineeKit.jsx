import { useState, useRef, useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import { api, getAssetUrl } from '../api';

export default function NomineeKit() {
  const [nominees, setNominees] = useState([]);
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    api.get('/nominees?featured=1').then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setNominees(data);
        setSelectedNominee(data[0]);
      }
    }).catch(() => {});
  }, []);

  const handleSearch = (q) => {
    setSearch(q);
    if (!q) return;
    api.get(`/nominees?status=approved`).then((data) => {
      if (Array.isArray(data)) {
        const found = data.find((n) => n.full_name.toLowerCase().includes(q.toLowerCase()));
        if (found) setSelectedNominee(found);
      }
    }).catch(() => {});
  };

  // Render poster on canvas
  useEffect(() => {
    if (!selectedNominee || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 1080;
    canvas.height = 1350; // 4:5 Instagram Portrait ratio

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1350);
    bgGrad.addColorStop(0, '#0a0a0a');
    bgGrad.addColorStop(0.5, '#160d1b');
    bgGrad.addColorStop(1, '#080808');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Gold Outer Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1000, 1270);

    // Inner thin border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 970, 1240);

    // Top Header
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 32px "Cinzel", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TELUGU ICON DIGITAL & INFLUENCER AWARDS 2026', 540, 130);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('OFFICIAL NOMINEE', 540, 170);

    // Nominee Photo Frame
    const photoX = 290;
    const photoY = 220;
    const photoSize = 500;

    // Draw circular or rounded container background
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, 470, 240, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#222';
    ctx.fillRect(photoX, photoY, photoSize, photoSize);

    // Draw placeholder or image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getAssetUrl(selectedNominee.photo_url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    img.onload = () => {
      ctx.drawImage(img, 300, 230, 480, 480);
      finishPoster();
    };
    img.onerror = () => {
      finishPoster();
    };

    function finishPoster() {
      ctx.restore();

      // Gold ring around photo
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(540, 470, 242, 0, Math.PI * 2);
      ctx.stroke();

      // Nominee Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 56px "Cinzel", serif, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(selectedNominee.full_name || 'Creator Name', 540, 780);

      // Handle
      ctx.fillStyle = '#D4AF37';
      ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(selectedNominee.social_handle || '@creator', 540, 830);

      // Category Box
      ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(140, 870, 800, 90, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`NOMINATED IN: ${selectedNominee.category_name?.toUpperCase() || 'BEST CREATOR'}`, 540, 925);

      // Nominee Code
      ctx.fillStyle = '#D4AF37';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Nominee Code: ${selectedNominee.nominee_code || 'TIA2026-001'}`, 540, 1010);

      // Call to action
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Cinzel", serif, sans-serif';
      ctx.fillText('VOTE NOW AT', 540, 1080);

      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('teluguiconawards.com/vote', 540, 1140);

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Sunday, August 30, 2026 • Hitex Exhibition Center, Hyderabad', 540, 1220);
      ctx.fillText('100% Verified OTP Public Voting • Powered by Telugu Icon Ecosystem', 540, 1255);
    }
  }, [selectedNominee]);

  const downloadPoster = () => {
    if (!canvasRef.current || !selectedNominee) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `Telugu-Icon-Nominee-${selectedNominee.slug || 'poster'}.png`;
    a.click();
  };

  const shareTextWhatsApp = selectedNominee
    ? `🏆 Hey friends and family! I'm thrilled to share that I have been nominated for *${selectedNominee.category_name || 'Creator of the Year'}* at the prestigious *Telugu Icon Digital & Influencer Awards 2026*!\n\nYour support has made this journey possible. Please take 30 seconds to cast your OTP-verified vote for me:\n\n👉 Vote here: https://teluguiconawards.com/nominee/${selectedNominee.slug || selectedNominee.id}\n\nThank you for believing in me! 🙏✨ #TeluguIconAwards #TIA2026`
    : '';

  const shareTextInstagram = selectedNominee
    ? `Humbled and honored to announce my nomination for ${selectedNominee.category_name || 'an award'} at the @teluguiconawards 2026! 🏆✨\n\nVoting is 100% public and OTP-verified! Link in bio to cast your vote.\n\nCode: ${selectedNominee.nominee_code || 'TIA2026'}\nEvent Date: August 30, 2026 • Hitex, Hyderabad\n\n#TeluguIconAwards #TIA2026 #TeluguCreators #TeluguInfluencers #VoteForMe`
    : '';

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <PageTransition>
      <section className="relative py-20 bg-hero-gradient overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#0a0a0a_100%)]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="section-subtitle">Creator Campaign Suite</span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            Official Nominee <span className="gold-text">Campaign Kit</span>
          </h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
            Generate your high-resolution official nominee poster, download vote campaign creatives, and copy ready-to-use social copy templates.
          </p>
        </div>
      </section>

      <section className="py-14 bg-ink-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          {/* Nominee Selector */}
          <div className="mb-10 max-w-xl mx-auto">
            <label className="block text-xs font-bold text-champagne-400 uppercase tracking-wider mb-2 text-center">
              Select or Search Nominee Profile
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Type creator name..."
                className="flex-1 px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 text-sm focus:border-champagne-500 focus:outline-none"
              />
              {nominees.length > 0 && (
                <select
                  value={selectedNominee?.id || ''}
                  onChange={(e) => {
                    const nom = nominees.find((n) => String(n.id) === e.target.value);
                    if (nom) setSelectedNominee(nom);
                  }}
                  className="px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-white text-sm focus:border-champagne-500 focus:outline-none max-w-[200px]"
                >
                  {nominees.map((n) => (
                    <option key={n.id} value={n.id}>{n.full_name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {selectedNominee && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Poster Canvas Preview */}
              <div className="card-gold p-6 text-center">
                <h3 className="text-lg font-bold font-display text-white mb-4">
                  Official 4:5 Portrait Nominee Poster
                </h3>
                <div className="relative mx-auto max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-champagne-500/40">
                  <canvas ref={canvasRef} className="w-full h-auto block" />
                </div>
                <button
                  onClick={downloadPoster}
                  className="mt-6 w-full max-w-[420px] py-3.5 rounded-xl bg-champagne-500 text-ink-900 font-bold text-sm hover:bg-champagne-400 transition-all shadow-gold"
                >
                  Download High-Res Poster (PNG) ↓
                </button>
              </div>

              {/* Ready-to-use Social Copy */}
              <div className="space-y-6">
                <div className="card-gold p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💬</span>
                      <h4 className="font-bold text-white text-base">WhatsApp Broadcast Message</h4>
                    </div>
                    <button
                      onClick={() => copyToClipboard(shareTextWhatsApp, 'wa')}
                      className="px-3 py-1 rounded-lg bg-champagne-500/10 text-champagne-400 text-xs font-semibold hover:bg-champagne-500/20 border border-champagne-500/30 transition-all"
                    >
                      {copiedKey === 'wa' ? '✓ Copied!' : 'Copy Text'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-ink-900 text-white/70 text-xs whitespace-pre-wrap font-sans leading-relaxed border border-white/5">
                    {shareTextWhatsApp}
                  </pre>
                </div>

                <div className="card-gold p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📸</span>
                      <h4 className="font-bold text-white text-base">Instagram Post & Story Caption</h4>
                    </div>
                    <button
                      onClick={() => copyToClipboard(shareTextInstagram, 'ig')}
                      className="px-3 py-1 rounded-lg bg-champagne-500/10 text-champagne-400 text-xs font-semibold hover:bg-champagne-500/20 border border-champagne-500/30 transition-all"
                    >
                      {copiedKey === 'ig' ? '✓ Copied!' : 'Copy Text'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-ink-900 text-white/70 text-xs whitespace-pre-wrap font-sans leading-relaxed border border-white/5">
                    {shareTextInstagram}
                  </pre>
                </div>

                <div className="p-5 rounded-2xl bg-ink-800/40 border border-white/5 text-xs text-white/50 leading-relaxed">
                  <strong className="text-champagne-400 block mb-1">Creator Guidelines:</strong>
                  You are permitted to share these official badges across all channels. However, purchasing bot votes or offering monetary incentives in exchange for OTP votes is strictly monitored by our anti-fraud auditor and will lead to disqualification.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}
