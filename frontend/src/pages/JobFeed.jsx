import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import JobCard from '../components/JobCard';
import { Search, SlidersHorizontal, Briefcase } from 'lucide-react';

const CATEGORIES = ['All','Plumbing','Electrical','Tutoring','Cleaning','Carpentry','Painting','Moving','Gardening','IT Support','Photography','Cooking','Delivery','Other'];

const CATEGORY_ICONS = { All:'🔍', Plumbing:'🔧', Electrical:'⚡', Tutoring:'📚', Cleaning:'🧹', Carpentry:'🪚', Painting:'🎨', Moving:'📦', Gardening:'🌿', 'IT Support':'💻', Photography:'📷', Cooking:'👨‍🍳', Delivery:'🚚', Other:'💼' };

const SkeletonCard = () => (
  <div className="card space-y-3 animate-pulse">
    <div className="flex gap-3"><div className="skeleton w-11 h-11 rounded-2xl" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div></div>
    <div className="skeleton h-3 w-full rounded" /><div className="skeleton h-3 w-2/3 rounded" />
  </div>
);

export default function JobFeed() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
      const { data } = await api.get(`/jobs/feed${params}`);
      setJobs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [category]);

  const filtered = jobs.filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase size={20} className="text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">Job Feed</h1>
        </div>
        <p className="text-slate-500 text-sm ml-7">Jobs matching your skills are ranked first</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search jobs by title or description…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-secondary gap-2 px-4">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
              category === cat
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
            }`}>
            <span>{CATEGORY_ICONS[cat]}</span> {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{filtered.length}</span> job{filtered.length !== 1 ? 's' : ''} found
            {category !== 'All' && <span> in <span className="text-violet-600 font-medium">{category}</span></span>}
          </p>
        </div>
      )}

      {/* Jobs grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700">No jobs found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different category or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(job => (
            <JobCard key={job._id} job={job} showCustomer
              actionButton={
                <button onClick={() => window.location.href = `/jobs/${job._id}`}
                  className="btn-primary btn-sm gap-1">
                  Bid Now
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
