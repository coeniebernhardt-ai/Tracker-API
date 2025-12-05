'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { teamMembers } from '../../data/teamData';
import { getCustomUsers, CustomUser } from '../../data/customUsersData';
import { verifyPassword, isLoggedIn, login, logout } from '../../data/authData';
import { getProfilePicture, setProfilePicture, fileToBase64 } from '../../data/profileData';
import Link from 'next/link';
import Image from 'next/image';

type TicketStatus = 'open' | 'closed';
type TaskLocation = 'on-site' | 'remote';

interface Ticket {
  id: string;
  ticketNumber: string;
  createdAt: string;
  status: TicketStatus;
  issue: string;
  resolution: string;
  location: TaskLocation;
  client: string;
  clickupTicket?: string;
  closedAt?: string;
  responseTimeMinutes?: number;
  hasDependencies?: boolean;
  dependencyName?: string;
}

interface MemberData {
  id: string;
  name: string;
  role: string;
  avatar: string;
  definition: string;
  responsibilities: string[];
}

// Generate initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

// Generate unique ticket number
function generateTicketNumber(initials: string, existingTickets: Ticket[]): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const todayTickets = existingTickets.filter(t => t.ticketNumber.includes(dateStr));
  const sequence = String(todayTickets.length + 1).padStart(3, '0');
  return `${initials}-${dateStr}-${sequence}`;
}

// Login Component
function LoginForm({ memberId, memberName, memberAvatar, profilePic, onLogin }: { 
  memberId: string; 
  memberName: string; 
  memberAvatar: string;
  profilePic: string | null;
  onLogin: () => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPassword(memberId, password)) {
      login(memberId);
      onLogin();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const getAvatarGradient = () => {
    const colors = [
      'from-cyan-400 to-blue-500',
      'from-violet-400 to-purple-500',
      'from-rose-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
    ];
    const index = memberName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-radial-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {profilePic ? (
            <Image
              src={profilePic}
              alt={memberName}
              width={80}
              height={80}
              className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-lg mb-4"
            />
          ) : (
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4`}>
              {memberAvatar}
            </div>
          )}
          <h1 className="text-2xl font-bold text-white mb-2">Welcome, {memberName.split(' ')[0]}</h1>
          <p className="text-slate-400">Please enter your password to access your ticket page</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors pr-12"
                placeholder="Enter your password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-rose-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Sign In
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">
            Forgot your password? Contact your administrator.
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MemberPage() {
  const params = useParams();
  const memberId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [member, setMember] = useState<MemberData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // New ticket form
  const [newTicketData, setNewTicketData] = useState({
    issue: '',
    location: 'remote' as TaskLocation,
    client: '',
    clickupTicket: '',
    hasDependencies: false,
    dependencyName: ''
  });

  // Close ticket form
  const [closeTicketData, setCloseTicketData] = useState({
    resolution: ''
  });

  // Find member from both default and custom users
  useEffect(() => {
    const defaultMember = teamMembers.find(m => m.id === memberId);
    if (defaultMember) {
      setMember(defaultMember);
    } else {
      const customUsers = getCustomUsers();
      const customMember = customUsers.find(u => u.id === memberId);
      if (customMember) {
        setMember(customMember);
      }
    }
  }, [memberId]);

  const memberInitials = member ? getInitials(member.name) : 'XX';

  // Check authentication on mount
  useEffect(() => {
    setIsAuthenticated(isLoggedIn(memberId));
    setCheckingAuth(false);
  }, [memberId]);

  // Load profile picture
  useEffect(() => {
    const pic = getProfilePicture(memberId);
    setProfilePic(pic);
  }, [memberId]);

  // Load tickets from localStorage
  useEffect(() => {
    if (!isAuthenticated) return;
    const stored = localStorage.getItem(`tickets-${memberId}`);
    if (stored) {
      setTickets(JSON.parse(stored));
    }
  }, [memberId, isAuthenticated]);

  // Save tickets to localStorage
  const saveTickets = (newTickets: Ticket[]) => {
    localStorage.setItem(`tickets-${memberId}`, JSON.stringify(newTickets));
    setTickets(newTickets);
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setProfilePicture(memberId, base64);
      setProfilePic(base64);
      setShowProfileMenu(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  // Create new ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketData.issue.trim() || !newTicketData.client.trim()) return;
    if (newTicketData.hasDependencies && !newTicketData.dependencyName.trim()) return;

    const newTicket: Ticket = {
      id: Date.now().toString(),
      ticketNumber: generateTicketNumber(memberInitials, tickets),
      createdAt: new Date().toISOString(),
      status: 'open',
      issue: newTicketData.issue.trim(),
      resolution: '',
      location: newTicketData.location,
      client: newTicketData.client.trim(),
      clickupTicket: newTicketData.clickupTicket.trim() || undefined,
      hasDependencies: newTicketData.hasDependencies,
      dependencyName: newTicketData.hasDependencies ? newTicketData.dependencyName.trim() : undefined
    };

    saveTickets([newTicket, ...tickets]);
    setNewTicketData({ issue: '', location: 'remote', client: '', clickupTicket: '', hasDependencies: false, dependencyName: '' });
    setShowNewTicketForm(false);
  };

  // Close a ticket - auto-calculate response time
  const handleCloseTicket = (ticketId: string) => {
    if (!closeTicketData.resolution.trim()) return;

    const now = new Date();
    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === ticketId) {
        // Auto-calculate response time in minutes
        const createdAt = new Date(ticket.createdAt);
        const responseTimeMinutes = Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60));
        
        return {
          ...ticket,
          status: 'closed' as TicketStatus,
          resolution: closeTicketData.resolution.trim(),
          responseTimeMinutes: responseTimeMinutes,
          closedAt: now.toISOString()
        };
      }
      return ticket;
    });

    saveTickets(updatedTickets);
    setClosingTicketId(null);
    setCloseTicketData({ resolution: '' });
  };

  // Handle logout
  const handleLogout = () => {
    logout(memberId);
    setIsAuthenticated(false);
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    const closedTickets = tickets.filter(t => t.status === 'closed');
    const totalTickets = tickets.length;
    
    if (totalTickets === 0) return null;

    const ticketsHandled = ((closedTickets.length / totalTickets) * 100).toFixed(1);
    
    const ticketsWithResponse = closedTickets.filter(t => t.responseTimeMinutes !== undefined && t.responseTimeMinutes > 0);
    const avgResponseTime = ticketsWithResponse.length > 0
      ? (ticketsWithResponse.reduce((sum, t) => sum + (t.responseTimeMinutes || 0), 0) / ticketsWithResponse.length).toFixed(0)
      : '0';

    const onSiteTickets = tickets.filter(t => t.location === 'on-site').length;
    const remoteTickets = tickets.filter(t => t.location === 'remote').length;

    return {
      ticketsHandled,
      avgResponseTime,
      openTickets: tickets.filter(t => t.status === 'open').length,
      closedTickets: closedTickets.length,
      totalTickets,
      onSiteTickets,
      remoteTickets
    };
  };

  const kpis = calculateKPIs();
  const openTickets = tickets.filter(t => t.status === 'open');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  const getAvatarGradient = () => {
    const colors = [
      'from-cyan-400 to-blue-500',
      'from-violet-400 to-purple-500',
      'from-rose-400 to-pink-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
    ];
    const index = member?.name.charCodeAt(0) ?? 0;
    return colors[index % colors.length];
  };

  // Show loading while checking auth
  if (checkingAuth || !member) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Member not found
  if (!member) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Team Member Not Found</h1>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginForm 
        memberId={memberId} 
        memberName={member.name}
        memberAvatar={member.avatar}
        profilePic={profilePic}
        onLogin={() => setIsAuthenticated(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-radial-gradient">
      {/* Hidden file input for profile picture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePictureChange}
        className="hidden"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            {/* Profile Picture with menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="relative group"
              >
                {profilePic ? (
                  <Image
                    src={profilePic}
                    alt={member.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover shadow-lg ring-2 ring-transparent group-hover:ring-cyan-500 transition-all"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-transparent group-hover:ring-cyan-500 transition-all`}>
                    {member.avatar}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
              
              {showProfileMenu && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 animate-fade-in">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700 rounded-t-xl transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {profilePic ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {profilePic && (
                    <button
                      onClick={() => {
                        localStorage.removeItem(`profile-picture-${memberId}`);
                        setProfilePic(null);
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-slate-700 rounded-b-xl transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Photo
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{member.name}</h1>
              <p className="text-sm text-slate-400">{member.role}</p>
            </div>
            <div className="text-right mr-4">
              <p className="text-xs text-slate-500">Your ID</p>
              <p className="text-lg font-mono font-bold text-cyan-400">{memberInitials}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
      )}

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* KPI Summary */}
        {kpis && (
          <section className="mb-8 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Your Performance Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Tickets Handled</p>
                <p className={`text-2xl font-bold ${parseFloat(kpis.ticketsHandled) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {kpis.ticketsHandled}%
                </p>
                <p className="text-xs text-slate-600 mt-1">Target: 80%</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Avg Response Time</p>
                <p className={`text-2xl font-bold ${parseFloat(kpis.avgResponseTime) <= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {kpis.avgResponseTime} min
                </p>
                <p className="text-xs text-slate-600 mt-1">Target: ≤60 min</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Open / Closed</p>
                <p className="text-2xl font-bold text-white">
                  <span className="text-amber-400">{kpis.openTickets}</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-emerald-400">{kpis.closedTickets}</span>
                </p>
                <p className="text-xs text-slate-600 mt-1">Total: {kpis.totalTickets}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Location Split</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-cyan-400">{kpis.onSiteTickets} On-site</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-sm text-violet-400">{kpis.remoteTickets} Remote</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* New Ticket Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showNewTicketForm ? 'Cancel' : 'Open New Ticket'}
          </button>
        </div>

        {/* New Ticket Form */}
        {showNewTicketForm && (
          <form onSubmit={handleCreateTicket} className="mb-8 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Open New Ticket</h3>
              <div className="text-right">
                <p className="text-xs text-slate-500">Ticket Number (auto-generated)</p>
                <p className="text-sm font-mono text-cyan-400">{generateTicketNumber(memberInitials, tickets)}</p>
              </div>
            </div>
            
            <div className="space-y-5">
              {/* Date Display (non-editable) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <div className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-400">
                  {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              {/* Client Field - Mandatory */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTicketData.client}
                  onChange={(e) => setNewTicketData({ ...newTicketData, client: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  placeholder="Enter client name..."
                />
              </div>

              {/* ClickUp Ticket Field - Optional */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ClickUp Ticket <span className="text-slate-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newTicketData.clickupTicket}
                  onChange={(e) => setNewTicketData({ ...newTicketData, clickupTicket: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                  placeholder="Enter ClickUp ticket ID or URL..."
                />
              </div>

              {/* Task Location */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Task Location</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTicketData({ ...newTicketData, location: 'on-site' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      newTicketData.location === 'on-site'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      On-Site
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTicketData({ ...newTicketData, location: 'remote' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      newTicketData.location === 'remote'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Remote
                    </div>
                  </button>
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Issue Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={newTicketData.issue}
                  onChange={(e) => setNewTicketData({ ...newTicketData, issue: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors resize-none"
                  placeholder="Describe the issue or task in detail..."
                />
              </div>

              {/* Dependencies Checkbox */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newTicketData.hasDependencies}
                    onChange={(e) => setNewTicketData({ 
                      ...newTicketData, 
                      hasDependencies: e.target.checked,
                      dependencyName: e.target.checked ? newTicketData.dependencyName : ''
                    })}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-300">Dependencies</span>
                    <p className="text-xs text-slate-500">Check if this ticket depends on another company or department</p>
                  </div>
                </label>

                {/* Dependency Name Field - shown when checkbox is checked */}
                {newTicketData.hasDependencies && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Name of company or department <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTicketData.dependencyName}
                      onChange={(e) => setNewTicketData({ ...newTicketData, dependencyName: e.target.value })}
                      required={newTicketData.hasDependencies}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                      placeholder="e.g., IT Department, ABC Company..."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={!newTicketData.issue.trim() || !newTicketData.client.trim() || (newTicketData.hasDependencies && !newTicketData.dependencyName.trim())}
                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open Ticket
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTicketForm(false);
                  setNewTicketData({ issue: '', location: 'remote', client: '', clickupTicket: '', hasDependencies: false, dependencyName: '' });
                }}
                className="px-5 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tickets Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'open'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Open Tickets ({openTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'closed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Closed Tickets ({closedTickets.length})
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <section>
          {activeTab === 'open' && (
            <>
              {openTickets.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                  <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-slate-500">No open tickets. Great job!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {openTickets.map((ticket, index) => (
                    <div 
                      key={ticket.id} 
                      className="p-5 rounded-2xl bg-slate-800/40 border border-amber-500/30 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                              {ticket.ticketNumber}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs font-medium">
                              {ticket.client}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              ticket.location === 'on-site' 
                                ? 'bg-cyan-500/20 text-cyan-400' 
                                : 'bg-violet-500/20 text-violet-400'
                            }`}>
                              {ticket.location === 'on-site' ? '📍 On-Site' : '🌐 Remote'}
                            </span>
                            {ticket.clickupTicket && (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
                                🔗 {ticket.clickupTicket}
                              </span>
                            )}
                            {ticket.hasDependencies && (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-medium">
                                ⚠️ Has Dependencies
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Opened: {new Date(ticket.createdAt).toLocaleDateString('en-ZA', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                          Open
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-1">Issue</p>
                        <p className="text-slate-200 leading-relaxed">{ticket.issue}</p>
                      </div>

                      {ticket.hasDependencies && ticket.dependencyName && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <p className="text-xs text-rose-400 mb-1">Dependency</p>
                          <p className="text-sm text-slate-300">{ticket.dependencyName}</p>
                        </div>
                      )}

                      {closingTicketId === ticket.id ? (
                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 animate-fade-in">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-emerald-400">Close Ticket</h4>
                            <div className="text-xs text-slate-500">
                              ⏱ Time elapsed: {Math.round((new Date().getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60))} min
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-2">
                                Resolution <span className="text-rose-400">*</span>
                              </label>
                              <textarea
                                value={closeTicketData.resolution}
                                onChange={(e) => setCloseTicketData({ ...closeTicketData, resolution: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
                                placeholder="Describe how the issue was resolved..."
                              />
                            </div>
                            <p className="text-xs text-slate-500 italic">
                              Response time will be automatically calculated when you close the ticket.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleCloseTicket(ticket.id)}
                                disabled={!closeTicketData.resolution.trim()}
                                className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Close Ticket
                              </button>
                              <button
                                onClick={() => {
                                  setClosingTicketId(null);
                                  setCloseTicketData({ resolution: '' });
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setClosingTicketId(ticket.id)}
                          className="w-full px-4 py-2 rounded-xl border border-emerald-500/50 text-emerald-400 font-medium hover:bg-emerald-500/10 transition-colors"
                        >
                          Resolve & Close Ticket
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'closed' && (
            <>
              {closedTickets.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                  <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500">No closed tickets yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {closedTickets.map((ticket, index) => (
                    <div 
                      key={ticket.id} 
                      className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold font-mono">
                              {ticket.ticketNumber}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-400 text-xs font-medium">
                              {ticket.client}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              ticket.location === 'on-site' 
                                ? 'bg-cyan-500/20 text-cyan-400' 
                                : 'bg-violet-500/20 text-violet-400'
                            }`}>
                              {ticket.location === 'on-site' ? '📍 On-Site' : '🌐 Remote'}
                            </span>
                            {ticket.clickupTicket && (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium">
                                🔗 {ticket.clickupTicket}
                              </span>
                            )}
                            {ticket.hasDependencies && (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-medium">
                                ⚠️ Dependency
                              </span>
                            )}
                            {ticket.responseTimeMinutes !== undefined && ticket.responseTimeMinutes > 0 && (
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                ticket.responseTimeMinutes <= 60 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                ⏱ {ticket.responseTimeMinutes} min
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Opened: {new Date(ticket.createdAt).toLocaleDateString('en-ZA', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {ticket.closedAt && (
                              <> • Closed: {new Date(ticket.closedAt).toLocaleDateString('en-ZA', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</>
                            )}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                          Closed
                        </span>
                      </div>

                      {ticket.hasDependencies && ticket.dependencyName && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <p className="text-xs text-rose-400 mb-1">Dependency</p>
                          <p className="text-sm text-slate-300">{ticket.dependencyName}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-slate-900/50">
                          <p className="text-xs text-slate-500 mb-1">Issue</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{ticket.issue}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 mb-1">Resolution</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{ticket.resolution}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
