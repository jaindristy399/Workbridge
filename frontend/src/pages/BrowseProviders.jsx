import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ProviderCard from '../components/ProviderCard';
import { Search, Users, SlidersHorizontal } from 'lucide-react';

const SKILLS = ['All', 'Plumbing', 'Electrical', 'Tutoring', 'Cleaning', 'Carpentry', 'Painting', 'IT Support', 'Gardening', 'Photography', 'Cooking', 'Delivery'];

const SKILL_ICONS = { All: '🔍', Plumbing: '🔧', Electrical: '⚡', Tutoring: '📚', Cleaning: '🧹', Carpentry: '🪚', Painting: '🎨', 'IT Support': '💻', Gardening: '🌿', Photography: '📷', Cooking: '👨‍🍳', Delivery: '🚚' };

const SkeletonCard = () => (
  <div className="card animate-pulse space-y-4">
    <div className="flex gap-4">
      <div className="skeleton w-16 h-16 rounded-3xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
    <div className="flex gap-2">
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-5 w-20 rounded-full" />
    </div>
  </div>
);

export default function BrowseProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skill, setSkill] = useState('All');
  const [minRating, setMinRating] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skill !== 'All') params.append('skill', skill);
      if (minRating) params.append('minRating', minRating);
      if (availableOnly) params.append('available', 'true');
      const { data } = await api.get(`/providers?${params}`);
      setProviders(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProviders(); }, [skill, minRating, availableOnly]);

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={20} className="text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">Browse Providers</h1>
        </div>
        <p className="text-slate-500 text-sm ml-7">Find top-rated professionals for your job</p>
      </div>

      {/* Filter bar */}
      <div className="card mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-40">
          <label className="input-label">Filter by Skill</label>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="input pl-9 appearance-none" value={skill} onChange={e => setSkill(e.target.value)}>
              {SKILLS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-32">
          <label className="input-label">Min Rating</label>
          <select className="input appearance-none" value={minRating} onChange={e => setMinRating(e.target.value)}>
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer pb-3 select-none">
          <div className={`w-10 h-5 rounded-full transition-all duration-200 relative ${availableOnly ? 'bg-violet-600' : 'bg-slate-200'}`}
            onClick={() => setAvailableOnly(v => !v)}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${availableOnly ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm font-medium text-slate-700">Available Now</span>
        </label>
      </div>

      {/* Skill pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1">
        {SKILLS.map(s => (
          <button key={s} onClick={() => setSkill(s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              skill === s
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
            }`}>
            <span>{SKILL_ICONS[s] || '💼'}</span> {s}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <div className="mb-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{providers.length}</span> provider{providers.length !== 1 ? 's' : ''} found
            {skill !== 'All' && <span> for <span className="text-violet-600 font-medium">{skill}</span></span>}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : providers.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No providers found</p>
          <p className="text-sm text-slate-400 mt-1">Try different filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(p => <ProviderCard key={p._id} provider={p} />)}
        </div>
      )}
    </div>
  );
}
