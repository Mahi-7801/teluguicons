import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { api } from '../../api';

const TABS = [
  { key: '', label: 'Dashboard', icon: '📊' },
  { key: 'nominations', label: 'Nominations', icon: '📝' },
  { key: 'nominees', label: 'Nominees', icon: '⭐' },
  { key: 'categories', label: 'Categories', icon: '🏷️' },
  { key: 'votes', label: 'Votes & Audit', icon: '🗳️' },
  { key: 'sponsors', label: 'Sponsors', icon: '🤝' },
  { key: 'sms-templates', label: 'SMS Templates', icon: '📲' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

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
    <div className="min-h-screen bg-ink-900 flex">
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
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              to={`/admin/${tab.key}`}
              className={`flex items-center px-4 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                currentTab.key === tab.key
                  ? 'bg-champagne-500/15 text-champagne-400 border border-champagne-500/30'
                  : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <span className="mr-3">{tab.icon}</span> {tab.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-white/30 text-xs">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-burgundy-400 transition-colors" title="Logout">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 max-md:ml-0 ml-64">
        <header className="sticky top-0 z-20 bg-ink-900/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white">
            {currentTab.icon} <span className="gold-text ml-2">{currentTab.label}</span>
          </h1>
          <div className="flex items-center space-x-4">
            <a href="/" className="btn-outline !px-4 !py-2 text-xs">View Site</a>
            <button onClick={handleLogout} className="md:hidden text-white/60 hover:text-burgundy-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>
        <div className="p-6 max-md:p-4">
          <Routes>
            <Route path="" element={<OverviewTab />} />
            <Route path="nominations" element={<NominationsTab />} />
            <Route path="nominees" element={<NomineesTab />} />
            <Route path="categories" element={<CategoriesTab />} />
            <Route path="votes" element={<VotesTab />} />
            <Route path="sponsors" element={<SponsorsTab />} />
            <Route path="sms-templates" element={<SmsTemplatesTab />} />
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
  const [message, setMessage] = useState(null);

  const load = () => {
    api.get('/admin/nominees').then(setNominees).catch(() => {});
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

  return (
    <div className="space-y-6">
      {message && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-900/30 border border-emerald-500/40 text-emerald-200">
          {message.text}
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
                <tr><td colSpan={7} className="px-4 py-12 text-center text-white/40">No nominees yet. Approve nominations to create nominees.</td></tr>
              ) : (
                nominees.map((n) => (
                  <tr key={n.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-ink-700 to-burgundy-900 flex items-center justify-center overflow-hidden shrink-0">
                          {n.photo_url ? <img src={n.photo_url} className="w-full h-full object-cover" alt="" /> : <span className="text-xs">🏆</span>}
                        </div>
                        <div>
                          <div className="font-medium text-white">{n.full_name}</div>
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
                      <a href={`/nominee/${n.id}`} target="_blank" rel="noreferrer" className="text-champagne-400 hover:text-champagne-300 text-xs font-medium">View ↗</a>
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
  const [form, setForm] = useState({ name: '', tier: 'gold', website_url: '', tagline: '' });
  const [message, setMessage] = useState(null);

  const load = () => {
    api.get('/admin/sponsors').then(setSponsors).catch(() => {});
  };
  useEffect(load, []);

  const createSponsor = async (e) => {
    e.preventDefault();
    const res = await api.post('/admin/sponsors', form);
    setMessage({ type: 'success', text: res.message || 'Sponsor created' });
    setForm({ name: '', tier: 'gold', website_url: '', tagline: '' });
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
        <h2 className="font-display text-xl font-bold text-white mb-4">Add Sponsor</h2>
        <form onSubmit={createSponsor} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sponsor name" className="input-field" required />
          <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="input-field">
            {['title_partner', 'powered_by', 'co_powered_by', 'gold', 'silver', 'category_partner', 'media_partner', 'digital_partner', 'travel_partner'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="Website URL" className="input-field" />
          <input type="text" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline" className="input-field" />
          <button type="submit" className="btn-gold">Add</button>
        </form>
      </div>
      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/50">
              <tr className="text-white/40 text-xs uppercase">
                <th className="px-4 py-4 text-left">Name</th>
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
                    <td className="px-4 py-4 text-white font-medium">{s.name}</td>
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

function SmsTemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [senders, setSenders] = useState([]);
  const [form, setForm] = useState({ name: '', sender_id: '', dlt_template_id: '', content: '', template_type: 'otp' });
  const [editing, setEditing] = useState(null);
  const [newSender, setNewSender] = useState('');
  const [message, setMessage] = useState(null);

  const load = () => {
    api.get('/admin/sms-templates').then(setTemplates).catch(() => {});
    api.get('/admin/sms-templates/senders').then(setSenders).catch(() => {});
  };
  useEffect(load, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const submitTemplate = async (e) => {
    e.preventDefault();
    if (!form.sender_id) { showMessage('Please select a Sender ID', 'error'); return; }
    try {
      if (editing) {
        const res = await api.put(`/admin/sms-templates/${editing.id}`, form);
        showMessage(res.message || 'Template updated');
        setEditing(null);
      } else {
        const res = await api.post('/admin/sms-templates', form);
        showMessage(res.message || 'Template created');
      }
      setForm({ name: '', sender_id: '', dlt_template_id: '', content: '', template_type: 'otp' });
      load();
    } catch (err) {
      showMessage(err.message || 'Failed to save template', 'error');
    }
  };

  const editTemplate = (t) => {
    setEditing(t);
    setForm({ name: t.name, sender_id: t.sender_id, dlt_template_id: t.dlt_template_id, content: t.content || '', template_type: t.template_type || 'otp' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activateTemplate = async (t) => {
    const res = await api.put(`/admin/sms-templates/${t.id}`, { is_active: !t.is_active });
    showMessage(res.message || 'Updated');
    load();
  };

  const deleteTemplate = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    const res = await api.delete(`/admin/sms-templates/${t.id}`);
    showMessage(res.message || 'Template deleted');
    if (editing?.id === t.id) setEditing(null);
    load();
  };

  const addSender = async (e) => {
    e.preventDefault();
    if (!newSender.trim()) return;
    try {
      const res = await api.post('/admin/sms-templates/senders', { sender_id: newSender });
      showMessage(res.message || 'Sender ID added');
      setNewSender('');
      load();
    } catch (err) {
      showMessage(err.message || 'Failed to add Sender ID', 'error');
    }
  };

  const deleteSender = async (id) => {
    const res = await api.delete(`/admin/sms-templates/senders/${id}`);
    showMessage(res.message || 'Sender ID deleted');
    load();
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`px-4 py-3 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-emerald-900/30 border border-emerald-500/40 text-emerald-200' : 'bg-burgundy-900/50 border border-burgundy-500/40 text-white/80'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-display text-xl font-bold text-white mb-1">
            {editing ? 'Edit Template' : 'Create Template'}
          </h2>
          <p className="text-white/40 text-sm mb-6">
            {editing ? 'Update the approved DLT template details.' : 'Add an SMS template approved on the DLT platform for OTP delivery.'}
          </p>
          <form onSubmit={submitTemplate} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2">Template Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Telugu Icon Vote OTP"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Select Sender ID</label>
              <select
                value={form.sender_id}
                onChange={(e) => setForm({ ...form, sender_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="" disabled>Select a Sender ID</option>
                {senders.length === 0 && (
                  <option value="" disabled>No Sender IDs yet — add one below</option>
                )}
                {senders.map((s) => (
                  <option key={s.id} value={s.sender_id}>{s.sender_id}{s.name ? ` — ${s.name}` : ''}</option>
                ))}
              </select>
              <p className="text-white/30 text-xs mt-2">Sender ID registered on the SMS provider / DLT platform.</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">DLT Template ID</label>
              <input
                type="text"
                value={form.dlt_template_id}
                onChange={(e) => setForm({ ...form, dlt_template_id: e.target.value })}
                placeholder="e.g. 1707171234567890123"
                className="input-field"
                required
              />
              <p className="text-white/30 text-xs mt-2">
                For India: Add the correct Template ID that is approved on the DLT platform.
              </p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">OTP Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="e.g. Your Telugu Icon verification code is {#var#}. It is valid for 10 minutes. — Pracharam Media"
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-white/30 text-xs mt-2">
                Use the placeholders exactly as approved on the DLT platform.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="btn-gold">
                {editing ? 'Update Template' : 'Save Template'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => { setEditing(null); setForm({ name: '', sender_id: '', dlt_template_id: '', content: '', template_type: 'otp' }); }}
                  className="btn-outline"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-xl font-bold text-white mb-3">Sender IDs</h2>
          <p className="text-white/40 text-sm mb-4">Registered sender IDs for the SMS provider.</p>
          <form onSubmit={addSender} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSender}
              onChange={(e) => setNewSender(e.target.value)}
              placeholder="e.g. PRAHRM"
              maxLength={20}
              className="input-field"
            />
            <button type="submit" className="btn-gold !px-5">Add</button>
          </form>
          <div className="space-y-2">
            {senders.length === 0 ? (
              <p className="text-white/30 text-sm">No Sender IDs yet.</p>
            ) : (
              senders.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink-800 border border-white/10">
                  <div>
                    <div className="text-white font-mono text-sm">{s.sender_id}</div>
                    {s.name && <div className="text-white/30 text-xs">{s.name}</div>}
                  </div>
                  <button onClick={() => deleteSender(s.id)} className="text-burgundy-400 hover:text-burgundy-300 text-xs">Delete</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-display text-xl font-bold text-white">Saved Templates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-800/50">
              <tr className="text-white/40 text-xs uppercase">
                <th className="px-4 py-4 text-left">Name</th>
                <th className="px-4 py-4 text-left">Sender ID</th>
                <th className="px-4 py-4 text-left">DLT Template ID</th>
                <th className="px-4 py-4 text-left">Content</th>
                <th className="px-4 py-4 text-left">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-white/40">No templates yet. Create your first OTP template above.</td></tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-4 text-white font-medium">{t.name}</td>
                    <td className="px-4 py-4 text-white/60 font-mono text-xs">{t.sender_id}</td>
                    <td className="px-4 py-4 text-white/60 text-xs">{t.dlt_template_id}</td>
                    <td className="px-4 py-4 text-white/50 text-xs max-w-[280px]">
                      <span className="block truncate">{t.content || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => activateTemplate(t)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          t.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'
                        }`}
                      >
                        {t.is_active ? '● Active' : '○ Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => editTemplate(t)} className="text-champagne-400 hover:text-champagne-300 text-xs font-medium">Edit</button>
                      <button onClick={() => deleteTemplate(t)} className="text-burgundy-400 hover:text-burgundy-300 text-xs font-medium">Delete</button>
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