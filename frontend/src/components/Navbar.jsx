import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Categories', path: '/awards' },
  { label: 'Nominate', path: '/nominate' },
  { label: 'Vote', path: '/vote' },
  { label: 'Tickets', path: '/tickets', badge: 'Live' },
  { label: 'Nominees', path: '/nominees' },
  { label: 'Past Events', path: '/past-events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Media', path: '/media' },
  { label: 'Partners', path: '/sponsors' },
  { label: 'FAQ', path: '/faq' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-ink-900/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-400 to-burgundy-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TIA</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-champagne-400 font-bold text-base lg:text-lg leading-tight block">
                  TELUGU ICON
                </span>
                <span className="block text-white/40 text-[9px] lg:text-[10px] tracking-[0.2em] uppercase">
                  Digital & Influencer Awards 2026
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden xl:flex items-center space-x-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-300 relative ${
                    isActive(link.path)
                      ? 'text-champagne-400 bg-champagne-500/10 font-bold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-champagne-500 text-ink-950 uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center space-x-2 shrink-0">
              <Link
                to="/tickets"
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-champagne-400 to-amber-500 text-ink-950 font-bold text-xs hover:opacity-95 shadow-gold transition-all"
              >
                Book Tickets
              </Link>
              <Link
                to="/nominate"
                className="hidden md:inline-flex btn-outline !py-1.5 !px-3 text-xs"
              >
                Nominate
              </Link>

              {/* Hamburger Mobile Toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="xl:hidden p-2 text-white/60 hover:text-white rounded-lg bg-white/5 border border-white/10"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-down Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 xl:hidden overflow-y-auto bg-ink-950/98 backdrop-blur-2xl pt-20 px-6 pb-10"
          >
            <div className="flex flex-col space-y-2 max-w-sm mx-auto">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Link
                  to="/tickets"
                  onClick={() => setIsOpen(false)}
                  className="py-3 text-center font-bold text-xs rounded-xl bg-champagne-500 text-ink-900 shadow-gold"
                >
                  🎟️ Book Tickets
                </Link>
                <Link
                  to="/nominate"
                  onClick={() => setIsOpen(false)}
                  className="py-3 text-center font-bold text-xs rounded-xl bg-white/10 text-white border border-white/10"
                >
                  ⭐ Nominate
                </Link>
              </div>

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`w-full px-4 py-2.5 text-base font-medium rounded-xl transition-all flex items-center justify-between ${
                    isActive(link.path)
                      ? 'text-champagne-400 bg-champagne-500/10 font-bold border border-champagne-500/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-champagne-500 text-ink-950 uppercase">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="pt-6 mt-4 border-t border-white/10 text-center text-xs text-white/40">
                <span>August 30, 2026 • Hitex, Hyderabad</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16 lg:h-20" />
    </>
  );
}