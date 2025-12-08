'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { getTicketsByUserId, createTicket, closeTicket, addTicketUpdate, uploadProfilePicture, uploadTicketAttachment, updateTicket, Ticket } from '../lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// Hook to force re-render every minute for time tracking
function useTimeUpdate() {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
}

type TaskLocation = 'on-site' | 'remote';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, isAdmin, signOut, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Force re-render every minute to update time tracker
  useTimeUpdate();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [closingTicketId, setClosingTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  const [newTicketData, setNewTicketData] = useState({
    issue: '',
    location: 'remote' as TaskLocation,
    client: '',
    clickupTicket: '',
    hasDependencies: false,
    dependencyName: '',
    ticketType: '' as 'Hardware' | 'Software' | 'New Site' | '',
    estateOrBuilding: '',
    cmlLocation: '',
    // New Site fields
    siteName: '',
    installers: [] as string[],
    installerInput: '',
    dependencies: [] as string[],
    dependencyInput: '',
    targetDate: '',
    // File uploads
    attachments: [] as File[],
    siteFiles: [] as { file: File; label: string }[]
  });

  const [closeTicketData, setCloseTicketData] = useState({
    resolution: ''
  });

  // Update ticket state
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [newUpdateText, setNewUpdateText] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load tickets - only when user ID changes
  useEffect(() => {
    if (user?.id) {
      loadTickets();
    }
  }, [user?.id]);

  const loadTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const data = await getTicketsByUserId(user.id);
    setTickets(data);
    setLoadingTickets(false);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting || uploadingFiles) return;
    
    if (!user) return;
    if (!newTicketData.issue.trim()) return;
    if (!newTicketData.client.trim()) return;
    if (!newTicketData.ticketType) return;
    
    // Validation for regular tickets
    if (newTicketData.ticketType !== 'New Site') {
      if (!newTicketData.estateOrBuilding.trim()) return;
      if (!newTicketData.cmlLocation.trim()) return;
      if (newTicketData.hasDependencies && !newTicketData.dependencyName.trim()) return;
    }
    
    // Validation for New Site tickets
    if (newTicketData.ticketType === 'New Site') {
      if (!newTicketData.siteName.trim()) return;
    }

    setIsSubmitting(true);
    setUploadingFiles(true);
    
    try {
      // Create ticket first (without files)
      const ticketPayload: any = {
        user_id: user.id,
        client: newTicketData.client.trim(),
        clickup_ticket: newTicketData.clickupTicket.trim() || undefined,
        location: newTicketData.location,
        issue: newTicketData.issue.trim(),
        created_by: user.id,
        ticket_type: newTicketData.ticketType,
      };

      // Add regular ticket fields
      if (newTicketData.ticketType !== 'New Site') {
        ticketPayload.estate_or_building = newTicketData.estateOrBuilding.trim();
        ticketPayload.cml_location = newTicketData.cmlLocation.trim();
        ticketPayload.has_dependencies = newTicketData.hasDependencies;
        ticketPayload.dependency_name = newTicketData.hasDependencies ? newTicketData.dependencyName.trim() : undefined;
      }

      // Add New Site fields
      if (newTicketData.ticketType === 'New Site') {
        ticketPayload.site_name = newTicketData.siteName.trim();
        ticketPayload.installers = newTicketData.installers;
        ticketPayload.dependencies = newTicketData.dependencies;
        ticketPayload.target_date = newTicketData.targetDate || undefined;
      }

      const { data, error } = await createTicket(ticketPayload);
      
      if (error || !data) {
        alert('Error creating ticket: ' + (error as Error).message);
        return;
      }
      
      // Upload attachments for regular tickets (max 5)
      if (newTicketData.ticketType !== 'New Site' && newTicketData.attachments.length > 0) {
        setUploadingFiles(true);
        const uploadPromises = newTicketData.attachments.slice(0, 5).map(async (file) => {
          const { url, error } = await uploadTicketAttachment(data.id, file, 'attachment');
          if (error || !url) {
            console.error('Error uploading attachment:', error);
            return null;
          }
          return { url, name: file.name, type: file.type };
        });
        const results = await Promise.all(uploadPromises);
        const attachments = results.filter((r): r is { url: string; name: string; type: string } => r !== null);
        
        // Update ticket with attachments
        if (attachments.length > 0) {
          await updateTicket(data.id, { attachments });
        }
      }

      // Upload site files for New Site tickets
      if (newTicketData.ticketType === 'New Site' && newTicketData.siteFiles.length > 0) {
        setUploadingFiles(true);
        const siteFilePromises = newTicketData.siteFiles.map(async ({ file, label }) => {
          const { url, error } = await uploadTicketAttachment(data.id, file, 'site_file', label);
          if (error || !url) {
            console.error('Error uploading site file:', error);
            return null;
          }
          return { url, name: file.name, type: file.type, label };
        });
        const siteFileResults = await Promise.all(siteFilePromises);
        const siteFiles = siteFileResults.filter((r): r is { url: string; name: string; type: string; label?: string } => r !== null);
        
        // Update ticket with site files
        if (siteFiles.length > 0) {
          await updateTicket(data.id, { site_files: siteFiles });
        }
      }
      
      // Reload tickets from database
      await loadTickets();
      setNewTicketData({ 
        issue: '', 
        location: 'remote', 
        client: '', 
        clickupTicket: '', 
        hasDependencies: false, 
        dependencyName: '', 
        ticketType: '', 
        estateOrBuilding: '', 
        cmlLocation: '',
        siteName: '',
        installers: [],
        installerInput: '',
        dependencies: [],
        dependencyInput: '',
        targetDate: '',
        attachments: [],
        siteFiles: []
      });
      setShowNewTicketForm(false);
    } finally {
      setIsSubmitting(false);
      setUploadingFiles(false);
    }
  };

  const handleAddUpdate = async (ticketId: string) => {
    if (!newUpdateText.trim()) return;

    const { data, error } = await addTicketUpdate(ticketId, newUpdateText.trim(), profile?.full_name);

    if (!error && data) {
      await loadTickets();
      setNewUpdateText('');
      setUpdatingTicketId(null);
    } else if (error) {
      alert('Error adding update: ' + (error as Error).message);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!closeTicketData.resolution.trim()) return;

    const { data, error } = await closeTicket(
      ticketId,
      closeTicketData.resolution.trim()
    );

    if (!error && data) {
      await loadTickets();
      setClosingTicketId(null);
      setCloseTicketData({ resolution: '' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingPicture(true);
    try {
      const { publicUrl, error } = await uploadProfilePicture(user.id, file);
      
      if (error) {
        alert('Error uploading profile picture: ' + (error as Error).message);
        return;
      }

      if (publicUrl) {
        // Refresh profile to get updated avatar_url
        await refreshProfile();
        alert('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    const closedTickets = tickets.filter(t => t.status === 'closed');
    const totalTickets = tickets.length;
    
    if (totalTickets === 0) return null;

    const ticketsHandled = ((closedTickets.length / totalTickets) * 100).toFixed(1);
    
    const ticketsWithResponse = closedTickets.filter(t => t.response_time_minutes && t.response_time_minutes > 0);
    const avgResponseTime = ticketsWithResponse.length > 0
      ? (ticketsWithResponse.reduce((sum, t) => sum + (t.response_time_minutes || 0), 0) / ticketsWithResponse.length).toFixed(0)
      : '0';

    return {
      ticketsHandled,
      avgResponseTime,
      openTickets: tickets.filter(t => t.status === 'open').length,
      closedTickets: closedTickets.length,
      totalTickets,
      onSiteTickets: tickets.filter(t => t.location === 'on-site').length,
      remoteTickets: tickets.filter(t => t.location === 'remote').length
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
    const index = (profile?.full_name?.charCodeAt(0) ?? 0) % colors.length;
    return colors[index];
  };

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-radial-gradient">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {profile.avatar}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload or edit profile picture"
              >
                {uploadingPicture ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{profile.full_name}</h1>
              <p className="text-sm text-slate-400">{profile.role}</p>
            </div>
            
            {isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-600 text-white text-sm font-medium hover:shadow-lg transition-all"
              >
                Admin Dashboard
              </Link>
            )}
            
            <button
              onClick={handleSignOut}
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
            <h3 className="text-lg font-semibold text-white mb-6">Open New Ticket</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <div className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-400">
                  {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Client <span className="text-rose-400">*</span></label>
                <select
                  value={newTicketData.client}
                  onChange={(e) => setNewTicketData({ ...newTicketData, client: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select a client...</option>
                  <option value="Redefine">Redefine</option>
                  <option value="Balwin">Balwin</option>
                  <option value="Go Waterfall">Go Waterfall</option>
                  <option value="Go City">Go City</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Type <span className="text-rose-400">*</span></label>
                <select
                  value={newTicketData.ticketType}
                  onChange={(e) => setNewTicketData({ ...newTicketData, ticketType: e.target.value as 'Hardware' | 'Software' | 'New Site' | '' })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select type...</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="New Site">New Site</option>
                </select>
              </div>

              {/* Regular ticket fields (Hardware/Software) */}
              {newTicketData.ticketType !== 'New Site' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Estate or Building <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={newTicketData.estateOrBuilding}
                      onChange={(e) => setNewTicketData({ ...newTicketData, estateOrBuilding: e.target.value })}
                      required={newTicketData.ticketType !== 'New Site'}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                      placeholder="Enter estate or building name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Location <span className="text-rose-400">*</span></label>
                    <p className="text-xs text-slate-500 mb-2">as per CML</p>
                    <input
                      type="text"
                      value={newTicketData.cmlLocation}
                      onChange={(e) => setNewTicketData({ ...newTicketData, cmlLocation: e.target.value })}
                      required={newTicketData.ticketType !== 'New Site'}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                      placeholder="Enter location..."
                    />
                  </div>
                </>
              )}

              {/* New Site specific fields */}
              {newTicketData.ticketType === 'New Site' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Site Name <span className="text-rose-400">*</span></label>
                    <input
                      type="text"
                      value={newTicketData.siteName}
                      onChange={(e) => setNewTicketData({ ...newTicketData, siteName: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                      placeholder="Enter site name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Installers</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTicketData.installerInput}
                        onChange={(e) => setNewTicketData({ ...newTicketData, installerInput: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTicketData.installerInput.trim()) {
                              setNewTicketData({
                                ...newTicketData,
                                installers: [...newTicketData.installers, newTicketData.installerInput.trim()],
                                installerInput: ''
                              });
                            }
                          }
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                        placeholder="Enter installer name and press Enter..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTicketData.installerInput.trim()) {
                            setNewTicketData({
                              ...newTicketData,
                              installers: [...newTicketData.installers, newTicketData.installerInput.trim()],
                              installerInput: ''
                            });
                          }
                        }}
                        className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        Add
                      </button>
                    </div>
                    {newTicketData.installers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newTicketData.installers.map((installer, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm flex items-center gap-2">
                            {installer}
                            <button
                              type="button"
                              onClick={() => {
                                setNewTicketData({
                                  ...newTicketData,
                                  installers: newTicketData.installers.filter((_, i) => i !== idx)
                                });
                              }}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Dependencies</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTicketData.dependencyInput}
                        onChange={(e) => setNewTicketData({ ...newTicketData, dependencyInput: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTicketData.dependencyInput.trim()) {
                              setNewTicketData({
                                ...newTicketData,
                                dependencies: [...newTicketData.dependencies, newTicketData.dependencyInput.trim()],
                                dependencyInput: ''
                              });
                            }
                          }
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                        placeholder="Enter dependency and press Enter..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTicketData.dependencyInput.trim()) {
                            setNewTicketData({
                              ...newTicketData,
                              dependencies: [...newTicketData.dependencies, newTicketData.dependencyInput.trim()],
                              dependencyInput: ''
                            });
                          }
                        }}
                        className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        Add
                      </button>
                    </div>
                    {newTicketData.dependencies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newTicketData.dependencies.map((dep, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm flex items-center gap-2">
                            {dep}
                            <button
                              type="button"
                              onClick={() => {
                                setNewTicketData({
                                  ...newTicketData,
                                  dependencies: newTicketData.dependencies.filter((_, i) => i !== idx)
                                });
                              }}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Date</label>
                    <input
                      type="date"
                      value={newTicketData.targetDate}
                      onChange={(e) => setNewTicketData({ ...newTicketData, targetDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ClickUp Ticket <span className="text-slate-500">(optional)</span></label>
                <input
                  type="text"
                  value={newTicketData.clickupTicket}
                  onChange={(e) => setNewTicketData({ ...newTicketData, clickupTicket: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  placeholder="Enter ClickUp ticket ID..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Task Location</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTicketData({ ...newTicketData, location: 'on-site' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      newTicketData.location === 'on-site'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400'
                    }`}
                  >
                    📍 On-Site
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTicketData({ ...newTicketData, location: 'remote' })}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      newTicketData.location === 'remote'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                        : 'bg-slate-900/50 border-slate-700 text-slate-400'
                    }`}
                  >
                    🌐 Remote
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Issue Description <span className="text-rose-400">*</span></label>
                <textarea
                  value={newTicketData.issue}
                  onChange={(e) => setNewTicketData({ ...newTicketData, issue: e.target.value })}
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none resize-none"
                  placeholder="Describe the issue..."
                />
              </div>

              {/* Dependencies Checkbox - only for regular tickets */}
              {newTicketData.ticketType !== 'New Site' && (
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
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-300">Dependencies</span>
                      <p className="text-xs text-slate-500">Check if this ticket depends on another company or department</p>
                    </div>
                  </label>

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
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                        placeholder="e.g., IT Department, ABC Company..."
                      />
                    </div>
                  )}
                </div>
              )}

              {/* File uploads for regular tickets (max 5 images) */}
              {newTicketData.ticketType !== 'New Site' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Attachments <span className="text-slate-500">(up to 5 images)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length + newTicketData.attachments.length > 5) {
                        alert('Maximum 5 images allowed');
                        return;
                      }
                      setNewTicketData({ ...newTicketData, attachments: [...newTicketData.attachments, ...files] });
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  />
                  {newTicketData.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newTicketData.attachments.map((file, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm flex items-center gap-2">
                          {file.name}
                          <button
                            type="button"
                            onClick={() => {
                              setNewTicketData({
                                ...newTicketData,
                                attachments: newTicketData.attachments.filter((_, i) => i !== idx)
                              });
                            }}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Site files for New Site tickets */}
              {newTicketData.ticketType === 'New Site' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Site Information, BOM, Site Images, Hardware Delivery Notes, etc.
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const label = prompt('Enter label for this file (e.g., "Site Information", "BOM", "Site Images", "Hardware Delivery Notes"):') || 'Site File';
                        setNewTicketData({
                          ...newTicketData,
                          siteFiles: [...newTicketData.siteFiles, { file, label }]
                        });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-cyan-500 outline-none"
                  />
                  {newTicketData.siteFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {newTicketData.siteFiles.map((item, idx) => (
                        <div key={idx} className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm flex items-center justify-between">
                          <div>
                            <span className="font-medium">{item.label}:</span> {item.file.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewTicketData({
                                ...newTicketData,
                                siteFiles: newTicketData.siteFiles.filter((_, i) => i !== idx)
                              });
                            }}
                            className="text-rose-400 hover:text-rose-300 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  uploadingFiles ||
                  !newTicketData.issue.trim() || 
                  !newTicketData.client.trim() || 
                  !newTicketData.ticketType || 
                  (newTicketData.ticketType !== 'New Site' && (!newTicketData.estateOrBuilding.trim() || !newTicketData.cmlLocation.trim())) ||
                  (newTicketData.ticketType !== 'New Site' && newTicketData.hasDependencies && !newTicketData.dependencyName.trim()) ||
                  (newTicketData.ticketType === 'New Site' && !newTicketData.siteName.trim())
                }
                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium disabled:opacity-50"
              >
                {isSubmitting || uploadingFiles ? 'Creating...' : 'Open Ticket'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewTicketForm(false);
                  setNewTicketData({ 
                    issue: '', 
                    location: 'remote', 
                    client: '', 
                    clickupTicket: '', 
                    hasDependencies: false, 
                    dependencyName: '', 
                    ticketType: '', 
                    estateOrBuilding: '', 
                    cmlLocation: '',
                    siteName: '',
                    installers: [],
                    installerInput: '',
                    dependencies: [],
                    dependencyInput: '',
                    targetDate: '',
                    attachments: [],
                    siteFiles: []
                  });
                }}
                className="px-5 py-3 rounded-xl bg-slate-700 text-slate-300"
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
                activeTab === 'open' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400'
              }`}
            >
              Open Tickets ({openTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'closed' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'
              }`}
            >
              Closed Tickets ({closedTickets.length})
            </button>
          </div>
        </div>

        {/* Tickets List */}
        <section>
          {loadingTickets ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : activeTab === 'open' ? (
            openTickets.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-slate-500">No open tickets. Great job!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {openTickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 rounded-2xl bg-slate-800/40 border border-amber-500/30">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                            {ticket.ticket_number}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs">
                            {ticket.client}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs ${
                            ticket.location === 'on-site' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-violet-500/20 text-violet-400'
                          }`}>
                            {ticket.location === 'on-site' ? '📍 On-Site' : '🌐 Remote'}
                          </span>
                          {ticket.clickup_ticket && (
                            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs">
                              🔗 {ticket.clickup_ticket}
                            </span>
                          )}
                          {ticket.has_dependencies && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs">
                              ⚠️ Has Dependencies
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(ticket.created_at).toLocaleDateString('en-ZA', { 
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">Open</span>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Issue</p>
                      <p className="text-slate-200">{ticket.issue}</p>
                    </div>

                    {/* New Site ticket fields */}
                    {ticket.ticket_type === 'New Site' && (
                      <div className="mb-4 space-y-3">
                        {ticket.site_name && (
                          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                            <p className="text-xs text-cyan-400 mb-1">Site Name</p>
                            <p className="text-sm text-slate-300">{ticket.site_name}</p>
                          </div>
                        )}
                        {ticket.installers && ticket.installers.length > 0 && (
                          <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <p className="text-xs text-violet-400 mb-2">Installers</p>
                            <div className="flex flex-wrap gap-2">
                              {ticket.installers.map((installer, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs">
                                  {installer}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ticket.dependencies && ticket.dependencies.length > 0 && (
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-400 mb-2">Dependencies</p>
                            <div className="flex flex-wrap gap-2">
                              {ticket.dependencies.map((dep, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs">
                                  {dep}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {ticket.target_date && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs text-emerald-400 mb-1">Target Date</p>
                            <p className="text-sm text-slate-300">{new Date(ticket.target_date).toLocaleDateString('en-ZA')}</p>
                          </div>
                        )}
                        {ticket.site_files && ticket.site_files.length > 0 && (
                          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-blue-400 mb-2">Site Files</p>
                            <div className="space-y-2">
                              {ticket.site_files.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {file.label || 'File'}: {file.name}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regular ticket dependencies */}
                    {ticket.has_dependencies && ticket.dependency_name && ticket.ticket_type !== 'New Site' && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <p className="text-xs text-rose-400 mb-1">Dependency</p>
                        <p className="text-sm text-slate-300">{ticket.dependency_name}</p>
                      </div>
                    )}

                    {/* Attachments for regular tickets */}
                    {ticket.attachments && ticket.attachments.length > 0 && ticket.ticket_type !== 'New Site' && (
                      <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <p className="text-xs text-indigo-400 mb-2">Attachments</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {ticket.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group"
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-24 object-cover rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs">{attachment.name}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Existing Updates */}
                    {ticket.updates && ticket.updates.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">Updates</p>
                        <div className="space-y-2">
                          {ticket.updates.map((update, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                              <p className="text-sm text-slate-300">{update.text}</p>
                              <p className="text-xs text-blue-400 mt-1">
                                {new Date(update.timestamp).toLocaleDateString('en-ZA', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Update Section */}
                    {updatingTicketId === ticket.id ? (
                      <div className="mb-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 animate-fade-in">
                        <h4 className="text-sm font-semibold text-blue-400 mb-3">Add Update</h4>
                        <textarea
                          value={newUpdateText}
                          onChange={(e) => setNewUpdateText(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-blue-500 outline-none resize-none mb-3"
                          placeholder="Enter update details..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddUpdate(ticket.id)}
                            disabled={!newUpdateText.trim()}
                            className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
                          >
                            Save Update
                          </button>
                          <button
                            onClick={() => { setUpdatingTicketId(null); setNewUpdateText(''); }}
                            className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setUpdatingTicketId(ticket.id)}
                        className="mb-4 w-full px-4 py-2 rounded-xl border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Update
                      </button>
                    )}

                    {/* Auto Time Tracker Section */}
                    <div className="mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-violet-400 font-medium">⏱️ Auto Time Tracked</span>
                        <span className="text-sm font-bold text-violet-300">
                          {(() => {
                            // Calculate total time including current elapsed time
                            const loggedTime = ticket.total_time_minutes || 0;
                            const lastUpdateTime = ticket.updates && ticket.updates.length > 0 
                              ? new Date(ticket.updates[ticket.updates.length - 1].timestamp).getTime()
                              : new Date(ticket.created_at).getTime();
                            const currentElapsed = Math.round((new Date().getTime() - lastUpdateTime) / (1000 * 60));
                            const totalMinutes = loggedTime + currentElapsed;
                            return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                          })()}
                        </span>
                      </div>
                      
                      {/* Time Logs */}
                      {ticket.time_logs && ticket.time_logs.length > 0 ? (
                        <div className="max-h-32 overflow-y-auto">
                          {ticket.time_logs.map((log: { minutes: number; description: string; timestamp: string; logged_by?: string }, idx: number) => {
                            // For the initial "Ticket opened" log with 0 minutes, show actual elapsed time
                            const isInitialLog = log.description === 'Ticket opened' && log.minutes === 0 && idx === 0;
                            const displayMinutes = isInitialLog && ticket.status === 'open'
                              ? Math.round((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60))
                              : log.minutes;
                            
                            return (
                              <div key={idx} className="text-xs py-1.5 border-b border-violet-500/10 last:border-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <span className="text-violet-300 font-medium">
                                      {displayMinutes > 0 ? `${displayMinutes}m` : '0m'}
                                      {isInitialLog && ticket.status === 'open' && (
                                        <span className="text-violet-400/70 ml-1 text-xs">(live)</span>
                                      )}
                                    </span>
                                    <span className="text-slate-400 mx-1">-</span>
                                    <span className="text-slate-300">{log.description}</span>
                                  </div>
                                  <span className="text-slate-500 text-xs whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {log.logged_by && log.logged_by !== 'System' && (
                                  <p className="text-xs text-slate-500 mt-0.5">by {log.logged_by}</p>
                                )}
                              </div>
                            );
                          })}
                          {/* Show additional current elapsed time if there are updates */}
                          {ticket.status === 'open' && ticket.updates && ticket.updates.length > 0 && (() => {
                            const lastUpdateTime = new Date(ticket.updates[ticket.updates.length - 1].timestamp).getTime();
                            const currentElapsed = Math.round((new Date().getTime() - lastUpdateTime) / (1000 * 60));
                            return currentElapsed > 0 ? (
                              <div className="text-xs py-1.5 border-t border-violet-500/20 mt-1 pt-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <span className="text-violet-300 font-medium">{currentElapsed}m</span>
                                    <span className="text-slate-400 mx-1">-</span>
                                    <span className="text-slate-300 italic">Currently tracking since last update</span>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500 italic mb-2">Time tracking started when ticket was opened.</p>
                          {ticket.status === 'open' && (() => {
                            const elapsed = Math.round((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60));
                            return (
                              <p className="text-xs text-violet-300">
                                Current elapsed time: {Math.floor(elapsed / 60)}h {elapsed % 60}m
                              </p>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {closingTicketId === ticket.id ? (
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-emerald-400">Close Ticket</h4>
                          <div className="text-xs text-slate-500">
                            ⏱ Time elapsed: {Math.round((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60))} min
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-2">Resolution <span className="text-rose-400">*</span></label>
                            <textarea
                              value={closeTicketData.resolution}
                              onChange={(e) => setCloseTicketData({ ...closeTicketData, resolution: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-emerald-500 outline-none resize-none"
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
                              className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-white disabled:opacity-50"
                            >
                              Close Ticket
                            </button>
                            <button
                              onClick={() => { setClosingTicketId(null); setCloseTicketData({ resolution: '' }); }}
                              className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setClosingTicketId(ticket.id)}
                        className="w-full px-4 py-2 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Resolve & Close Ticket
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            closedTickets.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-slate-500">No closed tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {closedTickets.map((ticket) => (
                  <div key={ticket.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold font-mono">
                            {ticket.ticket_number}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-400 text-xs">
                            {ticket.client}
                          </span>
                          {ticket.response_time_minutes && ticket.response_time_minutes > 0 && (
                            <span className={`px-2.5 py-1 rounded-lg text-xs ${
                              ticket.response_time_minutes <= 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              ⏱ {ticket.response_time_minutes} min
                            </span>
                          )}
                          {ticket.has_dependencies && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs">
                              ⚠️ Dependency
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          Closed: {ticket.closed_at && new Date(ticket.closed_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">Closed</span>
                    </div>

                    {ticket.has_dependencies && ticket.dependency_name && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <p className="text-xs text-rose-400 mb-1">Dependency</p>
                        <p className="text-sm text-slate-300">{ticket.dependency_name}</p>
                      </div>
                    )}

                    {/* Updates for closed tickets */}
                    {ticket.updates && ticket.updates.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">Updates ({ticket.updates.length})</p>
                        <div className="space-y-2">
                          {ticket.updates.map((update, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                              <p className="text-sm text-slate-300">{update.text}</p>
                              <p className="text-xs text-blue-400 mt-1">
                                {new Date(update.timestamp).toLocaleDateString('en-ZA', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-slate-900/50">
                        <p className="text-xs text-slate-500 mb-1">Issue</p>
                        <p className="text-sm text-slate-300">{ticket.issue}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-400 mb-1">Resolution</p>
                        <p className="text-sm text-slate-300">{ticket.resolution}</p>
                      </div>
                    </div>

                    {/* Auto Time Tracked for closed tickets */}
                    {(ticket.total_time_minutes || (ticket.time_logs && ticket.time_logs.length > 0)) && (
                      <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-violet-400 font-medium">⏱️ Auto Time Tracked</span>
                          <span className="text-sm font-bold text-violet-300">
                            {ticket.total_time_minutes ? `${Math.floor(ticket.total_time_minutes / 60)}h ${ticket.total_time_minutes % 60}m` : '0h 0m'}
                          </span>
                        </div>
                        {ticket.time_logs && ticket.time_logs.length > 0 && (
                          <div className="max-h-32 overflow-y-auto">
                            {ticket.time_logs.map((log: { minutes: number; description: string; timestamp: string; logged_by?: string }, idx: number) => (
                              <div key={idx} className="text-xs py-1.5 border-b border-violet-500/10 last:border-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <span className="text-violet-300 font-medium">{log.minutes}m</span>
                                    <span className="text-slate-400 mx-1">-</span>
                                    <span className="text-slate-300">{log.description}</span>
                                  </div>
                                  <span className="text-slate-500 text-xs whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                {log.logged_by && (
                                  <p className="text-xs text-slate-500 mt-0.5">by {log.logged_by}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}

