import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { io } from 'socket.io-client';
import { MessageSquare, Send, Search, Circle } from 'lucide-react';

let socket;

export default function Chat() {
  const { otherUserId } = useParams();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);       // otherUserId string
  const [activeRoomId, setActiveRoomId] = useState(null);   // roomId string
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [roomsLoading, setRoomsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // ── Socket setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('register', user._id);
      socket.emit('join', user._id);
    });

    // Online / offline
    socket.on('online_users', (ids) => setOnlineUsers(new Set(ids)));
    socket.on('user_online',  (id)  => setOnlineUsers(prev => new Set([...prev, id])));
    socket.on('user_offline', (id)  => setOnlineUsers(prev => { const s = new Set(prev); s.delete(id); return s; }));

    // Incoming message
    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        // dedupe by _id
        if (prev.some(m => m._id && m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Update rooms list last message
      setRooms(prev => prev.map(r =>
        r.roomId === msg.roomId
          ? { ...r, lastMessage: msg.text, lastTime: msg.createdAt }
          : r
      ));
    });

    // Notification when a message arrives in a room we haven't opened
    socket.on('new_message_notification', ({ roomId }) => {
      setRooms(prev => prev.map(r =>
        r.roomId === roomId ? { ...r, unread: (r.unread || 0) + 1 } : r
      ));
      // If room not yet in list, refresh rooms
      setRooms(prev => {
        const exists = prev.some(r => r.roomId === roomId);
        if (!exists) fetchRooms();
        return prev;
      });
    });

    return () => { socket.disconnect(); };
  }, [user._id]);

  // ── Fetch rooms ───────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/rooms');
      setRooms(data);
    } catch (err) { console.error(err); }
    finally { setRoomsLoading(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Auto-open from URL param ──────────────────────────────────────────
  useEffect(() => {
    if (otherUserId && !roomsLoading) openConversation(otherUserId);
  }, [otherUserId, roomsLoading]);

  // ── Open a conversation ───────────────────────────────────────────────
  const openConversation = async (userId) => {
    setLoadingMsgs(true);
    setActiveRoom(userId);
    const roomId = [user._id, userId].sort().join('_');
    setActiveRoomId(roomId);

    // Join socket room
    socket.emit('join_room', roomId);

    try {
      const { data } = await api.get(`/chat/${userId}`);
      setMessages(data);
      // Clear unread for this room locally
      setRooms(prev => prev.map(r => r.roomId === roomId ? { ...r, unread: 0 } : r));

      // If conversation doesn't exist in rooms yet, add a placeholder
      setRooms(prev => {
        const exists = prev.some(r => r.roomId === roomId);
        if (!exists && data.length > 0) {
          const first = data[0];
          const other = first.sender?._id === user._id ? first.receiver : first.sender;
          return [{
            roomId,
            lastMessage: data[data.length - 1]?.text || '',
            lastTime: data[data.length - 1]?.createdAt,
            otherUser: other,
            unread: 0,
          }, ...prev];
        }
        return prev;
      });
    } catch (err) { console.error(err); }
    finally { setLoadingMsgs(false); }
  };

  // ── Send a message ────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;
    const trimmed = text.trim();
    setText('');
    try {
      // Save via REST (persists to DB + emits to room via server)
      const { data: saved } = await api.post(`/chat/${activeRoom}`, { text: trimmed });
      // Also emit via socket with receiverId for direct delivery
      socket.emit('send_message', {
        roomId: activeRoomId,
        receiverId: activeRoom,
        senderId: user._id,
        ...saved,
      });
      // Add locally (REST response is the authoritative message)
      setMessages(prev =>
        prev.some(m => m._id === saved._id) ? prev : [...prev, saved]
      );
      setRooms(prev => prev.map(r =>
        r.roomId === activeRoomId ? { ...r, lastMessage: trimmed, lastTime: new Date() } : r
      ));
    } catch (err) { console.error(err); }
  };

  // ── Auto-scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeRoomInfo = rooms.find(r => r.otherUser?._id === activeRoom);
  const isOnline = (id) => onlineUsers.has(id?.toString());

  // ── Format timestamp ──────────────────────────────────────────────────
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalUnread = rooms.reduce((sum, r) => sum + (r.unread || 0), 0);

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          {totalUnread > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
          {onlineUsers.size} online
        </p>
      </div>

      <div className="flex gap-4" style={{ height: '620px' }}>
        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 card p-0 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-700 text-sm">Conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="skeleton w-10 h-10 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-2/3 rounded" />
                      <div className="skeleton h-2.5 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Browse providers or jobs to start chatting</p>
              </div>
            ) : (
              rooms
                .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
                .map(room => {
                  const isActive  = activeRoom === room.otherUser?._id;
                  const online    = isOnline(room.otherUser?._id);
                  const hasUnread = room.unread > 0;
                  return (
                    <button key={room.roomId} onClick={() => openConversation(room.otherUser?._id)}
                      className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all duration-150 ${
                        isActive ? 'bg-violet-50 border-l-2 border-l-violet-500' : 'hover:bg-slate-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        {/* Avatar + online dot */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-glow-sm">
                            {room.otherUser?.name?.[0]}
                          </div>
                          {online && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-sm truncate ${isActive ? 'text-violet-700 font-semibold' : hasUnread ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'}`}>
                              {room.otherUser?.name}
                            </p>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTime(room.lastTime)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <p className={`text-xs truncate ${hasUnread ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                              {room.lastMessage || 'Start a conversation'}
                            </p>
                            {hasUnread && (
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">
                                {room.unread > 9 ? '9+' : room.unread}
                              </span>
                            )}
                          </div>
                          {online && !isActive && (
                            <p className="text-[10px] text-emerald-500 font-medium mt-0.5">● Online</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>

        {/* ── Chat window ───────────────────────────────────────────── */}
        <div className="flex-1 card p-0 flex flex-col overflow-hidden">
          {activeRoom ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-violet-50/50 to-indigo-50/50">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-glow-sm">
                    {activeRoomInfo?.otherUser?.name?.[0] || '?'}
                  </div>
                  {isOnline(activeRoom) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {activeRoomInfo?.otherUser?.name || 'Chat'}
                  </p>
                  {isOnline(activeRoom)
                    ? <p className="text-xs text-emerald-500 font-medium">● Online now</p>
                    : <p className="text-xs text-slate-400">Offline</p>
                  }
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
                {loadingMsgs ? (
                  <div className="flex justify-center pt-10">
                    <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center pt-16">
                    <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare size={24} className="text-violet-400" />
                    </div>
                    <p className="font-medium text-slate-600">Start the conversation</p>
                    <p className="text-sm text-slate-400 mt-1">Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                    const showTime = i === 0 || (
                      new Date(msg.createdAt) - new Date(messages[i-1]?.createdAt) > 5 * 60 * 1000
                    );
                    return (
                      <React.Fragment key={msg._id || i}>
                        {showTime && (
                          <div className="text-center py-1">
                            <span className="text-[10px] text-slate-400 bg-white/80 px-3 py-0.5 rounded-full">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md'
                              : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="px-4 py-3.5 border-t border-slate-100 flex gap-3 bg-white">
                <input
                  className="input flex-1"
                  placeholder={isOnline(activeRoom) ? 'Type a message…' : 'Type a message (offline — will deliver when online)…'}
                  value={text}
                  onChange={e => setText(e.target.value)}
                />
                <button type="submit" disabled={!text.trim()}
                  className="btn-primary px-5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-4 bg-gradient-to-br from-violet-50/40 to-indigo-50/40">
              <div className="w-20 h-20 rounded-3xl bg-violet-100 flex items-center justify-center">
                <MessageSquare size={32} className="text-violet-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700 text-lg">Your messages</p>
                <p className="text-sm text-slate-400 mt-1">Select a conversation to start chatting</p>
                {totalUnread > 0 && (
                  <p className="text-sm text-violet-600 font-medium mt-2">
                    {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
