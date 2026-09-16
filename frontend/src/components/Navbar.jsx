import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LayoutDashboard, PlusCircle, Search, MessageSquare, Briefcase,
  LogOut, Menu, X, ChevronDown, Bell, User, MapPin, ShieldCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count every 30s
  useEffect(() => {
    if (!user) return;
    const fetch = () => api.get('/chat/unread').then(r => setUnreadCount(r.data.count)).catch(() => {});
    fetch();
    const id = setInterval(fetch, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = {
    customer: [
      { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/post-job',           label: 'Post Job',  icon: PlusCircle },
      { to: '/providers',          label: 'Providers', icon: Search },
      { to: '/map',                label: 'Map',        icon: MapPin },
      { to: '/chat',               label: 'Messages',  icon: MessageSquare },
      { to: '/verify',             label: 'Get Verified', icon: ShieldCheck },
    ],
    provider: [
      { to: '/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/jobs/feed',          label: 'Job Feed',  icon: Briefcase },
      { to: '/map',                label: 'Map',        icon: MapPin },
      { to: '/chat',               label: 'Messages',  icon: MessageSquare },
      { to: '/verify',             label: 'Get Verified', icon: ShieldCheck },
    ],
    admin: [
      { to: '/admin',              label: 'Admin Panel',   icon: LayoutDashboard },
      { to: '/admin/verification', label: 'Verifications', icon: ShieldCheck },
    ],
  };

  const links = navLinks[user?.role] || [];
  const isActive = (to) => location.pathname === to;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">
              Work<span className="text-gradient">Bridge</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const isChat = to === '/chat';
              return (
                <Link key={to} to={to}
                  onClick={() => isChat && setUnreadCount(0)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}>
                  <Icon size={15} />
                  {label}
                  {isChat && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notification bell */}
            <button className="btn-icon relative">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-slate-400 capitalize leading-tight">{user?.role}</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-card-lg border border-slate-100 z-20 overflow-hidden animate-slide-up">
                    <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 text-sm">{user?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <Link to={user?.role === 'provider' ? `/providers/${user?._id}` : '/dashboard'}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                        <User size={14} className="text-slate-400" /> View Profile
                      </Link>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-0.5">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden btn-icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ to, label, icon: Icon }) => {
              const isChat = to === '/chat';
              return (
                <Link key={to} to={to}
                  onClick={() => { setMenuOpen(false); if (isChat) setUnreadCount(0); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(to) ? 'bg-violet-50 text-violet-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}>
                  <Icon size={16} /> {label}
                  {isChat && unreadCount > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-rose-500 font-medium px-3 py-1.5 rounded-xl hover:bg-rose-50">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
