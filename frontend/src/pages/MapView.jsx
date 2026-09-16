import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { io } from 'socket.io-client';
import {
  MapPin, Briefcase, Users, SlidersHorizontal, Navigation,
  X, IndianRupee, Clock, Star, Zap, Search, RefreshCw
} from 'lucide-react';

// ── Leaflet CSS (injected once) ────────────────────────────────────────
let leafletLoaded = false;
const ensureLeaflet = () => new Promise((resolve) => {
  if (leafletLoaded || window.L) { resolve(); return; }
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => { leafletLoaded = true; resolve(); };
  document.head.appendChild(script);
});

// ── City coordinates (fallback when geolocation denied) ───────────────
const CITIES = {
  'New York':      { lat: 40.7128, lng: -74.006  },
  'Los Angeles':   { lat: 34.0522, lng: -118.2437 },
  'Chicago':       { lat: 41.8781, lng: -87.6298  },
  'Houston':       { lat: 29.7604, lng: -95.3698  },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
};

const CATEGORIES = ['All','Plumbing','Electrical','Tutoring','Cleaning','Carpentry','Painting','Moving','Gardening','IT Support','Photography','Cooking','Delivery','Other'];

// ── SVG marker factories ───────────────────────────────────────────────
const makeIcon = (color, emoji) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".3"/></filter>
      <path filter="url(#sh)" d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="${color}"/>
      <circle cx="18" cy="18" r="11" fill="white" opacity=".95"/>
      <text x="18" y="22" text-anchor="middle" font-size="13">₹{emoji}</text>
    </svg>`;
  return window.L.divIcon({
    html: svg,
    className: '',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};

const makeUserIcon = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#6d28d9" stroke="white" stroke-width="3"/>
      <circle cx="11" cy="11" r="3" fill="white"/>
    </svg>`;
  return window.L.divIcon({ html: svg, className: '', iconSize: [22,22], iconAnchor:[11,11] });
};

export default function MapView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const mapRef     = useRef(null);   // leaflet map instance
  const mapElRef   = useRef(null);   // DOM div
  const markersRef = useRef({});     // id → marker
  const socketRef  = useRef(null);

  const [mode, setMode]         = useState(user.role === 'provider' ? 'jobs' : 'providers');
  const [items, setItems]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [userPos, setUserPos]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [geoError, setGeoError] = useState('');
  const [category, setCategory] = useState('All');
  const [radius, setRadius]     = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // ── Init Leaflet ───────────────────────────────────────────────────
  useEffect(() => {
    ensureLeaflet().then(() => {
      if (mapRef.current || !mapElRef.current) return;

      const defaultPos = CITIES[user.location?.city] || CITIES['New York'];

      const map = window.L.map(mapElRef.current, {
        center: [defaultPos.lat, defaultPos.lng],
        zoom: 12,
        zoomControl: false,
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── Get user geolocation ───────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = CITIES[user.location?.city] || CITIES['New York'];
      setUserPos(fallback);
      setGeoError(`Using ${user.location?.city || 'New York'} as your location.`);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pos2 = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(pos2);
        if (mapRef.current) mapRef.current.setView([pos2.lat, pos2.lng], 13);
      },
      () => {
        const fallback = CITIES[user.location?.city] || CITIES['New York'];
        setUserPos(fallback);
        setGeoError(`GPS unavailable — using ${user.location?.city || 'New York'}.`);
      },
      { timeout: 6000 }
    );
  }, [mapReady]);

  // ── Place "you are here" marker ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userPos || !window.L) return;
    window.L.marker([userPos.lat, userPos.lng], { icon: makeUserIcon(), zIndexOffset: 1000 })
      .addTo(mapRef.current)
      .bindTooltip('You', { permanent: true, direction: 'right', className: 'leaflet-you-tooltip' });
    mapRef.current.setView([userPos.lat, userPos.lng], 13);
  }, [userPos]);

  // ── Fetch nearby data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userPos) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ lat: userPos.lat, lng: userPos.lng, radius });
      if (mode === 'jobs' && category !== 'All') params.append('category', category);
      const endpoint = mode === 'jobs' ? `/jobs/nearby?${params}` : `/providers/nearby?${params}`;
      const { data } = await api.get(endpoint);
      setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [userPos, mode, category, radius]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Render markers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    items.forEach(item => {
      const lat = item.location?.lat || 0;
      const lng = item.location?.lng || 0;
      if (!lat && !lng) return;

      const isJob = mode === 'jobs';
      const icon  = isJob
        ? makeIcon('#ef4444', item.urgency === 'high' ? '🔥' : '💼')
        : makeIcon('#3b82f6', item.isPremium ? '⭐' : '👤');

      const marker = window.L.marker([lat, lng], { icon }).addTo(mapRef.current);

      marker.on('click', () => setSelected(item));
      markersRef.current[item._id] = marker;
    });
  }, [items, mode]);

  // ── Socket: live new-job markers ───────────────────────────────────
  useEffect(() => {
    if (!userPos) return;
    const sock = io('http://localhost:5001', { transports: ['websocket', 'polling'] });
    sock.on('connect', () => sock.emit('register', user._id));

    sock.on('new_job', ({ job }) => {
      if (mode !== 'jobs') return;
      const dist = calcDistanceClient(userPos.lat, userPos.lng, job.location?.lat, job.location?.lng);
      if (dist > radius) return;
      const newItem = { ...job, distance: Math.round(dist * 10) / 10 };
      setItems(prev => [newItem, ...prev]);
    });

    socketRef.current = sock;
    return () => sock.disconnect();
  }, [userPos, mode, radius]);

  // client-side Haversine (no import needed)
  const calcDistanceClient = (lat1, lng1, lat2, lng2) => {
    if (!lat1 || !lat2) return 9999;
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  };

  const flyTo = (item) => {
    const lat = item.location?.lat, lng = item.location?.lng;
    if (mapRef.current && lat && lng) mapRef.current.flyTo([lat, lng], 15, { duration: 0.8 });
    setSelected(item);
  };

  const urgencyBadge = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600' };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* ── Top control bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shadow-sm z-10 flex-wrap">

        {/* Mode toggle */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { key:'jobs',      label:'Nearby Jobs',      icon: Briefcase },
            { key:'providers', label:'Nearby Providers', icon: Users     },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setMode(key); setSelected(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === key ? 'bg-white shadow-card text-violet-600' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <Icon size={14} /> {label}
              {!loading && mode === key && (
                <span className="ml-1 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category filter (jobs only) */}
        {mode === 'jobs' && (
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="input py-2 w-36 text-sm appearance-none">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        )}

        {/* Radius */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Radius:</span>
          <select value={radius} onChange={e => setRadius(Number(e.target.value))}
            className="input py-2 w-24 text-sm appearance-none">
            {[5,10,25,50,100].map(r => <option key={r} value={r}>{r} km</option>)}
          </select>
        </div>

        <button onClick={fetchData}
          className={`btn-secondary py-2 px-3 gap-1.5 text-sm ${loading ? 'opacity-60' : ''}`}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" /> You
          {mode === 'jobs'
            ? <><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block ml-2" /> Jobs</>
            : <><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block ml-2" /> Providers</>}
        </div>
      </div>

      {geoError && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-700 text-xs px-4 py-2 flex items-center gap-2">
          <Navigation size={12} /> {geoError}
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar list */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white border-r border-slate-100 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {loading ? 'Searching…' : `${items.length} ${mode === 'jobs' ? 'open jobs' : 'providers'} found`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-3 space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="animate-pulse space-y-2 p-3 border border-slate-100 rounded-xl">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center">
                <MapPin size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">Nothing nearby</p>
                <p className="text-xs text-slate-400 mt-1">Try increasing the radius</p>
              </div>
            ) : (
              items.map(item => {
                const isSelected = selected?._id === item._id;
                if (mode === 'jobs') {
                  return (
                    <button key={item._id} onClick={() => flyTo(item)}
                      className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-violet-50 border-l-2 border-l-violet-500' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>{item.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge-violet text-[10px]">{item.category}</span>
                            {item.urgency === 'high' && <span className="badge bg-rose-100 text-rose-700 text-[10px]">🔥 Urgent</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="font-semibold text-emerald-600">₹{item.budget}</span>
                            <span className="flex items-center gap-0.5"><MapPin size={9}/> {item.distance} km</span>
                            {item.location?.city && <span>{item.location.city}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                } else {
                  return (
                    <button key={item._id} onClick={() => flyTo(item)}
                      className={`w-full text-left p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${isSelected ? 'bg-violet-50 border-l-2 border-l-violet-500' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {item.name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-700' : 'text-slate-800'}`}>{item.name}</p>
                            {item.isPremium && <span className="text-[10px] text-amber-600">⭐</span>}
                            {item.availability && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span className="flex items-center gap-0.5"><Star size={9} className="text-amber-400"/>{item.averageRating?.toFixed(1) || '—'}</span>
                            <span className="text-emerald-600 font-medium">₹{item.hourlyRate}/hr</span>
                            <span className="flex items-center gap-0.5"><MapPin size={9}/> {item.distance} km</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.skills?.slice(0,2).map(s => <span key={s} className="badge-violet text-[10px]">{s}</span>)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }
              })
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapElRef} className="w-full h-full" />

          {/* Popup card over map */}
          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 max-w-[calc(100%-2rem)] z-[1000] animate-slide-up">
              <div className="card shadow-card-lg">
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X size={14} className="text-slate-500" />
                </button>

                {mode === 'jobs' ? (
                  <>
                    <div className="flex items-start gap-3 mb-3 pr-8">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{selected.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge-violet text-[10px]">{selected.category}</span>
                          {selected.urgency && (
                            <span className={`badge text-[10px] ${urgencyBadge[selected.urgency]}`}>{selected.urgency}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{selected.description}</p>

                    <div className="grid grid-cols-3 gap-2 mb-4 text-center bg-slate-50 rounded-xl p-2">
                      <div>
                        <p className="text-sm font-bold text-emerald-600">₹{selected.budget}</p>
                        <p className="text-[10px] text-slate-400">Budget</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selected.distance} km</p>
                        <p className="text-[10px] text-slate-400">Distance</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selected.location?.city || '—'}</p>
                        <p className="text-[10px] text-slate-400">City</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/jobs/${selected._id}`)}
                        className="btn-primary flex-1 justify-center text-sm gap-1.5">
                        <Briefcase size={13} />
                        {user.role === 'provider' ? 'Bid on Job' : 'View Job'}
                      </button>
                      {user.role === 'provider' && (
                        <button onClick={() => navigate(`/chat/${selected.customer?._id}`)}
                          className="btn-secondary px-3 text-sm">
                          💬
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3 pr-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {selected.name?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{selected.name}</h3>
                          {selected.isPremium && <span className="badge bg-amber-100 text-amber-700 text-[10px]">⭐ Premium</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Star size={10} className="text-amber-400" />
                          <span className="font-medium text-slate-600">{selected.averageRating?.toFixed(1) || '—'}</span>
                          <span>·</span>
                          <span className={selected.availability ? 'text-emerald-500 font-medium' : 'text-slate-400'}>
                            {selected.availability ? '● Available' : '○ Busy'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selected.bio && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{selected.bio}</p>}

                    <div className="grid grid-cols-3 gap-2 mb-3 text-center bg-slate-50 rounded-xl p-2">
                      <div>
                        <p className="text-sm font-bold text-violet-600">₹{selected.hourlyRate}/hr</p>
                        <p className="text-[10px] text-slate-400">Rate</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selected.distance} km</p>
                        <p className="text-[10px] text-slate-400">Distance</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selected.jobsCompleted || 0}</p>
                        <p className="text-[10px] text-slate-400">Jobs done</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selected.skills?.slice(0,4).map(s => <span key={s} className="badge-violet text-[10px]">{s}</span>)}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/providers/${selected._id}`)}
                        className="btn-secondary flex-1 text-sm justify-center">View Profile</button>
                      <button onClick={() => navigate(`/chat/${selected._id}`)}
                        className="btn-primary flex-1 text-sm justify-center gap-1.5">
                        💬 Message
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-[999]">
              <div className="bg-white rounded-2xl shadow-card-lg px-6 py-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-slate-700">Finding nearby {mode}…</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaflet tooltip style */}
      <style>{`
        .leaflet-you-tooltip {
          background: #6d28d9; color: white; border: none;
          font-size: 11px; font-weight: 600; padding: 2px 8px;
          border-radius: 20px; box-shadow: 0 2px 8px rgba(109,40,217,.4);
        }
        .leaflet-you-tooltip::before { border-right-color: #6d28d9; }
      `}</style>
    </div>
  );
}
