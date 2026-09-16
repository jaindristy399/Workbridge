import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { ShieldCheck, CheckCircle2, XCircle, Clock, FileText, Eye, BadgeCheck, Users } from 'lucide-react';

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700',
  verified: 'bg-blue-100  text-blue-700',
  rejected: 'bg-rose-100  text-rose-700',
};

const ROLE_BADGE = {
  provider: 'bg-violet-100 text-violet-700',
  customer: 'bg-blue-100   text-blue-700',
  admin:    'bg-rose-100   text-rose-700',
};

export default function AdminVerification() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter]     = useState('pending');
  const [loading, setLoading]   = useState(true);
  const [rejectModal, setRejectModal] = useState(null); // userId to reject
  const [rejectReason, setRejectReason] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const load = async (f = filter) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/verification/requests?status=${f}`);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const approve = async (userId) => {
    try {
      await api.put(`/verification/${userId}/approve`);
      setActionMsg('User approved and verified ✔');
      setRequests(r => r.filter(u => u._id !== userId));
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed');
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    try {
      await api.put(`/verification/${rejectModal}/reject`, { reason: rejectReason });
      setActionMsg('User rejected');
      setRequests(r => r.filter(u => u._id !== rejectModal));
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Failed');
    }
  };

  const docUrl = (filename) =>
    `${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/${filename}?token=${localStorage.getItem('wb_token')}`;

  const FILTERS = [
    { key: 'pending',  label: 'Pending',  icon: Clock },
    { key: 'verified', label: 'Verified', icon: BadgeCheck },
    { key: 'rejected', label: 'Rejected', icon: XCircle },
  ];

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-md">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Verification Requests</h1>
          <p className="text-slate-500 text-sm">Review and approve user identity documents</p>
        </div>
      </div>

      {/* Action feedback */}
      {actionMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 mb-4 text-sm">
          <CheckCircle2 size={15} /> {actionMsg}
          <button onClick={() => setActionMsg('')} className="ml-auto text-emerald-500 hover:text-emerald-700 text-xs">✕</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl mb-6 w-fit">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === key ? 'bg-white shadow-card text-violet-600' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No {filter} requests</p>
          <p className="text-xs text-slate-400 mt-1">
            {filter === 'pending' ? 'No documents waiting for review.' : `No ${filter} verifications found.`}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['User', 'Role', 'Phone', 'Experience', 'Documents', 'Submitted', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className={`badge text-xs ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span>
                    </td>
                    {/* Phone */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{u.phone || '—'}</td>
                    {/* Experience */}
                    <td className="px-4 py-3.5 text-slate-500 text-xs max-w-[120px] truncate">{u.experience || '—'}</td>
                    {/* Documents */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        {u.verificationDocuments?.idProof && (
                          <a href={docUrl(u.verificationDocuments.idProof)} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                            <FileText size={11} /> ID Proof
                          </a>
                        )}
                        {u.verificationDocuments?.workProof && (
                          <a href={docUrl(u.verificationDocuments.workProof)} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-violet-600 hover:underline">
                            <Eye size={11} /> Work Proof
                          </a>
                        )}
                      </div>
                    </td>
                    {/* Submitted */}
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {u.verificationSubmittedAt ? new Date(u.verificationSubmittedAt).toLocaleDateString() : '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`badge text-xs ${STATUS_BADGE[u.verificationStatus] || 'badge-gray'}`}>
                        {u.verificationStatus}
                      </span>
                      {u.verificationNote && (
                        <p className="text-[10px] text-rose-400 mt-0.5 max-w-[100px] truncate" title={u.verificationNote}>
                          {u.verificationNote}
                        </p>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      {u.verificationStatus === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => approve(u._id)}
                            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all">
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button onClick={() => { setRejectModal(u._id); setRejectReason(''); }}
                            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all">
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                      {u.verificationStatus !== 'pending' && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-bold text-slate-800 text-lg mb-1">Reject Verification</h3>
            <p className="text-slate-500 text-sm mb-4">Provide a reason so the user knows what to fix.</p>
            <textarea className="input resize-none h-24 text-sm" placeholder="e.g. ID document is blurry, please re-upload a clearer photo."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3 mt-4">
              <button onClick={reject}
                className="flex-1 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all">
                Confirm Reject
              </button>
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
