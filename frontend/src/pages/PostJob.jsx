import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ProviderCard from '../components/ProviderCard';
import { Mic, MicOff, Sparkles, IndianRupee, MapPin, Zap, Briefcase, CheckCircle2, ChevronRight } from 'lucide-react';

const CITY_COORDS = {
  // USA
  'New York': { lat: 40.7128, lng: -74.006 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Phoenix': { lat: 33.4484, lng: -112.074 },
  'Philadelphia': { lat: 39.9526, lng: -75.1652 },
  'San Antonio': { lat: 29.4241, lng: -98.4936 },
  'Dallas': { lat: 32.7767, lng: -96.797 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Denver': { lat: 39.7392, lng: -104.9903 },
  'Austin': { lat: 30.2672, lng: -97.7431 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  // India — Major Cities
  'Mumbai': { lat: 19.076, lng: 72.8777 },
  'Delhi': { lat: 28.6139, lng: 77.209 },
  'New Delhi': { lat: 28.6139, lng: 77.209 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.385, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Kanpur': { lat: 26.4499, lng: 80.3319 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Thane': { lat: 19.2183, lng: 72.9781 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 },
  'Ghaziabad': { lat: 28.6692, lng: 77.4538 },
  'Ludhiana': { lat: 30.901, lng: 75.8573 },
  'Agra': { lat: 27.1767, lng: 78.0081 },
  'Nashik': { lat: 19.9975, lng: 73.7898 },
  'Faridabad': { lat: 28.4089, lng: 77.3178 },
  'Meerut': { lat: 28.9845, lng: 77.7064 },
  'Rajkot': { lat: 22.3039, lng: 70.8022 },
  'Varanasi': { lat: 25.3176, lng: 82.9739 },
  'Srinagar': { lat: 34.0837, lng: 74.7973 },
  'Amritsar': { lat: 31.634, lng: 74.8723 },
  'Allahabad': { lat: 25.4358, lng: 81.8463 },
  'Prayagraj': { lat: 25.4358, lng: 81.8463 },
  'Howrah': { lat: 22.5958, lng: 88.2636 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Jabalpur': { lat: 23.1815, lng: 79.9864 },
  'Gwalior': { lat: 26.2183, lng: 78.1828 },
  'Vijayawada': { lat: 16.5062, lng: 80.648 },
  'Jodhpur': { lat: 26.2389, lng: 73.0243 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Raipur': { lat: 21.2514, lng: 81.6296 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 },
  'Guwahati': { lat: 26.1445, lng: 91.7362 },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Dehradun': { lat: 30.3165, lng: 78.0322 },
  'Noida': { lat: 28.5355, lng: 77.391 },
  'Gurugram': { lat: 28.4595, lng: 77.0266 },
  'Gurgaon': { lat: 28.4595, lng: 77.0266 },
  'Navi Mumbai': { lat: 19.033, lng: 73.0297 },
  'Mysore': { lat: 12.2958, lng: 76.6394 },
  'Mysuru': { lat: 12.2958, lng: 76.6394 },
  'Aurangabad': { lat: 19.8762, lng: 75.3433 },
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'Ranchi': { lat: 23.3441, lng: 85.3096 },
  'Mangalore': { lat: 12.9141, lng: 74.856 },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'Hubli': { lat: 15.3647, lng: 75.124 },
  'Tiruppur': { lat: 11.1085, lng: 77.3411 },
  'Shimla': { lat: 31.1048, lng: 77.1734 },
  'Jammu': { lat: 32.7266, lng: 74.857 },
  'Udaipur': { lat: 24.5854, lng: 73.7125 },
  'Jamshedpur': { lat: 22.8046, lng: 86.2029 },
  'Dhanbad': { lat: 23.7957, lng: 86.4304 },
  // India — States (capital used as coordinates)
  'Andhra Pradesh': { lat: 15.9129, lng: 79.74 },
  'Arunachal Pradesh': { lat: 28.2180, lng: 94.7278 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
  'Bihar': { lat: 25.0961, lng: 85.3131 },
  'Chhattisgarh': { lat: 21.2787, lng: 81.8661 },
  'Goa': { lat: 15.2993, lng: 74.124 },
  'Gujarat': { lat: 22.2587, lng: 71.1924 },
  'Haryana': { lat: 29.0588, lng: 76.0856 },
  'Himachal Pradesh': { lat: 31.1048, lng: 77.1734 },
  'Jharkhand': { lat: 23.6102, lng: 85.2799 },
  'Karnataka': { lat: 15.3173, lng: 75.7139 },
  'Kerala': { lat: 10.8505, lng: 76.2711 },
  'Madhya Pradesh': { lat: 22.9734, lng: 78.6569 },
  'Maharashtra': { lat: 19.7515, lng: 75.7139 },
  'Manipur': { lat: 24.6637, lng: 93.9063 },
  'Meghalaya': { lat: 25.467, lng: 91.3662 },
  'Mizoram': { lat: 23.1645, lng: 92.9376 },
  'Nagaland': { lat: 26.1584, lng: 94.5624 },
  'Odisha': { lat: 20.9517, lng: 85.0985 },
  'Punjab': { lat: 31.1471, lng: 75.3412 },
  'Rajasthan': { lat: 27.0238, lng: 74.2179 },
  'Sikkim': { lat: 27.533, lng: 88.5122 },
  'Tamil Nadu': { lat: 11.1271, lng: 78.6569 },
  'Telangana': { lat: 18.1124, lng: 79.0193 },
  'Tripura': { lat: 23.9408, lng: 91.9882 },
  'Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Uttarakhand': { lat: 30.0668, lng: 79.0193 },
  'West Bengal': { lat: 22.9868, lng: 87.855 },
};

const CITY_SUGGESTIONS = Object.keys(CITY_COORDS);

const getCityLocation = (cityName) => {
  const trimmed = cityName.trim();
  const match = Object.entries(CITY_COORDS).find(
    ([k]) => k.toLowerCase() === trimmed.toLowerCase()
  );
  return match
    ? { city: match[0], lat: match[1].lat, lng: match[1].lng }
    : { city: trimmed, lat: 0, lng: 0 };
};

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', budget: '', city: '', hiringMode: 'bidding', urgency: 'medium' });
  const [aiResult, setAiResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!form.title || !form.description || form.description.length < 15) { setAiResult(null); return; }
    const t = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const { data } = await api.post('/jobs/analyze', { title: form.title, description: form.description });
        setAiResult(data);
        if (!form.budget) setForm(f => ({ ...f, budget: data.priceRange.min.toString() }));
      } catch { } finally { setAnalyzing(false); }
    }, 800);
    return () => clearTimeout(t);
  }, [form.title, form.description]);

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { alert('Voice input not supported. Try Chrome.'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setForm(f => ({ ...f, description: f.description + ' ' + t }));
    };
    rec.onend = () => setListening(false);
    rec.start(); recognitionRef.current = rec; setListening(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const location = getCityLocation(form.city);
      const { data } = await api.post('/jobs', { title: form.title, description: form.description, budget: Number(form.budget), location, hiringMode: form.hiringMode, urgency: form.urgency });
      setSuccess(data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to post job.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="page-sm">
        <div className="card text-center py-12 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Job Posted!</h2>
          <p className="text-slate-500 mb-1">Your job is live. Providers are being notified.</p>
          <div className="flex items-center justify-center gap-2 mt-1 mb-7">
            <span className="badge-violet">{success.job?.category}</span>
            <span className="text-emerald-600 font-bold">₹{success.job?.budget}</span>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(`/jobs/${success.job._id}`)} className="btn-primary gap-2">View Job <ChevronRight size={15} /></button>
            <button onClick={() => { setSuccess(null); setForm({ title:'', description:'', budget:'', city:'', hiringMode:'bidding', urgency:'medium' }); setAiResult(null); }}
              className="btn-secondary">Post Another</button>
          </div>
        </div>

        {success.matches?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-violet-500" />
              <h3 className="section-title">AI Matched Top Providers</h3>
            </div>
            <p className="section-subtitle mb-4">Ranked by skill match, ratings & proximity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {success.matches.map(m => (
                <ProviderCard key={m.provider._id} provider={m.provider}
                  showHire={success.job.hiringMode === 'direct'}
                  onHire={async (pid) => {
                    await api.put(`/jobs/${success.job._id}/assign`, { providerId: pid });
                    navigate(`/jobs/${success.job._id}`);
                  }} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-sm">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase size={20} className="text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">Post a New Job</h1>
        </div>
        <p className="text-slate-500 text-sm ml-7">AI will auto-detect the category and suggest a fair price range</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm mb-5">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Job details card */}
        <div className="card space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">1</span>
            Job Details
          </h3>

          <div>
            <label className="input-label">Job Title</label>
            <input className="input" placeholder="e.g. Fix leaking kitchen pipe, Math tutoring for Grade 10…"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="input-label mb-0">Description</label>
              <button type="button" onClick={toggleVoice}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  listening
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'
                }`}>
                {listening ? <MicOff size={12} /> : <Mic size={12} />}
                {listening ? 'Stop' : 'Voice Input'}
              </button>
            </div>
            <textarea className="input resize-none h-28" placeholder="Describe the job in detail — what needs to be done, any special requirements…"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required minLength={15} />
          </div>

          {/* AI analysis */}
          {analyzing && (
            <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-violet-700 font-medium">AI is analyzing your job description…</p>
            </div>
          )}
          {aiResult && !analyzing && (
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-violet-500" />
                <p className="text-sm font-semibold text-violet-700">AI Analysis</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Category</p>
                  <p className="font-bold text-slate-800">{aiResult.category}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Suggested Price</p>
                  <p className="font-bold text-emerald-600">₹{aiResult.priceRange.min} – ₹{aiResult.priceRange.max}</p>
                </div>
              </div>
              {aiResult.requiredSkills?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {aiResult.requiredSkills.map(s => <span key={s} className="badge-violet text-xs">{s}</span>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget & Location */}
        <div className="card space-y-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">2</span>
            Budget & Location
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Your Budget (₹)</label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" className="input pl-9" placeholder="100" min="1"
                  value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required />
              </div>
              {aiResult && <p className="text-xs text-slate-400 mt-1">AI suggest: ₹{aiResult.priceRange.min}–₹{aiResult.priceRange.max}</p>}
            </div>
            <div>
              <label className="input-label">City / Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="e.g. Mumbai, Delhi, New York…"
                  list="city-suggestions"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  required
                />
                <datalist id="city-suggestions">
                  {CITY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Hiring Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ val: 'bidding', label: '📋 Bidding' }, { val: 'direct', label: '⚡ Direct' }].map(m => (
                  <button key={m.val} type="button" onClick={() => setForm({ ...form, hiringMode: m.val })}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 ${
                      form.hiringMode === m.val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-300'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="input-label">Urgency</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[{ val: 'low', label: 'Low' }, { val: 'medium', label: 'Med' }, { val: 'high', label: '🔥 High' }].map(u => (
                  <button key={u.val} type="button" onClick={() => setForm({ ...form, urgency: u.val })}
                    className={`px-2 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 ${
                      form.urgency === u.val ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-300'
                    }`}>
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full btn-lg justify-center gap-2 shadow-glow">
          {loading
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Posting…</>
            : <><Sparkles size={17} /> Post Job & Match Providers</>
          }
        </button>
      </form>
    </div>
  );
}
