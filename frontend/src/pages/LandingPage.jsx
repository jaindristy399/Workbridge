import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, ShieldCheck, Zap, Star, MapPin,
  ArrowRight, CheckCircle2, Lock, ChevronRight,
  Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { value: '10K+',  label: 'Jobs Posted' },
  { value: '5K+',   label: 'Verified Providers' },
  { value: '98%',   label: 'Satisfaction Rate' },
  { value: '₹2Cr+', label: 'Earned by Providers' },
];

const FEATURES = [
  { icon: Zap,         title: 'AI-Powered Matching',  desc: 'Smart algorithm matches you with the best providers instantly.' },
  { icon: ShieldCheck, title: 'Verified Profiles',    desc: 'Every provider is ID-verified and admin-approved before listing.' },
  { icon: MapPin,      title: 'Nearby First',         desc: 'Find trusted local professionals within your radius.' },
  { icon: Star,        title: 'Rated & Reviewed',     desc: 'Transparent ratings ensure you always get quality service.' },
];

// ── Per-role config ───────────────────────────────────────────────────────────
const ROLES = [
  {
    key: 'customer',
    icon: Users,
    gradient: 'from-violet-600 to-indigo-600',
    glow: 'hover:shadow-violet-500/20',
    border: 'border-violet-500/20',
    activeBorder: 'border-violet-500/50',
    tag: 'bg-violet-500/20 text-violet-300',
    label: 'Customer',
    tagline: 'Find services easily',
    desc: 'Hire verified local professionals for any job — plumbing, tutoring, cleaning, IT and more.',
    perks: ['Post a job in 60 seconds', 'AI-matched top providers', 'Pay securely via Razorpay'],
    allowSignup: true,
    signupRole: 'customer',
  },
  {
    key: 'provider',
    icon: Briefcase,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'hover:shadow-emerald-500/20',
    border: 'border-emerald-500/20',
    activeBorder: 'border-emerald-500/50',
    tag: 'bg-emerald-500/20 text-emerald-300',
    label: 'Provider',
    tagline: 'Earn by offering services',
    desc: 'Showcase your skills, bid on local jobs, and build a trusted reputation with verified reviews.',
    perks: ['Appear in AI recommendations', 'Real-time job notifications', 'Get paid via Razorpay'],
    allowSignup: true,
    signupRole: 'provider',
  },
  {
    key: 'admin',
    icon: ShieldCheck,
    gradient: 'from-slate-600 to-slate-800',
    glow: 'hover:shadow-slate-500/20',
    border: 'border-slate-500/20',
    activeBorder: 'border-slate-500/40',
    tag: 'bg-slate-500/20 text-slate-300',
    label: 'Admin',
    tagline: 'Platform management',
    desc: 'Oversee the entire platform — verify users, manage jobs, monitor revenue and activity.',
    perks: ['Verify provider identities', 'View revenue dashboard', 'Manage all users & jobs'],
    allowSignup: false,
    signupRole: null,
  },
];

// ── Auth form embedded in each role card ─────────────────────────────────────
function RoleAuthCard({ role }) {
  const { login, signup, logout } = useAuth();
  const Icon = role.icon;

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: role.key === 'admin' ? 'admin@workbridge.com' : '',
    password: '',
    skills: '',
  });

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const loggedIn = await login(form.email.trim(), form.password);
        // Role mismatch — undo and show error
        if (loggedIn.role !== role.key) {
          logout();
          setError(`This account is a ${loggedIn.role} account. Please use the correct section.`);
          return;
        }
        // ✅ No navigate() — App.jsx redirects directly once setUser() commits
      } else {
        if (!form.name.trim()) { setError('Name is required.'); return; }
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: role.signupRole,
        };
        if (role.key === 'provider' && form.skills.trim()) {
          payload.skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);
        }
        await signup(payload);
        // ✅ No navigate() — App.jsx redirects directly once setUser() commits
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white
    placeholder:text-slate-500 focus:outline-none focus:border-white/30 focus:bg-white/8
    transition-all duration-150`;

  return (
    <div className={`relative bg-white/[0.04] border ${role.border} rounded-3xl p-6 flex flex-col gap-4
      transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${role.glow} overflow-hidden`}>

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-[0.04] pointer-events-none rounded-3xl`} />

      {/* Header */}
      <div className="relative flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${role.tag}`}>
            {role.label}
          </span>
          <h3 className="text-base font-bold text-white mt-1">{role.tagline}</h3>
          <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{role.desc}</p>
        </div>
      </div>

      {/* Perks */}
      <ul className="relative space-y-1.5">
        {role.perks.map(p => (
          <li key={p} className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" /> {p}
          </li>
        ))}
      </ul>

      {/* Divider */}
      <div className="relative h-px bg-white/8" />

      {/* Tab toggle (login / signup) */}
      {role.allowSignup && (
        <div className="relative flex rounded-xl bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-[10px] transition-all duration-200
              ${mode === 'login' ? `bg-gradient-to-r ${role.gradient} text-white shadow` : 'text-slate-400 hover:text-white'}`}>
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 text-xs font-semibold py-1.5 rounded-[10px] transition-all duration-200
              ${mode === 'signup' ? `bg-gradient-to-r ${role.gradient} text-white shadow` : 'text-slate-400 hover:text-white'}`}>
            Sign Up
          </button>
        </div>
      )}

      {/* Admin label (no toggle needed) */}
      {!role.allowSignup && (
        <div className="relative flex items-center gap-1.5 text-xs text-slate-400">
          <Lock size={11} className="text-slate-500" />
          Admin login only · No public registration
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} autoComplete="off" className="relative flex flex-col gap-2.5">
        {/* Dummy fields — trap browser autofill so visible inputs stay empty */}
        <input type="text" style={{ display: 'none' }} readOnly tabIndex={-1} />
        <input type="password" style={{ display: 'none' }} readOnly tabIndex={-1} />
        {/* Name — signup only */}
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={set('name')}
            required
            autoComplete="off"
            className={inputCls}
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={set('email')}
          required
          autoComplete="off"
          className={inputCls}
        />

        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Password"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="off"
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Skills — provider signup only */}
        {role.key === 'provider' && mode === 'signup' && (
          <input
            type="text"
            placeholder="Skills (e.g. Plumbing, Tutoring) — optional"
            value={form.skills}
            onChange={set('skills')}
            autoComplete="off"
            className={inputCls}
          />
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            <AlertCircle size={13} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-300 leading-snug">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${role.gradient} text-white font-semibold text-sm
            hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2
            disabled:opacity-60 disabled:cursor-not-allowed`}>
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
            : mode === 'login'
              ? role.key === 'admin' ? <><Lock size={13} /> Admin Sign In</> : <>Sign In as {role.label} <ArrowRight size={13} /></>
              : <>Create {role.label} Account <ArrowRight size={13} /></>
          }
        </button>
      </form>
    </div>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  const scrollToRoles = () => {
    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-md bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              Work<span className="text-violet-400">Bridge</span>
            </span>
          </div>
          <button
            onClick={scrollToRoles}
            className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-xl">
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-10 w-64 h-64 bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <Zap size={11} /> AI-Powered Gig Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            Smart. Trusted.{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Local Gig Marketplace
            </span>
            <br />Powered by AI
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Connect verified local professionals with customers who need them — instantly, securely, and transparently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <button
              onClick={scrollToRoles}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-violet-900/40 hover:shadow-violet-700/40 active:scale-95">
              Start for Free <ArrowRight size={16} />
            </button>
            <button
              onClick={scrollToRoles}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-2xl transition-all">
              Sign In <ChevronRight size={16} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/[0.08] rounded-2xl px-4 py-3 text-center">
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Auth Cards ───────────────────────────────────────────────────── */}
      <section id="get-started" className="py-16 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2">Choose Your Role</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">One platform, three ways to participate</h2>
            <p className="text-slate-400 mt-3 text-base max-w-xl mx-auto">
              Select your role and sign in or create an account — right here, no extra pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {ROLES.map(role => (
              <RoleAuthCard key={role.key} role={role} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why WorkBridge?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-all">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-violet-400" />
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 rounded-3xl px-8 py-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-slate-400 text-sm mb-7">Join thousands of customers and providers already using WorkBridge.</p>
            <button
              onClick={scrollToRoles}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-violet-900/40 active:scale-95">
              Create Free Account <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-5 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">W</span>
          </div>
          <span className="font-semibold text-slate-500">WorkBridge</span>
        </div>
        <p>© 2025 WorkBridge · Smart. Trusted. Local.</p>
      </footer>
    </div>
  );
}
