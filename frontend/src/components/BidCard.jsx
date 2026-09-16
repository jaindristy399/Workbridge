import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, MessageSquare, Clock, IndianRupee } from 'lucide-react';
import StarRating from './StarRating';

const STATUS_CONFIG = {
  pending:  { cls: 'badge-yellow', label: 'Pending' },
  accepted: { cls: 'badge-green',  label: 'Accepted' },
  rejected: { cls: 'badge-red',    label: 'Rejected' },
};

const BORDER = {
  pending:  'border-l-amber-400',
  accepted: 'border-l-emerald-400',
  rejected: 'border-l-rose-300',
};

export default function BidCard({ bid, onAccept, onReject, showActions = false }) {
  const { provider } = bid;
  const st = STATUS_CONFIG[bid.status] || { cls: 'badge-gray', label: bid.status };
  const border = BORDER[bid.status] || 'border-l-slate-200';

  return (
    <div className={`card border-l-4 ${border} hover:shadow-card-md transition-all duration-200`}>
      <div className="flex items-start justify-between gap-4">
        {/* Provider info */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {provider?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/providers/${provider?._id}`}
                className="font-semibold text-slate-800 hover:text-violet-700 transition-colors text-sm">
                {provider?.name}
              </Link>
              {provider?.isTopRated && (
                <span className="badge bg-amber-100 text-amber-700 text-[10px]">⭐ Top</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StarRating rating={provider?.averageRating} size="xs" />
              <span className="text-xs text-slate-500">{provider?.averageRating?.toFixed(1)}</span>
              <span className="text-xs text-slate-400">· Trust {provider?.trustScore}</span>
            </div>
          </div>
        </div>

        {/* Price & status */}
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold text-emerald-600 flex items-center gap-0.5 justify-end">
            <IndianRupee size={16} />{bid.amount}
          </p>
          <div className="flex items-center gap-1 justify-end mt-0.5 text-xs text-slate-400">
            <Clock size={10} /> {bid.estimatedDays}d
          </div>
          <div className="mt-1.5"><span className={st.cls}>{st.label}</span></div>
        </div>
      </div>

      {/* Message */}
      <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
        <p className="text-sm text-slate-600 italic leading-relaxed">"{bid.message}"</p>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {provider?.skills?.slice(0, 3).map(s => (
          <span key={s} className="badge-violet text-xs">{s}</span>
        ))}
      </div>

      {/* Actions */}
      {showActions && bid.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => onAccept(bid._id)}
            className="btn-primary btn-sm flex-1 gap-1.5">
            <Check size={14} /> Accept Bid
          </button>
          <button onClick={() => onReject(bid._id)}
            className="btn-danger btn-sm flex-1 gap-1.5">
            <X size={14} /> Reject
          </button>
          <Link to={`/chat/${provider?._id}`}
            className="btn-secondary btn-sm px-3 flex items-center justify-center">
            <MessageSquare size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
