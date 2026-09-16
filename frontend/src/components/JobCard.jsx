import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, IndianRupee, Zap, ArrowRight } from 'lucide-react';

const STATUS_CONFIG = {
  open:        { cls: 'badge-blue',   label: 'Open' },
  in_progress: { cls: 'badge-yellow', label: 'In Progress' },
  completed:   { cls: 'badge-green',  label: 'Completed' },
  cancelled:   { cls: 'badge-red',    label: 'Cancelled' },
};

const CATEGORY_META = {
  'Plumbing':    { icon: '🔧', color: 'from-blue-500 to-cyan-500' },
  'Electrical':  { icon: '⚡', color: 'from-yellow-500 to-orange-500' },
  'Tutoring':    { icon: '📚', color: 'from-violet-500 to-purple-500' },
  'Cleaning':    { icon: '🧹', color: 'from-teal-500 to-emerald-500' },
  'Carpentry':   { icon: '🪚', color: 'from-amber-600 to-yellow-600' },
  'Painting':    { icon: '🎨', color: 'from-pink-500 to-rose-500' },
  'Moving':      { icon: '📦', color: 'from-orange-500 to-red-500' },
  'Gardening':   { icon: '🌿', color: 'from-green-500 to-emerald-500' },
  'IT Support':  { icon: '💻', color: 'from-indigo-500 to-blue-500' },
  'Photography': { icon: '📷', color: 'from-purple-500 to-pink-500' },
  'Cooking':     { icon: '👨‍🍳', color: 'from-red-500 to-orange-500' },
  'Delivery':    { icon: '🚚', color: 'from-slate-500 to-gray-500' },
  'Other':       { icon: '💼', color: 'from-slate-400 to-slate-600' },
};

const timeAgo = (date) => {
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function JobCard({ job, showCustomer = false, actionButton }) {
  const meta   = CATEGORY_META[job.category] || CATEGORY_META['Other'];
  const status = STATUS_CONFIG[job.status]   || { cls: 'badge-gray', label: job.status };

  return (
    <div className="card group hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
            {meta.icon}
          </div>
          <div>
            <Link to={`/jobs/${job._id}`}
              className="font-semibold text-slate-800 hover:text-violet-700 transition-colors line-clamp-1 leading-snug">
              {job.title}
            </Link>
            <p className="text-xs text-slate-400 mt-0.5">{job.category}</p>
          </div>
        </div>
        <span className={status.cls}>{status.label}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{job.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.urgency === 'high' && (
          <span className="badge badge-red gap-1"><Zap size={10} /> Urgent</span>
        )}
        {job.requiredSkills?.slice(0, 3).map(s => (
          <span key={s} className="badge-violet text-xs">{s}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-bold text-emerald-600">
            <IndianRupee size={14} />{job.budget}
          </span>
          {job.location?.city && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={11} />{job.location.city}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} />{timeAgo(job.createdAt)}
          </span>
        </div>
        {actionButton || (
          <Link to={`/jobs/${job._id}`}
            className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors group/link">
            Details <ArrowRight size={12} className="group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      {showCustomer && job.customer && (
        <p className="mt-3 text-xs text-slate-400">
          By <span className="font-medium text-slate-600">{job.customer.name}</span>
        </p>
      )}
    </div>
  );
}
