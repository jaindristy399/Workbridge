import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shield, CheckCircle, MessageSquare, Crown, BadgeCheck, Clock, XCircle } from 'lucide-react';
import StarRating from './StarRating';

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-cyan-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-green-600',
];

export default function ProviderCard({ provider, onHire, showHire = false }) {
  const grad = AVATAR_GRADIENTS[(provider.name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
  const trustColor = provider.trustScore >= 80
    ? 'text-emerald-600 bg-emerald-50'
    : provider.trustScore >= 60
    ? 'text-amber-600 bg-amber-50'
    : 'text-rose-600 bg-rose-50';

  return (
    <div className={`card group hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300 ${provider.isPremium ? 'border-amber-200 ring-1 ring-amber-200' : ''}`}>
      {/* Premium banner */}
      {provider.isPremium && (
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-3 -mt-1">
          <Crown size={12} className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">Premium Provider</span>
        </div>
      )}
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm group-hover:shadow-glow-sm transition-all duration-300`}>
          {provider.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/providers/${provider._id}`}
              className="font-semibold text-slate-800 hover:text-violet-700 transition-colors truncate">
              {provider.name}
            </Link>
            {provider.isTopRated && (
              <span className="badge bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] px-2 py-0.5">
                ⭐ Top Rated
              </span>
            )}
            {provider.verificationStatus === 'verified' && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                <BadgeCheck size={11} /> Verified
              </span>
            )}
            {provider.verificationStatus === 'pending' && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                <Clock size={11} /> Pending
              </span>
            )}
            {provider.verificationStatus === 'rejected' && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md">
                <XCircle size={11} /> Rejected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <StarRating rating={provider.averageRating} size="xs" />
            <span className="text-xs font-semibold text-slate-700">{provider.averageRating?.toFixed(1) || '—'}</span>
            <span className="text-xs text-slate-400">({provider.totalReviews || 0})</span>
            {provider.availability
              ? <span className="flex items-center gap-0.5 text-xs text-emerald-600 ml-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> Available</span>
              : <span className="text-xs text-slate-400 ml-1">Unavailable</span>
            }
          </div>
        </div>
      </div>

      {/* Bio */}
      {provider.bio && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{provider.bio}</p>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {provider.skills?.slice(0, 4).map(s => (
          <span key={s} className="badge-violet text-xs">{s}</span>
        ))}
        {(provider.skills?.length || 0) > 4 && (
          <span className="badge-gray text-xs">+{provider.skills.length - 4}</span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl mb-4 text-center">
        <div>
          <p className="text-sm font-bold text-slate-800">₹{provider.hourlyRate}<span className="text-xs font-normal text-slate-400">/hr</span></p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Rate</p>
        </div>
        <div>
          <p className={`text-sm font-bold px-1.5 py-0.5 rounded-lg inline-block ${trustColor}`}>{provider.trustScore}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Trust</p>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{provider.jobsCompleted || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Jobs</p>
        </div>
      </div>

      {provider.location?.city && (
        <p className="flex items-center gap-1 text-xs text-slate-400 mb-4">
          <MapPin size={11} /> {provider.location.city}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link to={`/providers/${provider._id}`} className="btn-secondary btn-sm flex-1 text-center">
          View Profile
        </Link>
        {showHire && onHire && (
          <button onClick={() => onHire(provider._id)} className="btn-primary btn-sm flex-1">
            Hire Now
          </button>
        )}
        <Link to={`/chat/${provider._id}`} className="btn-icon w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-violet-50 hover:text-violet-600 border border-slate-200 transition-all">
          <MessageSquare size={15} />
        </Link>
      </div>
    </div>
  );
}
