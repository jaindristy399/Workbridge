import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StarRating from '../components/StarRating';
import { Briefcase, IndianRupee, CheckCircle2, Shield, Search, MessageSquare, ArrowRight, Power, Zap, Crown, Sparkles, TrendingDown } from 'lucide-react';

const SkeletonStat = () => (
  <div className="stat-card animate-pulse">
    <div className="skeleton w-12 h-12 rounded-2xl" />
    <div className="space-y-1.5"><div className="skeleton h-6 w-16 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
  </div>
);

export default function ProviderDashboard() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [myBids, setMyBids] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/providers/${user._id}/stats`),
      api.get('/bids/my'),
      api.get('/subscriptions/status'),
    ]).then(([statsRes, bidsRes, subRes]) => {
      setStats(statsRes.data);
      setMyBids(bidsRes.data.filter(b => b.status === 'accepted').slice(0, 5));
      setActiveJobs(bidsRes.data.filter(b => b.job?.status === 'in_progress'));
      setSubStatus(subRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user._id]);

  const toggleAvailability = async () => {
    try {
      const { data } = await api.put('/providers/availability', { availability: !user.availability });
      updateUser({ availability: data.availability });
    } catch (err) { console.error(err); }
  };

  const markCompleted = async (jobId) => {
    try {
      await api.put(`/jobs/${jobId}/status`, { status: 'completed' });
      setActiveJobs(prev => prev.filter(b => b.job._id !== jobId));
      // Refresh stats to reflect new commission-adjusted earnings
      const { data } = await api.get(`/providers/${user._id}/stats`);
      setStats(data);
    } catch (err) { alert(err.response?.data?.message); }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data } = await api.post('/subscriptions/subscribe');
      setSubStatus({ isPremium: true, subscriptionExpiry: data.subscriptionExpiry, daysLeft: 30 });
      updateUser({ isPremium: true, subscriptionExpiry: data.subscriptionExpiry });
      alert(data.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Subscription failed');
    } finally { setSubscribing(false); }
  };

  const COMMISSION_RATE = 0.10;

  const STAT_CARDS = [
    {
      label: 'Net Earnings',
      value: `₹${stats?.totalEarnings || 0}`,
      sub: `After 10% commission`,
      icon: IndianRupee, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'
    },
    {
      label: 'Jobs Completed',
      value: stats?.jobsCompleted || 0,
      icon: CheckCircle2, iconBg: 'bg-blue-100', iconColor: 'text-blue-600'
    },
    {
      label: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: Briefcase, iconBg: 'bg-amber-100', iconColor: 'text-amber-600'
    },
    {
      label: 'Trust Score',
      value: stats?.trustScore || 0,
      icon: Shield,
      iconBg: stats?.trustScore >= 80 ? 'bg-emerald-100' : 'bg-slate-100',
      iconColor: stats?.trustScore >= 80 ? 'text-emerald-600' : 'text-slate-600'
    },
  ];

  return (
    <div className="page">
      {/* Profile hero */}
      <div className="card mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-glow-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              {(user?.isPremium || subStatus?.isPremium) && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Crown size={12} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                {user?.isTopRated && (
                  <span className="badge bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px]">⭐ Top Rated</span>
                )}
                {(user?.isPremium || subStatus?.isPremium) && (
                  <span className="badge bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px]">
                    <Crown size={9} /> Premium
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={user?.averageRating} size="sm" />
                <span className="text-sm font-semibold text-slate-700">{user?.averageRating?.toFixed(1) || '—'}</span>
                <span className="text-xs text-slate-400">({user?.totalReviews || 0} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user?.skills?.slice(0, 3).map(s => <span key={s} className="badge-violet text-xs">{s}</span>)}
                {(user?.skills?.length || 0) > 3 && <span className="badge-gray text-xs">+{user.skills.length - 3}</span>}
              </div>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-card">
            <Power size={16} className={user?.availability ? 'text-emerald-500' : 'text-slate-400'} />
            <div>
              <p className="text-xs font-semibold text-slate-700">Availability</p>
              <p className="text-[11px] text-slate-400">{user?.availability ? 'Taking new jobs' : 'Not available'}</p>
            </div>
            <button onClick={toggleAvailability}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${user?.availability ? 'bg-emerald-500' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${user?.availability ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Commission notice */}
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 text-sm">
        <TrendingDown size={16} className="text-amber-600 flex-shrink-0" />
        <p className="text-amber-700">
          <span className="font-semibold">Platform commission: 10%</span> — Our platform generates revenue through a small commission on every successful transaction. Your displayed earnings are already net of this commission.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : STAT_CARDS.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.iconBg}`}><s.icon size={20} className={s.iconColor} /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Premium subscription card */}
      {!loading && (
        <div className={`card mb-8 relative overflow-hidden border-2 ${subStatus?.isPremium ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50' : 'border-slate-100'}`}>
          {subStatus?.isPremium && (
            <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-bl-2xl">
              ACTIVE
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${subStatus?.isPremium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-amber-100'}`}>
              <Crown size={22} className={subStatus?.isPremium ? 'text-white' : 'text-amber-600'} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900">Premium Provider</h3>
                {subStatus?.isPremium && (
                  <span className="badge bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px]">
                    <Crown size={9} /> Active — {subStatus.daysLeft} days left
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {subStatus?.isPremium
                  ? `Your subscription is active until ${new Date(subStatus.subscriptionExpiry).toLocaleDateString()}. Enjoy top listing priority, unlimited bidding, and analytics.`
                  : 'Get top listing priority, unlimited bidding, and access to analytics. Only ₹199/month.'}
              </p>
              {subStatus?.isPremium ? (
                <div className="flex flex-wrap gap-3 mt-3">
                  {['Top listing priority', 'Unlimited bidding', 'Analytics access'].map(f => (
                    <span key={f} className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                      <CheckCircle2 size={11} /> {f}
                    </span>
                  ))}
                </div>
              ) : (
                <button onClick={handleSubscribe} disabled={subscribing}
                  className="mt-3 btn px-5 py-2.5 rounded-full text-sm text-white font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md gap-2">
                  {subscribing
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Activating…</>
                    : <><Crown size={14} /> Go Premium — ₹199/mo</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/jobs/feed" className="card flex items-center gap-4 hover:shadow-card-md transition-all duration-200 border-2 border-transparent hover:border-violet-200 group">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Search size={20} className="text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Browse Job Feed</p>
            <p className="text-xs text-slate-500 mt-0.5">Find jobs matching your skills</p>
          </div>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
        </Link>
        <Link to="/chat" className="card flex items-center gap-4 hover:shadow-card-md transition-all duration-200 border-2 border-transparent hover:border-emerald-200 group">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">Messages</p>
            <p className="text-xs text-slate-500 mt-0.5">Chat with customers</p>
          </div>
          <ArrowRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-amber-500" />
            <h2 className="section-title">Active Jobs</h2>
            <span className="badge-yellow">{activeJobs.length}</span>
          </div>
          <div className="space-y-3">
            {activeJobs.map(bid => {
              const commission = Math.round(bid.job?.budget * COMMISSION_RATE * 100) / 100;
              const net = bid.job?.budget - commission;
              return (
                <div key={bid._id} className="card border-l-4 border-l-amber-400 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{bid.job?.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="badge-violet text-xs">{bid.job?.category}</span>
                      <span className="text-xs text-slate-400 line-through">₹{bid.job?.budget}</span>
                      <span className="text-xs text-emerald-600 font-semibold">You earn: ${net}</span>
                      <span className="text-xs text-slate-400">10% commission: ${commission}</span>
                    </div>
                  </div>
                  <button onClick={() => markCompleted(bid.job._id)}
                    className="btn-primary btn-sm whitespace-nowrap gap-1.5">
                    <CheckCircle2 size={13} /> Mark Done
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent accepted bids */}
      <div>
        <h2 className="section-title mb-1">Recent Accepted Bids</h2>
        <p className="section-subtitle mb-4">Jobs you've been hired for</p>
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="card skeleton h-20" />)}</div>
        ) : myBids.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-14 h-14 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <Briefcase size={24} className="text-violet-400" />
            </div>
            <p className="font-semibold text-slate-700">No bids accepted yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-5">Browse jobs and place your first bid</p>
            <Link to="/jobs/feed" className="btn-primary mx-auto gap-2"><Search size={15} /> Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myBids.map(bid => (
              <Link key={bid._id} to={`/jobs/${bid.job?._id}`}
                className="card flex items-center justify-between hover:shadow-card-md transition-all duration-200 group">
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{bid.job?.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="badge-violet text-xs">{bid.job?.category}</span>
                    <span className="text-xs text-emerald-600 font-semibold">Bid: ${bid.amount}</span>
                  </div>
                </div>
                <span className="badge-green">Accepted</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
