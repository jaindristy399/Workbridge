import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import BidCard from '../components/BidCard';
import ProviderCard from '../components/ProviderCard';
import StarRating from '../components/StarRating';
import { ArrowLeft, MapPin, IndianRupee, Clock, Users, CheckCircle2, MessageSquare, CreditCard, Sparkles, Zap, ClipboardList } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

const STATUS_STYLES = {
  open:        { badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500'    },
  in_progress: { badge: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500'   },
  completed:   { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled:   { badge: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500'    },
};

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidForm, setBidForm] = useState({ amount: '', message: '', estimatedDays: 1 });
  const [bidding, setBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [hasBid, setHasBid] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [reviewed, setReviewed] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'failed'
  const [payHistory, setPayHistory] = useState([]);

  const fetchData = async () => {
    try {
      const [jobRes, bidsRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/bids/job/${id}`)
      ]);
      setJob(jobRes.data);
      setBids(bidsRes.data);
      if (user.role === 'provider') {
        setHasBid(bidsRes.data.some(b => b.provider?._id === user._id));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchPaymentHistory = async () => {
    try {
      const { data } = await api.get('/payments/history');
      setPayHistory(data.filter(t => t.jobId?._id === id || t.jobId === id));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchData();
    if (user.role === 'customer') fetchPaymentHistory();
  }, [id]);

  const placeBid = async (e) => {
    e.preventDefault();
    setBidError('');
    setBidding(true);
    try {
      await api.post('/bids', { jobId: id, ...bidForm, amount: Number(bidForm.amount) });
      setHasBid(true);
      fetchData();
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to place bid');
    } finally { setBidding(false); }
  };

  const acceptBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/accept`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const rejectBid = async (bidId) => {
    try {
      await api.put(`/bids/${bidId}/reject`);
      fetchData();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const markCompleted = async () => {
    try {
      await api.put(`/jobs/${id}/status`, { status: 'completed' });
      fetchData();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const submitReview = async () => {
    try {
      const revieweeId = user.role === 'customer' ? job.assignedProvider?._id : job.customer?._id;
      await api.post('/reviews', { jobId: id, revieweeId, ...review });
      setReviewed(true);
    } catch (err) { alert(err.response?.data?.message); }
  };

  // Called by PaymentModal after Razorpay verifies the payment
  const handlePayVerified = (newTx) => {
    setTransaction(newTx);
    setPaymentStatus('success');
    setShowPayModal(false);
    fetchPaymentHistory();
  };

  if (loading) return (
    <div className="page flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
    </div>
  );
  if (!job) return (
    <div className="page text-center py-20 text-slate-500">Job not found</div>
  );

  const isCustomer = user.role === 'customer' && job.customer?._id === user._id;
  const isAssignedProvider = user.role === 'provider' && job.assignedProvider?._id === user._id;
  const statusStyle = STATUS_STYLES[job.status] || STATUS_STYLES.open;

  return (
    <div className="page animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 transition-colors mb-6">
        <ArrowLeft size={15} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job header card */}
          <div className="card">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{job.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {job.status?.replace('_', ' ')}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="badge-violet">{job.category}</span>
              {job.urgency === 'high' && <span className="bg-rose-100 text-rose-700 badge">🔥 Urgent</span>}
              <span className="badge-gray">{job.hiringMode === 'direct' ? '⚡ Direct Hire' : '📋 Open Bidding'}</span>
            </div>

            <p className="text-slate-600 leading-relaxed mb-6">{job.description}</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-100">
              <div className="text-center">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <IndianRupee size={16} className="text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-slate-900">₹{job.budget}</p>
                <p className="text-xs text-slate-400">Budget</p>
                {job.suggestedBudgetMin && (
                  <p className="text-xs text-slate-400 mt-0.5">Est. ₹{job.suggestedBudgetMin}–₹{job.suggestedBudgetMax}</p>
                )}
              </div>
              <div className="text-center">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-2">
                  <MapPin size={16} className="text-violet-600" />
                </div>
                <p className="text-xl font-bold text-slate-900">{job.location?.city || '—'}</p>
                <p className="text-xs text-slate-400">Location</p>
              </div>
              <div className="text-center">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <Users size={16} className="text-blue-600" />
                </div>
                <p className="text-xl font-bold text-slate-900">{bids.length}</p>
                <p className="text-xs text-slate-400">Bids</p>
              </div>
            </div>

            {/* Customer actions */}
            {isCustomer && job.status === 'in_progress' && (
              <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3 flex-wrap">
                <button onClick={markCompleted} className="btn-primary gap-2">
                  <CheckCircle2 size={15} /> Mark Completed
                </button>
                <Link to={`/chat/${job.assignedProvider?._id}`} className="btn-secondary gap-2">
                  <MessageSquare size={15} /> Message Provider
                </Link>
                {paymentStatus !== 'success' && (
                  <button onClick={() => setShowPayModal(true)}
                    className="btn-primary gap-2" style={{ background: 'linear-gradient(to right, #10b981, #0d9488)' }}>
                    <CreditCard size={15} /> Pay ₹{job.budget}
                  </button>
                )}
              </div>
            )}

            {paymentStatus === 'success' && transaction && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
                  <CheckCircle2 size={15} className="flex-shrink-0" /> Payment Successful!
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-slate-500">Paid</p>
                    <p className="font-bold text-slate-800">₹{transaction.totalAmount}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-slate-500">Platform fee</p>
                    <p className="font-bold text-slate-800">₹{transaction.commissionAmount}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 text-center">
                    <p className="text-slate-500">Provider earns</p>
                    <p className="font-bold text-emerald-700">₹{transaction.providerEarning}</p>
                  </div>
                </div>
                <p className="text-emerald-600 text-xs mt-2 font-mono truncate">
                  ID: {transaction.razorpayPaymentId}
                </p>
              </div>
            )}

            {/* Review */}
            {job.status === 'completed' && !reviewed && (isCustomer || isAssignedProvider) && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="font-semibold text-slate-800 mb-3">Leave a Review</p>
                <StarRating rating={review.rating} size="lg" interactive onChange={r => setReview(rv => ({ ...rv, rating: r }))} />
                <textarea className="input mt-3 resize-none h-20" placeholder="Share your experience…"
                  value={review.comment} onChange={e => setReview(rv => ({ ...rv, comment: e.target.value }))} />
                <button onClick={submitReview} className="btn-primary mt-3 gap-2">
                  <Sparkles size={14} /> Submit Review
                </button>
              </div>
            )}
            {reviewed && (
              <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
                <CheckCircle2 size={15} /> Review submitted! Thank you.
              </div>
            )}
          </div>

          {/* Bids section — customer view */}
          {isCustomer && job.status === 'open' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={16} className="text-violet-500" />
                <h2 className="section-title">Bids</h2>
                <span className="badge-violet">{bids.length}</span>
              </div>
              {bids.length === 0 ? (
                <div className="card text-center py-12">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users size={24} className="text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700">No bids yet</p>
                  <p className="text-sm text-slate-400 mt-1">Providers are being notified…</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map(bid => (
                    <BidCard key={bid._id} bid={bid} showActions onAccept={acceptBid} onReject={rejectBid} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Provider bid form */}
          {user.role === 'provider' && job.status === 'open' && !hasBid && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <ClipboardList size={18} className="text-violet-500" /> Place Your Bid
              </h2>
              {bidError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-4">
                  ⚠ {bidError}
                </div>
              )}
              <form onSubmit={placeBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Your Bid (₹)</label>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" className="input pl-9" placeholder="Amount" min="1"
                        value={bidForm.amount} onChange={e => setBidForm({ ...bidForm, amount: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Est. Days</label>
                    <div className="relative">
                      <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" className="input pl-9" placeholder="Days" min="1"
                        value={bidForm.estimatedDays} onChange={e => setBidForm({ ...bidForm, estimatedDays: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="input-label">Message</label>
                  <textarea className="input resize-none h-24" placeholder="Explain why you're the best fit for this job…"
                    value={bidForm.message} onChange={e => setBidForm({ ...bidForm, message: e.target.value })} required />
                </div>
                <button type="submit" disabled={bidding} className="btn-primary w-full justify-center gap-2 shadow-glow">
                  {bidding
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing…</>
                    : <><ClipboardList size={15} /> Submit Bid</>}
                </button>
              </form>
            </div>
          )}

          {hasBid && user.role === 'provider' && (
            <div className="card bg-violet-50 border-violet-100 text-center py-8">
              <CheckCircle2 size={28} className="text-violet-500 mx-auto mb-3" />
              <p className="font-semibold text-violet-700">Your bid has been placed</p>
              <p className="text-sm text-violet-500 mt-1">Waiting for the customer's response.</p>
            </div>
          )}

          {/* Payment History */}
          {isCustomer && payHistory.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <CreditCard size={16} className="text-violet-500" /> Payment History
              </h2>
              <div className="space-y-2">
                {payHistory.map(tx => (
                  <div key={tx._id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 text-sm">
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold mr-2 ${
                        tx.paymentStatus === 'success' ? 'bg-emerald-100 text-emerald-700'
                        : tx.paymentStatus === 'failed' ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.paymentStatus === 'success' ? '✓' : tx.paymentStatus === 'failed' ? '✗' : '…'} {tx.paymentStatus}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">{tx.razorpayPaymentId || '—'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">₹{tx.totalAmount}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Posted by */}
          {job.customer && (
            <div className="card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Posted by</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {job.customer.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{job.customer.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {job.customer.location?.city || '—'}
                  </p>
                </div>
              </div>
              {user.role === 'provider' && (
                <Link to={`/chat/${job.customer._id}`}
                  className="btn-secondary w-full text-sm mt-4 justify-center gap-2">
                  <MessageSquare size={14} /> Message Customer
                </Link>
              )}
            </div>
          )}

          {/* Assigned provider */}
          {job.assignedProvider && (
            <div className="card">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assigned Provider</p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {job.assignedProvider.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{job.assignedProvider.name}</p>
                  <div className="mt-0.5">
                    <StarRating rating={job.assignedProvider.averageRating} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI matched providers */}
          {job.matchedProviders?.length > 0 && job.status === 'open' && isCustomer && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-violet-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Matches</p>
              </div>
              <div className="space-y-3">
                {job.matchedProviders.map(p => (
                  <ProviderCard key={p._id} provider={p} showHire={job.hiringMode === 'direct'}
                    onHire={async (pid) => {
                      await api.put(`/jobs/${id}/assign`, { providerId: pid });
                      fetchData();
                    }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {showPayModal && (
        <PaymentModal
          amount={job.budget}
          jobTitle={job.title}
          jobId={id}
          providerId={job.assignedProvider?._id}
          userName={user.name}
          userEmail={user.email}
          onVerified={handlePayVerified}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </div>
  );
}
