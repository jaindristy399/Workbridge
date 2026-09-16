import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle, FileText, BadgeCheck } from 'lucide-react';

const STATUS_UI = {
  none:     null,
  pending:  { icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200',  label: 'Pending Review',       desc: 'Your documents are under review. We\'ll notify you once approved.' },
  verified: { icon: BadgeCheck,   color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-200',   label: 'Account Verified ✔',   desc: 'Your identity has been verified by WorkBridge.' },
  rejected: { icon: XCircle,      color: 'text-rose-600',   bg: 'bg-rose-50   border-rose-200',   label: 'Verification Rejected', desc: 'Your documents were not accepted. Please re-submit.' },
};

export default function VerificationPage() {
  const { user } = useAuth();
  const [status, setStatus]       = useState(null);
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({ phone: '', experience: '' });
  const [idFile, setIdFile]       = useState(null);
  const [workFile, setWorkFile]   = useState(null);

  useEffect(() => {
    api.get('/verification/status')
      .then(r => {
        setStatus(r.data.verificationStatus);
        setNote(r.data.verificationNote || '');
        setForm({ phone: r.data.phone || '', experience: r.data.experience || '' });
      })
      .catch(() => setStatus('none'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!idFile) return setError('Please upload your ID proof document.');
    if (user?.role === 'provider' && !workFile) return setError('Providers must upload a work proof document.');

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('idProof',   idFile);
      if (workFile) fd.append('workProof', workFile);
      fd.append('phone',      form.phone);
      fd.append('experience', form.experience);

      await api.post('/verification/submit', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('pending');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page flex justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
    </div>
  );

  const ui = STATUS_UI[status];

  return (
    <div className="page animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white shadow-md">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ID Verification</h1>
          <p className="text-slate-500 text-sm">Get verified to build trust with clients</p>
        </div>
      </div>

      {/* Current status banner */}
      {ui && (
        <div className={`flex items-start gap-3 border rounded-2xl px-4 py-3.5 mb-6 ${ui.bg}`}>
          <ui.icon size={18} className={`${ui.color} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`font-semibold text-sm ${ui.color}`}>{ui.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{ui.desc}</p>
            {status === 'rejected' && note && (
              <p className="text-xs text-rose-500 mt-1 font-mono bg-rose-100 px-2 py-1 rounded-lg">Reason: {note}</p>
            )}
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3.5 mb-6">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <p className="text-sm text-emerald-700 font-medium">Documents submitted! Admin will review shortly.</p>
        </div>
      )}

      {/* Show form if not pending/verified */}
      {(status === 'none' || status === 'rejected') && !success && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <FileText size={16} className="text-violet-500" />
            {status === 'rejected' ? 'Re-submit Documents' : 'Submit for Verification'}
          </h2>

          {/* Phone */}
          <div>
            <label className="input-label">Phone Number</label>
            <input className="input" placeholder="+91 98765 43210" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>

          {/* Experience — providers only */}
          {user?.role === 'provider' && (
            <div>
              <label className="input-label">Years of Experience</label>
              <input className="input" placeholder="e.g. 5 years in plumbing" value={form.experience}
                onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} required />
            </div>
          )}

          {/* ID Proof */}
          <div>
            <label className="input-label">ID Proof <span className="text-slate-400 font-normal">(Aadhaar / PAN / Driving License)</span></label>
            <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-all ${
              idFile ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
            }`}>
              <Upload size={18} className={idFile ? 'text-violet-500' : 'text-slate-400'} />
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {idFile ? idFile.name : 'Click to upload'}
                </p>
                <p className="text-xs text-slate-400">JPG, PNG or PDF · Max 5MB</p>
              </div>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                onChange={e => setIdFile(e.target.files[0] || null)} />
            </label>
          </div>

          {/* Work Proof — providers only */}
          {user?.role === 'provider' && (
            <div>
              <label className="input-label">Work Proof <span className="text-slate-400 font-normal">(Certificate / Portfolio / Prior work)</span></label>
              <label className={`flex items-center gap-3 border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-all ${
                workFile ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50'
              }`}>
                <Upload size={18} className={workFile ? 'text-violet-500' : 'text-slate-400'} />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {workFile ? workFile.name : 'Click to upload'}
                  </p>
                  <p className="text-xs text-slate-400">JPG, PNG or PDF · Max 5MB</p>
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                  onChange={e => setWorkFile(e.target.files[0] || null)} />
              </label>
            </div>
          )}

          {error && (
            <p className="text-rose-500 text-sm bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={submitting}
            className="btn-primary w-full justify-center btn-lg">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              <span className="flex items-center gap-2"><ShieldCheck size={15} /> Submit for Verification</span>
            )}
          </button>
        </form>
      )}

      {/* Verified state — nothing to do */}
      {status === 'verified' && (
        <div className="card text-center py-10">
          <BadgeCheck size={48} className="text-blue-500 mx-auto mb-3" />
          <p className="font-bold text-slate-800 text-lg">You're Verified!</p>
          <p className="text-slate-500 text-sm mt-1">Your WorkBridge verified badge is now visible to clients.</p>
        </div>
      )}
    </div>
  );
}
