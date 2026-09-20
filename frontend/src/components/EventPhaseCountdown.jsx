import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../api';

const EVENT_PHASES = {
  phase_1: {
    badge: 'Phase 1: Nominations Open',
    title: 'Nominations Now Live',
    targetDate: new Date('2026-06-30T23:59:59'),
    subtitle: 'Submit your entry across 40 creator categories before June 30, 2026.',
    primaryBtn: { label: 'Nominate Now', link: '/nominate' },
    secondaryBtn: { label: 'Explore Categories', link: '/awards' },
  },
  phase_2: {
    badge: 'Phase 2: Public Voting Live',
    title: 'OTP Verified Voting is Open',
    targetDate: new Date('2026-08-15T23:59:59'),
    subtitle: 'Cast your 100% verified vote for your favorite Telugu creators before August 15, 2026.',
    primaryBtn: { label: 'Vote Now', link: '/vote' },
    secondaryBtn: { label: 'Book Tickets', link: '/tickets' },
  },
  phase_3: {
    badge: 'Phase 3: Jury & Audit Review',
    title: 'Voting Closed • Jury Scrutiny in Progress',
    targetDate: new Date('2026-08-30T10:00:00'),
    subtitle: 'Independent auditor and grand jury reviewing final tallies before the grand gala.',
    primaryBtn: { label: 'Book Tickets', link: '/tickets' },
    secondaryBtn: { label: 'View Finalists', link: '/nominees' },
  },
  phase_4: {
    badge: 'Phase 4: Event Day',
    title: 'Gala Day • August 30, 2026',
    targetDate: new Date('2026-08-30T19:00:00'),
    subtitle: 'Hitex Exhibition Center, Hyderabad. Session 1: 10 AM–2 PM | Session 2: 3 PM–7 PM.',
    primaryBtn: { label: 'Gate QR Ticket', link: '/tickets' },
    secondaryBtn: { label: 'Watch Live Stream', link: '/videos' },
  },
  phase_5: {
    badge: 'Phase 5: Post-Event Celebration',
    title: 'Telugu Icon Awards 2026 Concluded',
    targetDate: null,
    subtitle: 'Congratulations to all 2026 winners! Relive the highlights, speeches, and gallery.',
    primaryBtn: { label: 'View 2026 Awardees', link: '/awardees' },
    secondaryBtn: { label: 'Photo & Video Archive', link: '/gallery' },
  },
};

export default function EventPhaseCountdown({ overridePhase }) {
  const [phaseKey, setPhaseKey] = useState(overridePhase || 'phase_2');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!overridePhase) {
      api.get('/settings').then((data) => {
        if (Array.isArray(data)) {
          const setting = data.find((s) => s.setting_key === 'event_phase');
          if (setting && EVENT_PHASES[setting.setting_value]) {
            setPhaseKey(setting.setting_value);
          }
        }
      }).catch(() => {});
    }
  }, [overridePhase]);

  const currentPhase = EVENT_PHASES[phaseKey] || EVENT_PHASES.phase_2;

  useEffect(() => {
    if (!currentPhase.targetDate) return;

    const calcTime = () => {
      const now = new Date();
      const diff = currentPhase.targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [currentPhase]);

  return (
    <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-ink-800 via-ink-850 to-burgundy-950/60 border border-champagne-500/30 shadow-gold text-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-champagne-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-burgundy-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Phase Badge */}
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-champagne-500/15 border border-champagne-500/30 text-champagne-400 text-xs font-bold uppercase tracking-widest mb-4">
          <span className="w-2 h-2 rounded-full bg-champagne-400 animate-pulse" />
          {currentPhase.badge}
        </span>

        <h2 className="font-display text-2xl md:text-4xl font-bold text-white mb-3">
          {currentPhase.title}
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto mb-8">
          {currentPhase.subtitle}
        </p>

        {/* Countdown Digits */}
        {currentPhase.targetDate && (
          <div className="grid grid-cols-4 gap-3 md:gap-6 max-w-md mx-auto mb-8">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((unit, idx) => (
              <div
                key={idx}
                className="p-3 md:p-4 rounded-2xl bg-ink-900/90 border border-white/10 shadow-lg"
              >
                <div className="font-display text-2xl md:text-4xl font-bold text-champagne-400">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-[10px] md:text-xs text-white/40 uppercase tracking-wider mt-1">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to={currentPhase.primaryBtn.link}
            className="px-6 py-3 rounded-full bg-champagne-500 text-ink-900 font-bold text-sm hover:bg-champagne-400 transition-all shadow-gold"
          >
            {currentPhase.primaryBtn.label}
          </Link>
          <Link
            to={currentPhase.secondaryBtn.link}
            className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm border border-white/10 transition-all"
          >
            {currentPhase.secondaryBtn.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
