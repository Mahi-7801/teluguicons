import { useState, useEffect } from 'react';
import { api } from '../api';

function getDeviceFingerprint() {
  try {
    let fp = localStorage.getItem('tia_device_id');
    if (!fp) {
      fp = (crypto.randomUUID ? crypto.randomUUID() : `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, '').slice(0, 40);
      localStorage.setItem('tia_device_id', fp);
    }
    return fp.slice(0, 64);
  } catch (e) {
    return null;
  }
}

export default function OtpVote({ nominee, onVoted, compact }) {
  const [mode, setMode] = useState('otp'); // 'otp' | 'device'
  const [step, setStep] = useState('details');
  const [voter, setVoter] = useState({ name: '', email: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [onsiteCode, setOnsiteCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { phone } = voter;

  useEffect(() => {
    api.get('/otp/mode').then((data) => {
      if (data && data.mode === 'device') setMode('device');
    }).catch(() => {});
  }, []);

  const sendOtp = async (resend) => {
    setError(null);
    setMessage(null);
    if (!resend && !/^[6-9]\d{9}$/.test(voter.phone.replace(/[^\d]/g, ''))) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/otp/send', { mobile: voter.phone });
      if (res.type === 'success') {
        setOnsiteCode(res.dev_otp || res.otp || '');
        setMessage(res.dev_otp
          ? `OTP sent! Enter the code shown below.`
          : 'OTP sent to your mobile. Enter the code below.');
        setStep('otp');
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{4,9}$/.test(otp.trim())) { setError('Enter the OTP you received.'); return; }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/otp/verify', { mobile: voter.phone, otp: otp.trim() });
      if (res.type === 'success') {
        setVerificationToken(res.verification_token);
        setOnsiteCode('');
        setMessage('Mobile verified. You can now cast your vote.');
        setStep('ready');
      } else {
        setError(res.message || 'Verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const castVote = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/votes', {
        nominee_id: nominee.id,
        voter_name: voter.name,
        voter_email: voter.email,
        voter_phone: voter.phone,
        verification_token: mode === 'otp' ? verificationToken : undefined,
        device_fingerprint: getDeviceFingerprint(),
      });
      if (res.httpStatus && res.httpStatus >= 200 && res.httpStatus < 300) {
        setMessage(res.message);
        setStep('done');
        if (onVoted) onVoted(res);
      } else {
        setError(res.message || 'Failed to record vote');
        setStep('details');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareText = 'I just voted for my favourite creator at the Telugu Icon Digital & Influencer Awards 2026. Support your favourite Telugu Digital Icon!';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div>
      {message && !(step === 'done') && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-500/40 text-emerald-200 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-burgundy-900/50 border border-burgundy-500/40 text-white/80 text-sm">
          {error}
        </div>
      )}

      {step === 'done' ? (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-display text-2xl font-bold gold-text mb-2">Your Vote Has Been Recorded</h3>
            <p className="text-white/60 text-sm">
              Thank you for supporting the Telugu digital creator community.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-800 p-4">
            <p className="text-sm text-white/40 mb-3">Support your icon — share this page:</p>
            <div className="grid grid-cols-2 gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className="btn-outline text-xs">WhatsApp</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="btn-outline text-xs">Facebook</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="btn-outline text-xs">X</a>
              <button
                onClick={() => navigator.clipboard?.writeText(shareUrl) && setMessage('Link copied!')}
                className="btn-outline text-xs"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === 'details' && mode === 'device') castVote();
            else if (step === 'details') sendOtp(false);
            else verifyOtp(e);
          }}
          className="space-y-3"
        >
          {step === 'details' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={voter.name}
                  onChange={(e) => setVoter({ ...voter, name: e.target.value })}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={voter.email}
                  onChange={(e) => setVoter({ ...voter, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <input
                type="tel"
                placeholder={mode === 'device' ? 'Your 10-digit mobile number (optional)' : 'Your 10-digit mobile number *'}
                maxLength={10}
                value={voter.phone}
                onChange={(e) => setVoter({ ...voter, phone: e.target.value.replace(/[^\d]/g, '') })}
                className="input-field"
              />
              {mode === 'device' ? (
                <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? 'Casting vote...' : `Vote for ${nominee.full_name}`}
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? 'Sending...' : 'Send OTP to Verify'}
                </button>
              )}
              <p className="text-white/30 text-xs text-center">
                {mode === 'device'
                  ? 'One vote per device & category. Repeat votes from the same device or number are blocked automatically.'
                  : 'OTP verification. One verified mobile = one vote per category. Fraudulent voting is monitored.'}
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              {onsiteCode && (
                <div className="rounded-xl border border-champagne-500/40 bg-champagne-500/10 px-4 py-4 text-center">
                  <p className="text-white/50 text-xs mb-1">Your OTP (shown here — no SMS needed):</p>
                  <p className="font-display text-3xl font-bold tracking-[0.4em] gold-text select-all">{onsiteCode}</p>
                  <p className="text-white/30 text-[11px] mt-2">Enter this code below to verify your number.</p>
                </div>
              )}
              <p className="text-sm text-white/60">
                Enter the 6-digit OTP sent to <span className="text-champagne-400 font-semibold">{voter.phone}</span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                className="input-field text-center text-2xl tracking-[0.5em]"
              />
              <div className="flex gap-3">
                <button type="submit" disabled={loading || otp.length < 4} className="btn-gold flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
                <button type="button" onClick={() => sendOtp(true)} className="btn-outline disabled:opacity-40" disabled={loading}>
                  Resend
                </button>
              </div>
            </>
          )}

          {step === 'ready' && (
            <>
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
                ✅ Mobile verified. Ready to vote.
              </div>
              <button type="button" onClick={castVote} disabled={loading} className="btn-gold w-full disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? 'Casting vote...' : `Vote for ${nominee.full_name}`}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}