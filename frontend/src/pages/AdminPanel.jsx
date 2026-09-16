import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, Briefcase, BarChart2, IndianRupee, CheckCircle2, Clock, Search, Trash2, Shield, Crown, TrendingUp, CreditCard, ArrowUpRight } from 'lucide-react';

const TABS = ['Overview', 'Revenue', 'Users', 'Jobs'];
const TAB_ICONS = { Overview: BarChart2, Revenue: IndianRupee, Users: Users, Jobs: Briefcase };

export default function AdminPanel() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [txFilter, setTxFilter] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, revenueRes, txRes, usersRes, jobsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/revenue'),
          api.get('/admin/transactions?limit=50'),
          api.get('/admin/users'),
          api.get('/admin/jobs'),
        ]);
        setStats(statsRes.data);
        setRevenue(revenueRes.data);
        setTransactions(txRes.data.transactions || []);
        setUsers(usersRes.data);
        setJobs(jobsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) { alert(err.response?.data?.message); }
  };

  const filteredUsers = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredTx = transactions.filter(t => !txFilter || t.type === txFilter);

  if (loading) return (
    <div className="page flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
    </div>
  );

  const JOB_STATUS_COLORS = {
    open: 'bg-blue-100 text-blue-700', completed: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-amber-100 text-amber-700', cancelled: 'bg-rose-100 text-rose-700',
  };
  const ROLE_COLORS = {
    provider: 'bg-violet-100 text-violet-700', customer: 'bg-blue-100 text-blue-700', admin: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 text-sm">Manage users, jobs, and platform revenue</p>
        </div>
      </div>

      {/* Platform revenue note */}
      <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 mb-6 text-sm">
        <TrendingUp size={16} className="text-violet-600 flex-shrink-0" />
        <p className="text-violet-700">
          <span className="font-semibold">Business Model:</span> Our platform generates revenue through a small commission on every successful transaction and monthly premium subscriptions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-7 w-fit">
        {TABS.map(t => {
          const Icon = TAB_ICONS[t];
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t ? 'bg-white shadow-card text-violet-600' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={14} /> {t}
            </button>
          );
        })}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────── */}
      {tab === 'Overview' && stats && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',   value: stats.totalUsers,     icon: Users,      iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
              { label: 'Customers',     value: stats.totalCustomers, icon: Users,      iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'   },
              { label: 'Providers',     value: stats.totalProviders, icon: Briefcase,  iconBg: 'bg-amber-100',  iconColor: 'text-amber-600'  },
              { label: 'Total Jobs',    value: stats.totalJobs,      icon: Briefcase,  iconBg: 'bg-slate-100',  iconColor: 'text-slate-600'  },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.iconBg}`}><s.icon size={20} className={s.iconColor} /></div>
                <div><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-500 mt-0.5">{s.label}</p></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Open Jobs',      value: stats.openJobs,          icon: Clock,        iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'    },
              { label: 'Completed Jobs', value: stats.completedJobs,     icon: CheckCircle2, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
              { label: 'Transactions',   value: stats.totalTransactions,  icon: CreditCard,  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600'  },
              { label: 'Total Revenue',  value: `₹${revenue?.totalRevenue || 0}`, icon: IndianRupee, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className={`stat-icon ${s.iconBg}`}><s.icon size={20} className={s.iconColor} /></div>
                <div><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-500 mt-0.5">{s.label}</p></div>
              </div>
            ))}
          </div>

          {/* Job distribution chart */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
              <BarChart2 size={16} className="text-violet-500" /> Job Status Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Open',        value: stats.openJobs,      total: stats.totalJobs, color: 'from-blue-500 to-blue-400'       },
                { label: 'Completed',   value: stats.completedJobs, total: stats.totalJobs, color: 'from-emerald-500 to-emerald-400' },
                { label: 'In Progress', value: Math.max(0, stats.totalJobs - stats.openJobs - stats.completedJobs), total: stats.totalJobs, color: 'from-amber-500 to-amber-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 w-24 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`bg-gradient-to-r ${item.color} h-2.5 rounded-full transition-all duration-700`}
                      style={{ width: item.total ? `${(item.value / item.total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Revenue ───────────────────────────────────────────────────── */}
      {tab === 'Revenue' && revenue && (
        <div className="space-y-6 animate-fade-in">
          {/* Revenue KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card relative overflow-hidden border-emerald-100">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <IndianRupee size={20} className="text-emerald-600" />
                  </div>
                  <ArrowUpRight size={16} className="text-emerald-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">₹{revenue.totalRevenue}</p>
                <p className="text-sm text-slate-500 mt-1">Total Revenue</p>
                <div className="mt-3 flex gap-4 text-xs text-slate-400">
                  <span>Job commissions: <span className="font-semibold text-slate-600">₹{revenue.totalCommission}</span></span>
                  <span>Subscriptions: <span className="font-semibold text-slate-600">₹{revenue.totalSubscriptionRevenue}</span></span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <TrendingUp size={20} className="text-violet-600" />
                </div>
                <span className="badge-violet text-xs">10% rate</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">₹{revenue.totalCommission}</p>
              <p className="text-sm text-slate-500 mt-1">Job Commissions</p>
              <p className="text-xs text-slate-400 mt-2">{revenue.totalJobsCompleted} completed jobs</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Crown size={20} className="text-amber-600" />
                </div>
                <span className="badge bg-amber-100 text-amber-700 text-xs">{revenue.totalPremiumUsers} active</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">₹{revenue.totalSubscriptionRevenue}</p>
              <p className="text-sm text-slate-500 mt-1">Subscription Revenue</p>
              <p className="text-xs text-slate-400 mt-2">{revenue.totalSubscriptions} total subscriptions</p>
            </div>
          </div>

          {/* Monthly chart */}
          {revenue.monthlyBreakdown?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                <BarChart2 size={16} className="text-violet-500" /> Monthly Revenue
              </h3>
              <div className="space-y-3">
                {revenue.monthlyBreakdown.map(m => {
                  const maxVal = Math.max(...revenue.monthlyBreakdown.map(x => x.revenue), 1);
                  return (
                    <div key={m.month} className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 w-20 flex-shrink-0">{m.month}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2.5 rounded-full transition-all duration-700"
                          style={{ width: `${(m.revenue / maxVal) * 100}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-14 text-right">₹{m.revenue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction log */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Transaction Log</h3>
              <div className="flex gap-2">
                {['', 'job', 'subscription'].map(t => (
                  <button key={t} onClick={() => setTxFilter(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      txFilter === t ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {t === '' ? 'All' : t === 'job' ? 'Jobs' : 'Subscriptions'}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Type', 'Details', 'Total', 'Commission', 'Provider Earns', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTx.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">No transactions yet</td></tr>
                  ) : filteredTx.map(tx => (
                    <tr key={tx._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${tx.type === 'subscription' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>
                          {tx.type === 'subscription' ? <><Crown size={10} /> Premium</> : <><CreditCard size={10} /> Job</>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 truncate max-w-[180px]">
                          {tx.type === 'subscription' ? `${tx.customer?.name} subscribed` : tx.job?.title || '—'}
                        </p>
                        <p className="text-xs text-slate-400">{tx.customer?.name}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">₹{tx.totalAmount}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">₹{tx.commissionAmount}</td>
                      <td className="px-4 py-3 text-slate-500">{tx.providerEarning > 0 ? `₹${tx.providerEarning}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Users ─────────────────────────────────────────────────────── */}
      {tab === 'Users' && (
        <div className="animate-fade-in">
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Search by name or email…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input w-40 appearance-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="provider">Provider</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            <span className="font-semibold text-slate-800">{filteredUsers.length}</span> users
          </p>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['User', 'Role', 'Location', 'Rating', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {u.name?.[0]}
                            </div>
                            {u.isPremium && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Crown size={8} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            <p className="text-slate-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge text-xs ${ROLE_COLORS[u.role] || 'badge-gray'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-sm">{u.location?.city || '—'}</td>
                      <td className="px-4 py-3.5">
                        {u.averageRating > 0
                          ? <span className="flex items-center gap-1 text-sm"><span className="text-amber-400">★</span><span className="font-semibold text-slate-700">{u.averageRating?.toFixed(1)}</span></span>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {u.isPremium
                          ? <span className="badge bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px]"><Crown size={8} /> Premium</span>
                          : <span className="text-slate-400 text-xs">Free</span>}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => deleteUser(u._id)}
                          className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors">
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Jobs ──────────────────────────────────────────────────────── */}
      {tab === 'Jobs' && (
        <div className="animate-fade-in">
          <p className="text-sm text-slate-500 mb-3">
            <span className="font-semibold text-slate-800">{jobs.length}</span> total jobs
          </p>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Job', 'Category', 'Budget', 'Commission', 'Status', 'Customer', 'Posted'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {jobs.map(j => (
                    <tr key={j._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5"><p className="font-semibold text-slate-900 truncate max-w-xs">{j.title}</p></td>
                      <td className="px-4 py-3.5"><span className="badge-violet text-xs">{j.category}</span></td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">₹{j.budget}</td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-600">
                        {j.status === 'completed' ? `₹${Math.round(j.budget * 0.10 * 100) / 100}` : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge text-xs ${JOB_STATUS_COLORS[j.status] || 'badge-gray'}`}>
                          {j.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{j.customer?.name || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-400">{new Date(j.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
