import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { api, getAssetUrl } from '../../api';
import ImageUploader from '../../components/ImageUploader';

const TABS = [
  { key: '', label: 'Dashboard', icon: '📊' },
  { key: 'nominations', label: 'Nominations', icon: '📝' },
  { key: 'nominees', label: 'Nominees', icon: '⭐' },
  { key: 'categories', label: 'Categories', icon: '🏷️' },
  { key: 'votes', label: 'Votes & Audit', icon: '🗳️' },
  { key: 'tickets', label: 'Tickets & Entry', icon: '🎟️' },
  { key: 'past-events', label: 'Past Events & Awardees', icon: '🏛️' },
  { key: 'media', label: 'Media & Gallery', icon: '📸' },
  { key: 'sponsor-leads', label: 'Partner Enquiries', icon: '💼' },
  { key: 'phase', label: 'Event Phase', icon: '⏳' },
  { key: 'audit', label: 'Audit Logs', icon: '🛡️' },
  { key: 'sponsors', label: 'Sponsors', icon: '🤝' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    api.get('/auth/me').then((data) => {
      if (data.user) {
        setUser(data.user);
        setChecking(false);
      } else {
        localStorage.removeItem('admin_token');
        navigate('/admin/login');
      }
    }).catch(() => {
      localStorage.removeItem('admin_token');
      navigate('/admin/login');
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="text-center text-white/40">
          <div className="w-12 h-12 border-4 border-champagne-500/30 border-t-champagne-500 rounded-full animate-spin mx-auto mb-4" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const currentTab = TABS.find((t) => location.pathname === `/admin/${t.key}` || (t.key === '' && location.pathname === '/admin')) || TABS[0];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-ink-800 border-r border-white/5 flex flex-col z-30 max-md:hidden">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-champagne-400 to-burgundy-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TIA</span>
            </div>
            <div>
              <div className="font-display text-champagne-400 font-bold text-sm leading-tight">TELUGU ICON</div>
              <div className="text-white/40 text-[10px] tracking-wider uppercase">Admin Panel</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              to={`/admin/${tab.key}`}
              className={`flex items-center px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                currentTab.key === tab.key
                  ? 'bg-champagne-500/15 text-champagne-400 border border-champagne-500/30 font-bold'
                  : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <span className="mr-3 text-base">{tab.icon}</span> {tab.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <div className="text-white text-xs font-medium truncate">{user?.name}</div>
              <div className="text-white/30 text-[10px] truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-burgundy-400 transition-colors shrink-0" title="Logout">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (100% Responsive Navigation) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-ink-850 border-r border-white/10 flex flex-col h-full z-10 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-champagne-400 to-burgundy-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TIA</span>
                </div>
                <div>
                  <div className="font-display text-champagne-400 font-bold text-xs">TELUGU ICON</div>
                  <div className="text-white/40 text-[9px] uppercase tracking-wider">Admin Console</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {TABS.map((tab) => (
                <Link
                  key={tab.key}
                  to={`/admin/${tab.key}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    currentTab.key === tab.key
                      ? 'bg-champagne-500/20 text-champagne-400 border border-champagne-500/30 font-bold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-base">{tab.icon}</span> {tab.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-ink-900">
              <div className="truncate pr-2">
                <div className="text-white text-xs font-medium truncate">{user?.name}</div>
                <div className="text-white/40 text-[10px] truncate">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-burgundy-900/40 border border-burgundy-500/30 text-burgundy-300 text-xs font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <main className="flex-1 max-md:ml-0 ml-64 min-w-0">
        <header className="sticky top-0 z-20 bg-ink-900/95 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="font-display text-base md:text-xl font-bold text-white flex items-center">
              <span>{currentTab.icon}</span>
              <span className="gold-text ml-2 truncate">{currentTab.label}</span>
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <a href="/" target="_blank" rel="noopener noreferrer" className="btn-outline !px-3 !py-1.5 text-xs">
              View Site ↗
            </a>
            <button
              onClick={handleLogout}
              className="md:hidden text-white/50 hover:text-burgundy-400 p-2"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <Routes>
            <Route path="" element={<OverviewTab />} />
            <Route path="nominations" element={<NominationsTab />} />
            <Route path="nominees" element={<NomineesTab />} />
            <Route path="categories" element={<CategoriesTab />} />
            <Route path="votes" element={<VotesTab />} />
            <Route path="tickets" element={<TicketsTab />} />
            <Route path="past-events" element={<PastEventsTab />} />
            <Route path="media" element={<MediaTab />} />
            <Route path="sponsor-leads" element={<SponsorLeadsTab />} />
            <Route path="phase" element={<PhaseTab />} />
            <Route path="audit" element={<AuditTab />} />
            <Route path="sponsors" element={<SponsorsTab />} />
            <Route path="settings" element={<SettingsTab />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-3xl ${accent || ''}`}>{icon}</span>
      </div>
      <div className="text-3xl font-display font-bold gold-text mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-white/40 text-sm">{label}</div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then((data) => {
      if (data.stats) setStats(data.stats);
    }).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-champagne-500/30 border-t-champagne-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Nominations" value={stats.totalNominations} icon="📝" />
        <StatCard label="Pending Review" value={stats.pendingNominations} icon="⏳" />
        <StatCard label="Shortlisted" value={stats.approvedNominations} icon="✅" />
        <StatCard label="Verified" value={stats.verifiedNominations} icon="✓" />
        <StatCard label="Total Votes" value={stats.totalVotes} icon="🗳️" />
        <StatCard label="Flagged Votes" value={stats.flaggedVotes} icon="🚩" />
        <StatCard label="Total Nominees" value={stats.totalNominees} icon="⭐" />
        <StatCard label="Categories" value={stats.totalCategories} icon="🏷️" />
        <StatCard label="Sponsors" value={stats.totalSponsors} icon="🤝" />
      </div>
      {stats.pendingNominations > 0 && (
        <div className="glass-card p-6 border-burgundy-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-burgundy-400 rounded-full animate-pulse mr-3" />
              <span className="text-white/80">{stats.pendingNominations} nominations awaiting review</span>
            </div>
            <Link to="/admin/nominations" className="text-champagne-400 text-sm hover:text-champagne-300">Review now →</Link>
          </div>
        </div>
      )}
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">Vote Audit Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-white/40 text-xs uppercase">
                <th className="pb-3 pr-4">Nominee</th>
                <th className="pb-3 pr-4">Voter</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              <tr className="border-t border-white/5">
                <td className="py-3 pr-4">Loading recent votes...</td>
                <td />
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NominationsTab() {
  const [nominations, setNominations] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/admin/nominations${filter ? `?status=${filter}` : ''}`).then((data) => {
      if (Array.isArray(data)) setNominations(data);
    }).catch((e) => setMessage({ type: 'error', text: e.message })).finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const updateStatus = async (id, status) => {
    const res = await api.put(`/admin/nominations/${id}`, { status });
    setMessage({ type: 'success', text: res.message || 'Updated' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: '', label: 'All' },
          { key: 'pending', label: 'Pending ⏳' },
          { key: 'verified', label: 'Verified ✓' },
          { key: 'shortlisted', label: 'Shortlisted ✅' },
          { key: 'rejected', label: 'Rejected ❌' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              filter === f.key ? 'bg-champagne-500 text-ink-900' : 'bg-ink-800 text-white/60 border border-white/10 hover:border-champagne-500/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-emerald-900/30 border border-emerald-500/40 text-emerald-200' : 'bg-burgundy-900/50 border border-burgundy-500/40 text-white/80'
        }`}>
          {message.text}
        </div>
      )}

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/50">
              <tr className="text-white/40 text-xs uppercase">
                <th className="px-4 py-4 text-left">Creator</th>
                <th className="px-4 py-4 text-left">Category</th>
                <th className="px-4 py-4 text-left">Contact</th>
                <th className="px-4 py-4 text-left">ID</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-white/40">Loading...</td></tr>
              ) : nominations.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-white/40">No nominations found</td></tr>
              ) : (
                nominations.map((n) => (
                  <tr key={n.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ink-700 to-burgundy-900 flex items-center justify-center overflow-hidden shrink-0">
                          {n.photo_url ? <img src={n.photo_url} className="w-full h-full object-cover" alt="" /> : <span className="text-xs">🏆</span>}
                        </div>
                        <div>
                          <div className="font-medium text-white">{n.creator_name || n.full_name}</div>
                          <div className="text-white/30 text-xs">{n.city || '—'}{n.state ? `, ${n.state}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/60">{n.category_name || '—'}</td>
                    <td className="px-4 py-4 text-white/60 text-xs">
                      {n.email || '—'}<br />{n.phone || ''}
                    </td>
                    <td className="px-4 py-4 text-white/40 text-xs">{n.nomination_code || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        n.status === 'shortlisted' ? 'bg-emerald-500/15 text-emerald-400'
                          : n.status === 'verified' ? 'bg-white/10 text-white/70'
                            : n.status === 'rejected' ? 'bg-burgundy-900/50 text-burgundy-400'
                              : 'bg-champagne-500/15 text-champagne-400'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      {(n.status === 'pending' || n.status === 'rejected') && (
                        <>
                          <button onClick={() => updateStatus(n.id, 'verified')} className="text-champagne-400 hover:text-champagne-300 text-xs font-medium">Verify</button>
                          <button onClick={() => updateStatus(n.id, 'rejected')} className="text-burgundy-400 hover:text-burgundy-300 text-xs font-medium">Reject</button>
                        </>
                      )}
                      {n.status === 'verified' && (
                        <>
                          <button onClick={() => updateStatus(n.id, 'shortlisted')} className="text-emerald-400 hover:text-emerald-300 text-xs font-medium">Shortlist ✅</button>
                          <button onClick={() => updateStatus(n.id, 'rejected')} className="text-burgundy-400 hover:text-burgundy-300 text-xs font-medium">Reject</button>
                        </>
                      )}
                      {n.status === 'shortlisted' && (
                        <button onClick={() => updateStatus(n.id, 'verified')} className="text-white/40 hover:text-white text-xs font-medium">Undo</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NomineesTab() {
  const [nominees, setNominees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhotoNominee, setEditingPhotoNominee] = useState(null);
  const [newNominee, setNewNominee] = useState({
    full_name: '',
    category_id: '',
    social_handle: '',
    photo_url: '',
    bio: '',
    featured: false,
  });

  const load = () => {
    api.get('/admin/nominees').then(setNominees).catch(() => {});
    api.get('/categories').then((cats) => {
      if (Array.isArray(cats)) setCategories(cats);
    }).catch(() => {});
  };
  useEffect(load, []);

  const toggleFeatured = async (n) => {
    const res = await api.put(`/admin/nominees/${n.id}`, { featured: !n.featured });
    setMessage({ type: 'success', text: res.message || 'Updated' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleStatus = async (n) => {
    const nextStatus = n.status === 'approved' ? 'archived' : 'approved';
    const res = await api.put(`/admin/nominees/${n.id}`, { status: nextStatus });
    setMessage({ type: 'success', text: res.message || 'Updated' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateNominee = async (e) => {
    e.preventDefault();
    if (!newNominee.full_name || !newNominee.category_id) {
      setMessage({ type: 'error', text: 'Name and category are required' });
      return;
    }
    const res = await api.post('/admin/nominees', newNominee);
    setMessage({ type: 'success', text: res.message || 'Nominee created!' });
    setNewNominee({ full_name: '', category_id: '', social_handle: '', photo_url: '', bio: '', featured: false });
    setShowAddModal(false);
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdatePhoto = async (nomineeId, photoUrl) => {
    const res = await api.put(`/admin/nominees/${nomineeId}`, { photo_url: photoUrl });
    setMessage({ type: 'success', text: res.message || 'Photo updated!' });
    setEditingPhotoNominee(null);
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Nominees Directory</h2>
          <p className="text-white/40 text-xs mt-1">Manage active nominees, award categories, and profile photos.</p>
        </div>
        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="btn-gold !py-2 text-xs"
        >
          {showAddModal ? '✕ Cancel' : '+ Add Nominee'}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-900/40 border border-red-500/40 text-red-200' : 'bg-emerald-900/30 border border-emerald-500/40 text-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {/* Add Nominee Modal / Inline Form */}
      {showAddModal && (
        <div className="glass-card p-6 border-champagne-500/30">
          <h3 className="text-sm font-bold text-champagne-300 uppercase tracking-wider mb-4">Create New Nominee</h3>
          <form onSubmit={handleCreateNominee} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-white/70 mb-1 font-medium">Full Name *</label>
              <input
                type="text"
                placeholder="Creator / Influencer Name"
                value={newNominee.full_name}
                onChange={(e) => setNewNominee({ ...newNominee, full_name: e.target.value })}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-white/70 mb-1 font-medium">Category *</label>
              <select
                value={newNominee.category_id}
                onChange={(e) => setNewNominee({ ...newNominee, category_id: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/70 mb-1 font-medium">Social Handle / Channel</label>
              <input
                type="text"
                placeholder="@instagram_handle or YouTube channel"
                value={newNominee.social_handle}
                onChange={(e) => setNewNominee({ ...newNominee, social_handle: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-white/80">
                <input
                  type="checkbox"
                  checked={newNominee.featured}
                  onChange={(e) => setNewNominee({ ...newNominee, featured: e.target.checked })}
                  className="rounded text-champagne-500"
                />
                Mark as Featured Nominee
              </label>
            </div>
            <div className="md:col-span-2">
              <ImageUploader
                label="Nominee Profile Photo (Upload File)"
                value={newNominee.photo_url}
                onChange={(url) => setNewNominee({ ...newNominee, photo_url: url })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-gold !py-2 text-xs">
                Save Nominee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Edit Photo Modal */}
      {editingPhotoNominee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border border-champagne-500/40">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-sm">Upload Photo for {editingPhotoNominee.full_name}</h3>
              <button onClick={() => setEditingPhotoNominee(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <ImageUploader
              label="Choose New Photo"
              value={editingPhotoNominee.photo_url || ''}
              onChange={(url) => {
                if (url) handleUpdatePhoto(editingPhotoNominee.id, url);
              }}
            />
            <div className="text-right">
              <button onClick={() => setEditingPhotoNominee(null)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/50">
              <tr className="text-white/40 text-xs uppercase">
                <th className="px-4 py-4 text-left">Nominee</th>
                <th className="px-4 py-4 text-left">Category</th>
                <th className="px-4 py-4 text-left">Code</th>
                <th className="px-4 py-4 text-left">Votes</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-left">Featured</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nominees.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-white/40">No nominees yet. Click "+ Add Nominee" to create one.</td></tr>
              ) : (
                nominees.map((n) => (
                  <tr key={n.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          onClick={() => setEditingPhotoNominee(n)}
                          title="Click to change photo"
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-ink-700 to-burgundy-900 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-champagne-400 transition-all group relative"
                        >
                          {n.photo_url ? (
                            <img src={getAssetUrl(n.photo_url)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-xs">🏆</span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold">
                            📷
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-1.5">
                            <span>{n.full_name}</span>
                            <button
                              onClick={() => setEditingPhotoNominee(n)}
                              className="text-[10px] text-champagne-400/80 hover:text-champagne-300 underline font-normal"
                            >
                              (change photo)
                            </button>
                          </div>
                          <div className="text-white/30 text-xs">{n.social_handle || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/60 text-xs">{n.category_name || '—'}</td>
                    <td className="px-4 py-4 text-white/40 text-xs">{n.nominee_code || '—'}</td>
                    <td className="px-4 py-4 text-white font-medium">{n.vote_count?.toLocaleString()}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        n.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400'
                          : n.status === 'rejected' ? 'bg-burgundy-900/50 text-burgundy-400'
                            : 'bg-champagne-500/15 text-champagne-400'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleFeatured(n)} className={`text-xs font-medium ${n.featured ? 'text-champagne-400' : 'text-white/30 hover:text-white'}`}>
                        {n.featured ? '★ Featured' : '☆ Not Featured'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setEditingPhotoNominee(n)} className="text-xs text-champagne-400 hover:text-champagne-300 font-medium">Photo 📷</button>
                      <a href={`/nominee/${n.id}`} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white text-xs font-medium">View ↗</a>
                      <button onClick={() => toggleStatus(n)} className="text-white/40 hover:text-white text-xs font-medium">{n.status === 'approved' ? 'Archive' : 'Activate'}</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState(null);

  const load = () => {
    api.get('/categories').then(setCategories).catch(() => {});
  };
  useEffect(load, []);

  const toggleVoting = async (c) => {
    const res = await api.put(`/categories/${c.id}`, { voting_open: !c.voting_open });
    setMessage({ type: 'success', text: res.message || 'Updated' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-900/30 border border-emerald-500/40 text-emerald-200">{message.text}</div>
      )}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Category & Voting Control</h2>
            <p className="text-white/40 text-sm mt-1">Open or close voting for any category instantly.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className={`glass-card p-5 transition-all duration-300 ${c.voting_open ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{c.type === 'jury' ? '👑' : '🏆'}</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/10 text-white/50">{c.type === 'jury' ? 'Jury' : 'Self-Nomination'}</span>
            </div>
            <h3 className="font-semibold text-white mb-1">{c.name}</h3>
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs font-medium ${c.voting_open ? 'text-emerald-400' : 'text-white/40'}`}>
                {c.voting_open ? '● Voting Open' : '○ Voting Closed'}
              </span>
              <button
                onClick={() => toggleVoting(c)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${c.voting_open ? 'bg-emerald-500' : 'bg-ink-700 border border-white/20'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${c.voting_open ? 'left-[22px] bg-white' : 'left-0.5 bg-white/60'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VotesTab() {
  const [votes, setVotes] = useState([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const load = () => {
    api.get(`/admin/votes${flaggedOnly ? '?flagged=1' : ''}`).then((data) => {
      if (Array.isArray(data)) setVotes(data);
    }).catch(() => {});
  };
  useEffect(load, [flaggedOnly]);

  const toggleFlag = async (v) => {
    await api.put(`/admin/votes/${v.id}/flag`, { is_flagged: !v.is_flagged, flag_reason: v.is_flagged ? null : 'Manual review' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlaggedOnly(false)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${!flaggedOnly ? 'bg-champagne-500 text-ink-900' : 'bg-ink-800 text-white/60 border border-white/10'}`}
          >
            All Votes
          </button>
          <button
            onClick={() => setFlaggedOnly(true)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${flaggedOnly ? 'bg-burgundy-800 text-white border border-burgundy-600' : 'bg-ink-800 text-white/60 border border-white/10'}`}
          >
            🚩 Flagged Only
          </button>
        </div>
        <span className="text-white/40 text-sm">{votes.length} votes shown</span>
      </div>
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/50">
              <tr className="text-white/40 text-xs uppercase">
                <th className="px-4 py-4 text-left">Nominee</th>
                <th className="px-4 py-4 text-left">Voter</th>
                <th className="px-4 py-4 text-left">Mobile</th>
                <th className="px-4 py-4 text-left">OTP</th>
                <th className="px-4 py-4 text-left">Date</th>
                <th className="px-4 py-4 text-left">IP</th>
                <th className="px-4 py-4 text-left">Flag</th>
              </tr>
            </thead>
            <tbody>
              {votes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-white/40">No votes {flaggedOnly ? 'flagged' : 'recorded'} yet</td></tr>
              ) : (
                votes.map((v) => (
                  <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4 text-white">{v.nominee_name}</td>
                    <td className="px-4 py-4 text-white/60 text-xs">
                      {v.voter_name || 'Anonymous'}<br />{v.voter_email || ''}
                    </td>
                    <td className="px-4 py-4 text-white/60 text-xs">{v.voter_phone || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${v.otp_verified ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                        {v.otp_verified ? 'Verified' : 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white/40 text-xs">{new Date(v.created_at).toLocaleString()}</td>
                    <td className="px-4 py-4 text-white/40 text-xs">{v.ip_address || '—'}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleFlag(v)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          v.is_flagged ? 'bg-burgundy-900/50 text-burgundy-400 border border-burgundy-600' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                        }`}
                      >
                        {v.is_flagged ? `🚩 ${v.flag_reason || 'Flagged'}` : 'Flag'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SponsorsTab() {
  const [sponsors, setSponsors] = useState([]);
  const [form, setForm] = useState({ name: '', tier: 'gold', website_url: '', tagline: '', logo_url: '' });
  const [message, setMessage] = useState(null);

  const load = () => {
    api.get('/admin/sponsors').then(setSponsors).catch(() => {});
  };
  useEffect(load, []);

  const createSponsor = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/sponsors', form);
    setMessage({ type: 'success', text: res.message || 'Sponsor created' });
    setForm({ name: '', tier: 'gold', website_url: '', tagline: '', logo_url: '' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteSponsor = async (id) => {
    const res = await api.delete(`/admin/sponsors/${id}`);
    setMessage({ type: 'success', text: res.message || 'Sponsor deleted' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleActive = async (s) => {
    await api.put(`/admin/sponsors/${s.id}`, { is_active: !s.is_active });
    load();
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-900/30 border border-emerald-500/40 text-emerald-200">{message.text}</div>
      )}
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">Add Official Brand Partner</h2>
        <form onSubmit={createSponsor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sponsor Brand Name *" className="input-field" required />
            <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="input-field">
              {['title_partner', 'powered_by', 'co_powered_by', 'gold', 'silver', 'category_partner', 'media_partner', 'digital_partner', 'travel_partner'].map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="Website URL (optional)" className="input-field" />
            <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline (optional)" className="input-field" />
          </div>

          <div>
            <ImageUploader
              label="Brand Partner Logo (Upload File)"
              value={form.logo_url}
              onChange={(url) => setForm({ ...form, logo_url: url })}
            />
          </div>

          <div className="text-right">
            <button type="submit" className="btn-gold !py-2.5 text-xs">+ Save Sponsor</button>
          </div>
        </form>
      </div>
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/50">
              <tr className="text-white/40 text-xs uppercase">
                <th className="px-4 py-4 text-left">Brand</th>
                <th className="px-4 py-4 text-left">Tier</th>
                <th className="px-4 py-4 text-left">Website</th>
                <th className="px-4 py-4 text-left">Active</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-white/40">No sponsors yet</td></tr>
              ) : (
                sponsors.map((s) => (
                  <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4 text-white font-medium">
                      <div className="flex items-center gap-3">
                        {s.logo_url ? (
                          <div className="w-10 h-10 rounded-lg bg-white/5 p-1 border border-white/10 flex items-center justify-center shrink-0">
                            <img src={getAssetUrl(s.logo_url)} className="max-w-full max-h-full object-contain" alt="" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/40 shrink-0">
                            🤝
                          </div>
                        )}
                        <div>
                          <div>{s.name}</div>
                          {s.tagline && <div className="text-[10px] text-white/40">{s.tagline}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-champagne-500/15 text-champagne-400 text-xs">{s.tier.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-4 text-white/40 text-xs">{s.website_url || '—'}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleActive(s)} className={`text-xs font-medium ${s.is_active ? 'text-emerald-400' : 'text-white/30'}`}>
                        {s.is_active ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => deleteSponsor(s.id)} className="text-burgundy-400 hover:text-burgundy-300 text-xs">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get('/settings').then((data) => {
      if (Array.isArray(data)) {
        const obj = {};
        data.forEach((s) => { obj[s.setting_key] = s.setting_value; });
        setSettings(obj);
      }
    }).catch(() => {});
  }, []);

  const save = async () => {
    const toSave = {
      event_name: settings.event_name,
      event_tagline: settings.event_tagline,
      event_date: settings.event_date,
      event_venue: settings.event_venue,
      hero_headline: settings.hero_headline,
      hero_subheadline: settings.hero_subheadline,
      announcement: settings.announcement,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
    };
    const res = await api.put('/admin/settings', toSave);
    setMessage({ type: 'success', text: res.message || 'Settings saved' });
    setTimeout(() => setMessage(null), 3000);
  };

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-900/30 border border-emerald-500/40 text-emerald-200">{message.text}</div>
      )}
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-6">Site Content Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Event Name</label>
            <input type="text" value={settings.event_name || ''} onChange={(e) => update('event_name', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Event Tagline</label>
            <input type="text" value={settings.event_tagline || ''} onChange={(e) => update('event_tagline', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Event Date & Time</label>
            <input type="text" value={settings.event_date || ''} onChange={(e) => update('event_date', e.target.value)} className="input-field" placeholder="2026-12-10 18:00:00" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Event Venue</label>
            <input type="text" value={settings.event_venue || ''} onChange={(e) => update('event_venue', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Hero Headline</label>
            <input type="text" value={settings.hero_headline || ''} onChange={(e) => update('hero_headline', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Hero Sub-headline</label>
            <input type="text" value={settings.hero_subheadline || ''} onChange={(e) => update('hero_subheadline', e.target.value)} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/60 mb-2">Announcement Bar</label>
            <input type="text" value={settings.announcement || ''} onChange={(e) => update('announcement', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Contact Email</label>
            <input type="text" value={settings.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Contact Phone</label>
            <input type="text" value={settings.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} className="input-field" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/60 mb-2">Contact Address</label>
            <input type="text" value={settings.contact_address || ''} onChange={(e) => update('contact_address', e.target.value)} className="input-field" />
          </div>
        </div>
        <button onClick={save} className="btn-gold mt-6">Save All Settings</button>
      </div>
    </div>
  );
}

// ========== TICKETS & CHECK-IN TAB ==========
function TicketsTab() {
  const [data, setData] = useState({ configs: [], orders: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [message, setMessage] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/tickets')
      .then((res) => { if (res && res.orders) setData(res); })
      .catch((err) => setMessage({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleCheckIn = async (order) => {
    const nextState = !order.is_checked_in;
    const res = await api.put(`/admin/tickets/${order.id}/check-in`, { is_checked_in: nextState });
    setMessage({ type: 'success', text: res.message || 'Check-in status updated' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const updateConfig = async (id, availability) => {
    const res = await api.put(`/admin/tickets/config/${id}`, { availability });
    setMessage({ type: 'success', text: res.message || 'Availability updated' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredOrders = (data.orders || []).filter((o) => {
    const matchesSession = !filterSession || String(o.session) === filterSession;
    const matchesSearch = !search ||
      (o.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.buyer_phone || '').includes(search) ||
      (o.order_code || '').toLowerCase().includes(search.toLowerCase());
    return matchesSession && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm border ${message.type === 'error' ? 'bg-red-900/30 border-red-500/40 text-red-200' : 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {/* Ticket Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Paid Orders" value={data.stats?.total_orders || 0} icon="🎟️" />
        <StatCard label="Total Attendees" value={data.stats?.total_attendees || 0} icon="👥" />
        <StatCard
          label="Total Revenue"
          value={`₹${Math.round((Number(data.stats?.total_revenue_paisa) || 0) / 100).toLocaleString('en-IN')}`}
          icon="💰"
        />
        <StatCard label="Gate Checked In" value={data.stats?.total_checked_in || 0} icon="✅" />
      </div>

      {/* Ticket Tier Management */}
      <div className="glass-card p-6">
        <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Session & Tier Availability Control</span>
          <span className="text-xs text-white/40 font-normal">Controls public status display without exposing counts</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data.configs || []).map((cfg) => (
            <div key={cfg.id} className="p-4 rounded-2xl bg-ink-900/70 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-champagne-400">
                  Session {cfg.session} • {cfg.tier?.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-white">₹{cfg.price_paisa / 100}</span>
              </div>
              <div className="text-xs text-white/60">
                Sold: <strong className="text-white">{cfg.sold}</strong> / Cap: {cfg.inventory || 'Open'}
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Status</label>
                <select
                  value={cfg.availability}
                  onChange={(e) => updateConfig(cfg.id, e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-ink-800 border border-white/10 text-white text-xs"
                >
                  <option value="available">Available</option>
                  <option value="filling_fast">Filling Fast</option>
                  <option value="almost_sold_out">Almost Sold Out</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders & Gate Check-in Table */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Attendee Orders & Check-In</h2>
            <p className="text-white/40 text-xs mt-1">Live entry validation for Hitex gate staff.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, order code..."
              className="px-3.5 py-2 rounded-xl bg-ink-800 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-champagne-500 flex-1 md:w-64"
            />
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="px-3 py-2 rounded-xl bg-ink-800 border border-white/10 text-white text-xs"
            >
              <option value="">All Sessions</option>
              <option value="1">Session 1 (Lunch)</option>
              <option value="2">Session 2 (Dinner)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">No matching orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40 uppercase border-b border-white/5 pb-2">
                  <th className="pb-3 pr-4">Order Code</th>
                  <th className="pb-3 pr-4">Attendee</th>
                  <th className="pb-3 pr-4">Session & Tier</th>
                  <th className="pb-3 pr-4">Qty</th>
                  <th className="pb-3 pr-4">Meal</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-mono font-semibold text-champagne-400">
                      {ord.order_code}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-white">{ord.buyer_name}</div>
                      <div className="text-[10px] text-white/40">{ord.buyer_phone} • {ord.buyer_email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="uppercase font-bold text-white">S{ord.session} • {ord.tier}</span>
                      <div className="text-[10px] text-white/40">₹{ord.price_paisa / 100}</div>
                    </td>
                    <td className="py-3 pr-4 font-bold">{ord.quantity}</td>
                    <td className="py-3 pr-4 capitalize text-emerald-400">{ord.food_entitlement}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ord.is_checked_in ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50'
                      }`}>
                        {ord.is_checked_in ? '✓ Inside' : 'Not Checked'}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggleCheckIn(ord)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          ord.is_checked_in
                            ? 'bg-ink-800 text-white/60 hover:text-red-400 border border-white/10'
                            : 'bg-emerald-500 text-ink-900 hover:bg-emerald-400 shadow'
                        }`}
                      >
                        {ord.is_checked_in ? 'Undo Check-In' : 'Admit Entry'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== PAST EVENTS & AWARDEES TAB ==========
function PastEventsTab() {
  const [activeSubTab, setActiveSubTab] = useState('events'); // 'events' | 'awardees'
  const [events, setEvents] = useState([]);
  const [awardees, setAwardees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Form states
  const [newEvent, setNewEvent] = useState({ slug: '', name: '', year: 2026, venue: 'Hitex, Hyderabad', description: '', poster_url: '' });
  const [newAwardee, setNewAwardee] = useState({ past_event_id: '', name: '', category: '', award_type: 'Winner', year: 2025, photo_url: '', bio: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/past-events').catch(() => []),
      api.get('/admin/awardees').catch(() => []),
    ]).then(([evData, awData]) => {
      if (Array.isArray(evData)) setEvents(evData);
      if (Array.isArray(awData)) setAwardees(awData);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/past-events', newEvent);
    setMessage({ type: 'success', text: res.message || 'Event created' });
    setNewEvent({ slug: '', name: '', year: 2026, venue: 'Hitex, Hyderabad', description: '', poster_url: '' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    const res = await api.delete(`/admin/past-events/${id}`);
    setMessage({ type: 'success', text: res.message || 'Event deleted' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateAwardee = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/awardees', newAwardee);
    setMessage({ type: 'success', text: res.message || 'Awardee added' });
    setNewAwardee({ past_event_id: events[0]?.id || '', name: '', category: '', award_type: 'Winner', year: 2025, photo_url: '', bio: '' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteAwardee = async (id) => {
    const res = await api.delete(`/admin/awardees/${id}`);
    setMessage({ type: 'success', text: res.message || 'Awardee removed' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-900/30 border border-emerald-500/40 text-emerald-200">
          {message.text}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'events' ? 'bg-champagne-500 text-ink-900' : 'bg-ink-800 text-white/60 hover:text-white'
          }`}
        >
          Past Events Hub ({events.length})
        </button>
        <button
          onClick={() => setActiveSubTab('awardees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'awardees' ? 'bg-champagne-500 text-ink-900' : 'bg-ink-800 text-white/60 hover:text-white'
          }`}
        >
          Awardees & Hall of Fame ({awardees.length})
        </button>
      </div>

      {activeSubTab === 'events' ? (
        <div className="space-y-6">
          {/* Add Event Form */}
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Add Past Event Archive</h3>
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <input
                type="text"
                placeholder="Slug (e.g., stree-shakti-2025)"
                value={newEvent.slug}
                onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="text"
                placeholder="Event Name"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="number"
                placeholder="Year"
                value={newEvent.year}
                onChange={(e) => setNewEvent({ ...newEvent, year: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="text"
                placeholder="Venue"
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Brief Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="input-field md:col-span-2"
              />
              <div className="md:col-span-3">
                <ImageUploader
                  label="Event Poster Image (Upload File)"
                  value={newEvent.poster_url}
                  onChange={(url) => setNewEvent({ ...newEvent, poster_url: url })}
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="btn-gold !py-2.5 text-xs">+ Save Past Event</button>
              </div>
            </form>
          </div>

          {/* Events List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <div key={ev.id} className="glass-card p-5 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  {ev.poster_url && (
                    <img src={getAssetUrl(ev.poster_url)} alt="" className="w-16 h-20 object-cover rounded-lg shrink-0 border border-white/10" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-champagne-400 uppercase">{ev.year} • {ev.slug}</div>
                    <h4 className="font-display font-bold text-white text-base mt-1">{ev.name}</h4>
                    <div className="text-xs text-white/50 mt-1">{ev.venue}</div>
                    {ev.description && <p className="text-xs text-white/40 mt-2 line-clamp-2">{ev.description}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-300 border border-red-500/30 text-xs hover:bg-red-900/50 shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Awardee Form */}
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Add Award Winner</h3>
            <form onSubmit={handleCreateAwardee} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <select
                value={newAwardee.past_event_id}
                onChange={(e) => setNewAwardee({ ...newAwardee, past_event_id: e.target.value })}
                required
                className="input-field"
              >
                <option value="">Select Event...</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name} ({ev.year})</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Awardee Name *"
                value={newAwardee.name}
                onChange={(e) => setNewAwardee({ ...newAwardee, name: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="text"
                placeholder="Category Name *"
                value={newAwardee.category}
                onChange={(e) => setNewAwardee({ ...newAwardee, category: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="text"
                placeholder="Award Title (e.g. Winner)"
                value={newAwardee.award_type}
                onChange={(e) => setNewAwardee({ ...newAwardee, award_type: e.target.value })}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Year"
                value={newAwardee.year}
                onChange={(e) => setNewAwardee({ ...newAwardee, year: e.target.value })}
                className="input-field"
              />
              <div className="md:col-span-3">
                <ImageUploader
                  label="Winner Photo (Upload File)"
                  value={newAwardee.photo_url}
                  onChange={(url) => setNewAwardee({ ...newAwardee, photo_url: url })}
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="btn-gold !py-2.5 text-xs">+ Save Awardee</button>
              </div>
            </form>
          </div>

          {/* Awardees Table */}
          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40 uppercase border-b border-white/5 pb-2">
                  <th className="pb-3 pr-4">Winner</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Event & Year</th>
                  <th className="pb-3 pr-4">Title</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {awardees.map((aw) => (
                  <tr key={aw.id} className="hover:bg-white/5">
                    <td className="py-2.5 pr-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        {aw.photo_url ? (
                          <img src={getAssetUrl(aw.photo_url)} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs shrink-0">🏅</div>
                        )}
                        <span>{aw.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-champagne-400">{aw.category}</td>
                    <td className="py-2.5 pr-4">{aw.event_name || 'Past Event'} ({aw.year})</td>
                    <td className="py-2.5 pr-4 font-medium">{aw.award_type || 'Winner'}</td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleDeleteAwardee(aw.id)}
                        className="text-red-400 hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== MEDIA & GALLERY CMS TAB ==========
function MediaTab() {
  const [activeSubTab, setActiveSubTab] = useState('gallery'); // 'gallery' | 'media'
  const [gallery, setGallery] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [newGallery, setNewGallery] = useState({ category: 'telugu_icon_2026', url: '', title: '', description: '' });
  const [newMedia, setNewMedia] = useState({ item_type: 'press_release', title: '', description: '', url: '', source: 'TIA PR' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/gallery').catch(() => []),
      api.get('/admin/media').catch(() => []),
    ]).then(([galData, medData]) => {
      if (Array.isArray(galData)) setGallery(galData);
      if (Array.isArray(medData)) setMedia(medData);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreateGallery = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/gallery', newGallery);
    setMessage({ type: 'success', text: res.message || 'Gallery item added' });
    setNewGallery({ category: 'telugu_icon_2026', url: '', title: '', description: '' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteGallery = async (id) => {
    const res = await api.delete(`/admin/gallery/${id}`);
    setMessage({ type: 'success', text: res.message || 'Gallery item deleted' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateMedia = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/media', newMedia);
    setMessage({ type: 'success', text: res.message || 'Media release published' });
    setNewMedia({ item_type: 'press_release', title: '', description: '', url: '', source: 'TIA PR' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteMedia = async (id) => {
    const res = await api.delete(`/admin/media/${id}`);
    setMessage({ type: 'success', text: res.message || 'Media release deleted' });
    load();
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-900/30 border border-emerald-500/40 text-emerald-200">
          {message.text}
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveSubTab('gallery')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'gallery' ? 'bg-champagne-500 text-ink-900' : 'bg-ink-800 text-white/60 hover:text-white'
          }`}
        >
          Photo Gallery ({gallery.length})
        </button>
        <button
          onClick={() => setActiveSubTab('media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'media' ? 'bg-champagne-500 text-ink-900' : 'bg-ink-800 text-white/60 hover:text-white'
          }`}
        >
          Press Releases & News ({media.length})
        </button>
      </div>

      {activeSubTab === 'gallery' ? (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Add Photo to Gallery</h3>
            <form onSubmit={handleCreateGallery} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <select
                value={newGallery.category}
                onChange={(e) => setNewGallery({ ...newGallery, category: e.target.value })}
                className="input-field"
              >
                <option value="telugu_icon_2026">Telugu Icon Awards 2026</option>
                <option value="telugu_icon_digital_2026">Telugu Icon Digital 2026</option>
                <option value="stree_shakti_2025">Stree Shakti 2025</option>
                <option value="press_events">Press Events</option>
                <option value="launch_events">Launch Events</option>
                <option value="behind_scenes">Behind the Scenes</option>
              </select>
              <input
                type="text"
                placeholder="Title / Caption (optional)"
                value={newGallery.title}
                onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
                className="input-field md:col-span-2"
              />
              <div className="md:col-span-3">
                <ImageUploader
                  label="Gallery Image (Upload File)"
                  value={newGallery.url}
                  onChange={(url) => setNewGallery({ ...newGallery, url })}
                  required
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="btn-gold !py-2 text-xs">+ Add Image to Gallery</button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-ink-800">
                <img src={getAssetUrl(item.url)} alt={item.title || 'Gallery'} className="w-full h-36 object-cover" />
                <div className="p-2.5">
                  <div className="text-[10px] text-champagne-400 uppercase truncate">{item.category}</div>
                  <div className="text-xs font-bold text-white truncate">{item.title || 'Photo'}</div>
                  <button
                    onClick={() => handleDeleteGallery(item.id)}
                    className="mt-2 text-[10px] text-red-400 hover:text-red-300 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-white mb-4">Publish Press Release / Media Link</h3>
            <form onSubmit={handleCreateMedia} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <select
                value={newMedia.item_type}
                onChange={(e) => setNewMedia({ ...newMedia, item_type: e.target.value })}
                className="input-field"
              >
                <option value="press_release">Press Release</option>
                <option value="news">Media News</option>
                <option value="announcement">Official Announcement</option>
                <option value="kit">Downloadable Kit</option>
              </select>
              <input
                type="text"
                placeholder="Headline / Title"
                value={newMedia.title}
                onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                required
                className="input-field"
              />
              <input
                type="text"
                placeholder="Source (e.g., Deccan Chronicle, TIA PR)"
                value={newMedia.source}
                onChange={(e) => setNewMedia({ ...newMedia, source: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Short Description"
                value={newMedia.description}
                onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                className="input-field md:col-span-2"
              />
              <div className="md:col-span-3">
                <ImageUploader
                  label="Press Article Cover / Media Asset (Upload File)"
                  value={newMedia.url}
                  onChange={(url) => setNewMedia({ ...newMedia, url })}
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="btn-gold !py-2 text-xs">+ Publish Release</button>
              </div>
            </form>
          </div>

          <div className="glass-card p-6 divide-y divide-white/5">
            {media.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] text-champagne-400 uppercase font-semibold">{item.item_type} • {item.source}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{item.title}</div>
                  {item.description && <p className="text-xs text-white/50 mt-1 line-clamp-1">{item.description}</p>}
                </div>
                <button
                  onClick={() => handleDeleteMedia(item.id)}
                  className="text-xs text-red-400 hover:text-red-300 shrink-0 font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== SPONSOR LEADS TAB ==========
function SponsorLeadsTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/admin/sponsor-leads')
      .then((data) => { if (Array.isArray(data)) setLeads(data); })
      .catch((err) => setMessage({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    await api.put(`/admin/sponsor-leads/${id}/read`, {});
    load();
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-2">Partner & Sponsor Enquiries</h2>
        <p className="text-white/40 text-xs mb-6">Inbound leads captured through the "Become a Partner" form.</p>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading partner leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">No partner inquiries yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {leads.map((lead) => (
              <div key={lead.id} className={`py-4 ${lead.is_read ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{lead.company}</span>
                      {lead.package_interest && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-champagne-500/10 text-champagne-400 border border-champagne-500/30 uppercase">
                          {lead.package_interest}
                        </span>
                      )}
                      {!lead.is_read && (
                        <span className="w-2 h-2 rounded-full bg-champagne-400" title="New" />
                      )}
                    </div>
                    <div className="text-xs text-white/60 mt-1">
                      Contact: <strong className="text-white">{lead.contact_person}</strong> • 
                      <a href={`tel:${lead.mobile}`} className="text-champagne-400 ml-1 mr-2">{lead.mobile}</a>
                      <a href={`mailto:${lead.email}`} className="text-white/40 hover:underline">{lead.email}</a>
                    </div>
                    {lead.industry && (
                      <div className="text-[11px] text-white/40 mt-1">Industry: {lead.industry}</div>
                    )}
                    {lead.message && (
                      <p className="text-xs text-white/70 mt-2 p-3 rounded-xl bg-ink-900/60 border border-white/5">
                        "{lead.message}"
                      </p>
                    )}
                  </div>
                  {!lead.is_read && (
                    <button
                      onClick={() => markRead(lead.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== EVENT PHASE SWITCHER TAB ==========
function PhaseTab() {
  const [currentPhase, setCurrentPhase] = useState('phase_2');
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((data) => {
      if (Array.isArray(data)) {
        const item = data.find((s) => s.setting_key === 'event_phase');
        if (item) setCurrentPhase(item.setting_value);
      }
    }).catch(() => {});
  }, []);

  const savePhase = async (phase) => {
    setSaving(true);
    try {
      const res = await api.put('/admin/event-phase', { phase });
      setCurrentPhase(phase);
      setMessage({ type: 'success', text: res.message || 'Phase updated' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const PHASES = [
    {
      id: 'phase_1',
      num: 1,
      title: 'Nominations Open',
      desc: 'Campaign launch. Hero highlights self and peer nomination forms. Countdown targets June 30, 2026.',
      cta: 'Nominate Now',
    },
    {
      id: 'phase_2',
      num: 2,
      title: 'Public Voting Live',
      desc: 'Official nominees published. OTP-verified voting engine active. Real-time public leaderboard.',
      cta: 'Vote Now',
    },
    {
      id: 'phase_3',
      num: 3,
      title: 'Jury & Audit Review',
      desc: 'Voting closes. Final verification & forensic vote audits. Ticket sales highlighted.',
      cta: 'Book Tickets',
    },
    {
      id: 'phase_4',
      num: 4,
      title: 'Event Day (August 30, 2026)',
      desc: 'Grand Gala day at Hitex. Gate QR code scanning, session schedule, and live streams.',
      cta: 'Gate Ticket Pass',
    },
    {
      id: 'phase_5',
      num: 5,
      title: 'Post-Event Archival',
      desc: 'Winners announced in Hall of Fame. Full photo gallery, event highlight reels, and press coverage.',
      cta: 'View Awardees',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm border ${message.type === 'error' ? 'bg-red-900/30 border-red-500/40 text-red-200' : 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200'}`}>
          {message.text}
        </div>
      )}

      <div className="glass-card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-2">5-Phase Lifecycle Control</h2>
        <p className="text-white/40 text-xs mb-6">
          Instantly switches public countdown banners, hero calls-to-action, and voting availability across the entire website.
        </p>

        <div className="space-y-4">
          {PHASES.map((p) => {
            const isActive = currentPhase === p.id;
            return (
              <div
                key={p.id}
                onClick={() => savePhase(p.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                  isActive
                    ? 'bg-champagne-500/15 border-champagne-500 shadow-gold'
                    : 'bg-ink-900/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive ? 'bg-champagne-500 text-ink-900' : 'bg-white/10 text-white/60'
                  }`}>
                    {p.num}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-white text-base">{p.title}</h4>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-champagne-500 text-ink-900 uppercase">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">{p.desc}</p>
                    <div className="text-[11px] text-champagne-400 font-semibold mt-2">
                      Primary Hero CTA: "{p.cta}"
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-champagne-500 text-ink-900'
                      : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
                  }`}
                >
                  {isActive ? 'Current Phase' : 'Switch to this'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========== AUDIT LOGS TAB ==========
function AuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then((data) => { if (Array.isArray(data)) setLogs(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExportVotes = () => {
    const token = localStorage.getItem('admin_token');
    window.open(`/api/admin/votes/export${token ? `?token=${token}` : ''}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-white">System & Forensic Audit Logs</h2>
            <p className="text-white/40 text-xs mt-1">Immutable administrative actions and anti-fraud quarantine logs.</p>
          </div>
          <button
            onClick={handleExportVotes}
            className="btn-gold !py-2.5 text-xs flex items-center gap-2"
          >
            <span>📥</span> Download Full Votes CSV
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/40">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-ink-900/40 border border-white/5 text-white/40 text-xs">
            No audit anomalies recorded yet. Forensic monitoring is active.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-white/40 uppercase border-b border-white/5 pb-2">
                  <th className="pb-3 pr-4">Timestamp</th>
                  <th className="pb-3 pr-4">Admin / Origin</th>
                  <th className="pb-3 pr-4">Action</th>
                  <th className="pb-3 pr-4">Entity</th>
                  <th className="pb-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="py-2.5 pr-4 text-white/40 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-white">{log.admin_email || 'System'}</td>
                    <td className="py-2.5 pr-4 text-champagne-400 font-bold uppercase">{log.action}</td>
                    <td className="py-2.5 pr-4">{log.entity_type} #{log.entity_id}</td>
                    <td className="py-2.5 text-white/60">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}