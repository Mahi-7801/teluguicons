import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-400 to-burgundy-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">TIA</span>
              </div>
              <span className="font-display text-champagne-400 font-bold text-lg">TELUGU ICON</span>
              <span className="block text-white/40 text-xs">Digital & Influencer Awards 2026</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              Celebrating the Voices. Inspiring the Community. Shaping the Digital Future.
            </p>
            <p className="text-white/30 text-sm mt-2">16 November 2026 | Shilpakala Vedika, Hyderabad</p>
            <p className="text-white/30 text-sm mt-4">Powered by Pracharam Media</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Nominate', to: '/nominate' },
                { label: 'Vote Now', to: '/vote' },
                { label: 'View Awards', to: '/awards' },
                { label: 'Sponsors', to: '/sponsors' },
                { label: 'About Us', to: '/about' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-white/50 hover:text-champagne-400 text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li>Shilpakala Vedika, Hyderabad</li>
              <li>info@teluguiconawards.in</li>
              <li>nominations@teluguiconawards.in</li>
              <li className="pt-2">
                <Link to="/contact" className="text-champagne-400 hover:text-champagne-300">
                  Get in touch →
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Telugu Icon Digital & Influencer Awards. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-xs text-white/30">
            <Link to="/admin/login" className="hover:text-champagne-400 transition-colors">Admin Login</Link>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}