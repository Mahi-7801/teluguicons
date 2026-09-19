import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Categories', path: '/awards' },
  { label: 'Nominate', path: '/nominate' },
  { label: 'Vote', path: '/vote' },
  { label: 'Nominees', path: '/nominees' },
  { label: 'Partners', path: '/sponsors' },
  { label: 'Contact', path: '/contact' },
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
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-400 to-burgundy-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TIA</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-champagne-400 font-bold text-lg leading-tight">TELUGU ICON</span>
                <span className="block text-white/40 text-[10px] tracking-[0.2em] uppercase">Digital & Influencer Awards 2026</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center space-x-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'text-champagne-400 bg-champagne-500/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/nominate" className="hidden lg:inline-flex btn-gold !py-2 !px-4 text-sm">
                Nominate Yourself
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden p-3 text-white/60 hover:text-white"
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

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden overflow-y-auto bg-ink-900/98 backdrop-blur-xl"
          >
            <div className="pt-16 px-4 pb-8">
              <div className="flex flex-col space-y-1 max-w-xs mx-auto">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`w-full text-center px-6 py-3 text-lg font-medium rounded-xl transition-all duration-300 ${
                      isActive(link.path)
                        ? 'text-champagne-400 bg-champagne-500/10'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-16 lg:h-20" />
    </>
  );
}