import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Briefcase, MapPin, IndianRupee, CheckCircle2, Shield, Star, Clock, BadgeCheck, XCircle } from 'lucide-react';

export default function ProviderProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/providers/${id}`);
        setData(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="page flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
    </div>
  );
  if (!data) return <div className="page text-center py-20 text-slate-500">Provider not found</div>;

  const { provider, reviews } = data;
  const trustColor = provider.trustScore >= 80 ? 'text-emerald-600' : provider.trustScore >= 60 ? 'text-amber-500' : 'text-rose-500';
  const trustBg    = provider.trustScore >= 80 ? 'bg-emerald-100' : provider.trustScore >= 60 ? 'bg-amber-100'   : 'bg-rose-100';

  return (
    <div className="page animate-fade-in">
      {/* Hero card */}
      <div className="card mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 shadow-glow">
              {provider.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{provider.name}</h1>
                {provider.isTopRated && (
                  <span className="badge bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs">
                    ⭐ Top Rated
                  </span>
                )}
                {provider.verificationStatus === 'verified' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    <BadgeCheck size={13} /> Verified
                  </span>
                )}
                {provider.verificationStatus === 'pending' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    <Clock size={13} /> Pending Verification
                  </span>
                )}
                {provider.verificationStatus === 'rejected' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                    <XCircle size={13} /> Verification Rejected
                  </span>
                )}
                <span className={`badge text-xs ${provider.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${provider.availability ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {provider.availability ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StarRating rating={provider.averageRating} size="lg" />
                <span className="font-semibold text-slate-700">{provider.averageRating?.toFixed(1) || '—'}</span>
                <span className="text-slate-400 text-sm">({provider.totalReviews} reviews)</span>
              </div>
              {provider.bio && <p className="mt-3 text-slate-600 leading-relaxed">{provider.bio}</p>}
              {provider.location?.city && (
                <p className="mt-2 text-sm text-slate-400 flex items-center gap-1">
                  <MapPin size={12} /> {provider.location.city}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-3 flex-wrap">
            <Link to={`/chat/${provider._id}`} className="btn-primary gap-2">
              <MessageSquare size={15} /> Send Message
            </Link>
            {user.role === 'customer' && (
              <Link to="/post-job" className="btn-secondary gap-2">
                <Briefcase size={15} /> Post a Job
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Stats + Skills */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Jobs Completed', value: provider.jobsCompleted || 0, icon: CheckCircle2, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
                { label: 'Trust Score',    value: provider.trustScore,          icon: Shield,       iconBg: trustBg,        iconColor: trustColor },
                { label: 'Hourly Rate',    value: `₹${provider.hourlyRate}/hr`, icon: IndianRupee,   iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
                { label: 'Total Earnings', value: `₹${provider.totalEarnings || 0}`, icon: IndianRupee, iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <s.icon size={13} className={s.iconColor} />
                    </div>
                    <span className="text-sm text-slate-500">{s.label}</span>
                  </div>
                  <span className={`font-bold text-sm ${s.iconColor}`}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {provider.skills?.length > 0
                ? provider.skills.map(s => <span key={s} className="badge-violet text-xs">{s}</span>)
                : <p className="text-sm text-slate-400">No skills listed</p>}
            </div>
          </div>
        </div>

        {/* Right: Reviews */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-amber-400" />
            <h2 className="section-title">Reviews</h2>
            <span className="badge-gray">{reviews.length}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Star size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700">No reviews yet</p>
              <p className="text-sm text-slate-400 mt-1">Be the first to work with this provider</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review._id} className="card hover:shadow-card-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {review.reviewer?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{review.reviewer?.name}</p>
                        {review.job?.title && <p className="text-xs text-slate-400 mt-0.5">{review.job.title}</p>}
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600 italic bg-slate-50 rounded-xl px-4 py-3">
                      "{review.comment}"
                    </p>
                  )}
                  <p className="mt-2.5 text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
