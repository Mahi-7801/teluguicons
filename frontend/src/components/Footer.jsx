import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-950/90 text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Col (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-400 to-burgundy-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TIA</span>
              </div>
              <div>
                <span className="font-display text-champagne-400 font-bold text-lg leading-tight block">
                  TELUGU ICON
                </span>
                <span className="block text-white/40 text-[10px] tracking-[0.2em] uppercase">
                  Digital & Influencer Awards 2026
                </span>
              </div>
            </Link>

            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              South India’s premier creator recognition gala honoring 40 dynamic digital creator categories through 100% verified, transparent audience voting and grand jury scrutiny.
            </p>

            <div className="p-3.5 rounded-2xl bg-ink-900 border border-white/5 text-xs text-white/60 space-y-1">
              <div className="text-champagne-400 font-bold">📅 Sunday, August 30, 2026</div>
              <div>📍 Hitex Exhibition Center, Hitec City, Hyderabad</div>
              <div className="text-[11px] text-white/40">
                Session 1: 10:00 AM – 2:00 PM (Lunch) • Session 2: 3:00 PM – 7:00 PM (Dinner)
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'Award Categories (40)', to: '/awards' },
                { label: 'Submit Nomination', to: '/nominate' },
                { label: 'OTP Public Voting', to: '/vote' },
                { label: 'Book Tickets', to: '/tickets' },
                { label: 'Nominees Directory', to: '/nominees' },
                { label: 'Nominee Campaign Kit', to: '/nominee-kit' },
                { label: 'Past Events Archive', to: '/past-events' },
                { label: 'Hall of Fame Awardees', to: '/awardees' },
                { label: 'Photo & Video Gallery', to: '/gallery' },
                { label: 'Video Hub & Journey', to: '/videos' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-white/60 hover:text-champagne-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Media & Partners */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
              Partners & Media
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'Sponsorship Packages', to: '/sponsors' },
                { label: 'Become a Partner', to: '/sponsors#partner-form' },
                { label: 'Media & Press Center', to: '/media' },
                { label: 'Download Press Kit', to: '/media#press-kit' },
                { label: 'Frequently Asked Questions', to: '/faq' },
                { label: 'About the Movement', to: '/about' },
                { label: 'Contact Organizing Desk', to: '/contact' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-white/60 hover:text-champagne-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Governance */}
          <div>
            <h4 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-4">
              Governance & Policies
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { label: 'Terms & Conditions', to: '/legal/terms' },
                { label: 'Privacy Policy', to: '/legal/privacy' },
                { label: 'Voting & Anti-Fraud Rules', to: '/legal/voting-rules' },
                { label: 'Nomination Rules', to: '/legal/nomination-rules' },
                { label: 'Ticketing Terms', to: '/legal/ticketing-terms' },
                { label: 'Cancellation & Refunds', to: '/legal/refund-policy' },
                { label: 'Sponsorship Terms', to: '/legal/sponsorship-terms' },
                { label: 'Content Usage Rights', to: '/legal/content-usage' },
                { label: 'Intellectual Property', to: '/legal/ip-policy' },
                { label: 'Cookie Policy', to: '/legal/cookies' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-white/60 hover:text-champagne-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            © {new Date().getFullYear()} Telugu Icon Digital & Influencer Awards. All rights reserved. Registered trademark.
          </p>

          <div className="flex items-center space-x-6">
            <Link to="/contact" className="hover:text-white transition-colors">Contact PR</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link to="/admin/login" className="text-champagne-400/80 hover:text-champagne-300 transition-colors font-semibold">
              Admin Console 🔒
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}