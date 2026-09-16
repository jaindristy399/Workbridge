import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import JobCard from '../components/JobCard';
import { Plus, Briefcase, Clock, CheckCircle2, Search, MessageSquare, TrendingUp, ArrowRight } from 'lucide-react';

const SkeletonCard = () => (
  <div className="card space-y-3">
    <div className="flex gap-3">
      <div className="skeleton w-11 h-11 rounded-2xl" />
      <div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
    </div>
    <div className="skeleton h-3 w-full rounded" />
    <div className="skeleton h-3 w-2/3 rounded" />
    <div className="flex gap-2 pt-1"><div className="skeleton h-5 w-16 rounded-full" /><div className="skeleton h-5 w-20 rounded-full" /></div>
  </div>
);

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    api.get('/jobs').then(({ data }) => {
      setJobs(data);
      setStats({
        total: data.length,
        open: data.filter(j => j.status === 'open').length,
        inProgress: data.filter(j => j.status === 'in_progress').length,
        completed: data.filter(j => j.status === 'completed').length,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const STAT_CARDS = [
    { label: 'Total Jobs',   value: stats.total,      icon: Briefcase,     iconBg: 'bg-violet-100',   iconColor: 'text-violet-600'  },
    { label: 'Open',         value: stats.open,        icon: Clock,         iconBg: 'bg-blue-100',     iconColor: 'text-blue-600'    },
    { label: 'In Progress',  value: stats.inProgress,  icon: TrendingUp,    iconBg: 'bg-amber-100',    iconColor: 'text-amber-600'   },
    { label: 'Completed',    value: stats.completed,   icon: CheckCircle2,  iconBg: 'bg-emerald-100',  iconColor: 'text-emerald-600' },
  ];

  return (
    <div className="page">
      {/* Hero banner */}
      <div className="rounded-3xl bg-gradient-hero p-7 mb-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-40 w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-violet-300 text-sm font-medium mb-1">Welcome back 👋</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name?.split(' ')[0]}</h1>
            <p className="text-slate-400 mt-1 text-sm">Manage your jobs and find the best professionals</p>
          </div>
          <Link to="/post-job" className="btn-primary btn-lg self-start sm:self-auto gap-2 whitespace-nowrap shadow-glow">
            <Plus size={18} /> Post a Job
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.iconBg}`}>
              <s.icon size={20} className={s.iconColor} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/post-job',  icon: Plus,         iconBg: 'bg-violet-100', iconColor: 'text-violet-600', title: 'Post a New Job',     desc: 'AI auto-detects category & price',  border: 'hover:border-violet-300' },
          { to: '/providers', icon: Search,        iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   title: 'Browse Providers',  desc: 'Find top-rated professionals',      border: 'hover:border-blue-300' },
          { to: '/chat',      icon: MessageSquare, iconBg: 'bg-emerald-100',iconColor: 'text-emerald-600',title: 'Messages',          desc: 'Chat with providers',               border: 'hover:border-emerald-300' },
        ].map(a => (
          <Link key={a.to} to={a.to}
            className={`card flex items-center gap-4 hover:shadow-card-md transition-all duration-200 border-2 border-transparent ${a.border} group`}>
            <div className={`w-11 h-11 rounded-2xl ${a.iconBg} flex items-center justify-center flex-shrink-0`}>
              <a.icon size={20} className={a.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 group-hover:text-slate-900 text-sm">{a.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Jobs list */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title">Your Jobs</h2>
          <p className="section-subtitle">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link to="/post-job" className="btn-ghost text-sm">+ New job</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-violet-400" />
          </div>
          <p className="font-semibold text-slate-700 text-lg">No jobs yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">Post your first job and get matched with skilled professionals</p>
          <Link to="/post-job" className="btn-primary mx-auto gap-2">
            <Plus size={16} /> Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => <JobCard key={job._id} job={job} />)}
        </div>
      )}
    </div>
  );
}
