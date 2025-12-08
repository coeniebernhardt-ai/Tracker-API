'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { getAllProfiles, getAllTickets, createTicket, deleteTicket, uploadProfilePicture, uploadTicketAttachment, updateTicket, Profile, Ticket } from '../lib/supabase';
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

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  
  // Force re-render every minute to update time tracker
  useTimeUpdate();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStatsExport, setShowStatsExport] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  
  const [newTicketData, setNewTicketData] = useState({
    issue: '',
    location: 'remote' as 'on-site' | 'remote',
    client: '',
    clickupTicket: '',
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

  // Stats export state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exportUser, setExportUser] = useState('all');

  // Profile picture upload state
  const [uploadingFor, setUploadingFor] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // User management state
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Redirect if not admin - with better loading state
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, isAdmin, router]);

  // Load data - only if authenticated and admin
  useEffect(() => {
    if (!loading && user && isAdmin) {
      loadData();
    }
  }, [user, isAdmin, loading]);

  // Set default date range
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    console.log('loadData: Starting...');
    setLoadingData(true);
    try {
      console.log('loadData: Current user:', user?.id);
      console.log('loadData: Current profile:', profile);
      console.log('loadData: Is admin?', isAdmin);
      
      console.log('loadData: Fetching profiles...');
      const profilesData = await getAllProfiles();
      console.log('loadData: Profiles result:', profilesData);
      
      console.log('loadData: Fetching tickets...');
      const ticketsData = await getAllTickets();
      console.log('loadData: Tickets result:', ticketsData);
      
      setProfiles(profilesData);
      setTickets(ticketsData);
    } catch (err) {
      console.error('loadData: Exception:', err);
    }
    setLoadingData(false);
    console.log('loadData: Done');
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !newTicketData.issue.trim() || !newTicketData.client.trim() || !newTicketData.ticketType) return;
    
    // Validation for regular tickets
    if (newTicketData.ticketType !== 'New Site') {
      if (!newTicketData.estateOrBuilding.trim() || !newTicketData.cmlLocation.trim()) return;
    }
    
    // Validation for New Site tickets
    if (newTicketData.ticketType === 'New Site') {
      if (!newTicketData.siteName.trim()) return;
    }

    setUploadingFiles(true);

    try {
      // Create ticket first (without files)
      const ticketPayload: any = {
        user_id: selectedUserId,
        client: newTicketData.client.trim(),
        clickup_ticket: newTicketData.clickupTicket.trim() || undefined,
        location: newTicketData.location,
        issue: newTicketData.issue.trim(),
        created_by: user?.id,
        ticket_type: newTicketData.ticketType,
      };

      // Add regular ticket fields
      if (newTicketData.ticketType !== 'New Site') {
        ticketPayload.estate_or_building = newTicketData.estateOrBuilding.trim();
        ticketPayload.cml_location = newTicketData.cmlLocation.trim();
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
      
      await loadData();
      setNewTicketData({ 
        issue: '', 
        location: 'remote', 
        client: '', 
        clickupTicket: '', 
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
      setSelectedUserId('');
      setShowCreateForm(false);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    
    const { error } = await deleteTicket(ticketId);
    if (!error) {
      setTickets(tickets.filter(t => t.id !== ticketId));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadingFor || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    const { publicUrl, error } = await uploadProfilePicture(uploadingFor.id, file);
    setUploading(false);

    if (error) {
      alert('Failed to upload image: ' + error.message);
    } else {
      await loadData();
      setUploadingFor(null);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    if (filterUser !== 'all' && ticket.user_id !== filterUser) return false;
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const totalOpen = tickets.filter(t => t.status === 'open').length;
  const totalClosed = tickets.filter(t => t.status === 'closed').length;
  const totalOnSite = tickets.filter(t => t.location === 'on-site').length;
  const totalRemote = tickets.filter(t => t.location === 'remote').length;

  // Export functions
  const getFilteredTicketsForExport = () => {
    let filtered = [...tickets];
    
    if (exportUser !== 'all') {
      filtered = filtered.filter(t => t.user_id === exportUser);
    }
    
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.created_at) <= toDate);
    }
    
    return filtered;
  };

  const exportToCSV = () => {
    const exportTickets = getFilteredTicketsForExport();
    
    const headers = [
      'Ticket Number',
      'Team Member',
      'Client Name',
      'Type (Hardware/Software)',
      'Estate or Building',
      'Location (as per CML)',
      'Work Type (On-Site/Remote)',
      'ClickUp Ticket Reference',
      'Ticket Status',
      'Issue Description',
      'Resolution Description',
      'Has Dependencies (Yes/No)',
      'Dependency Company/Department',
      'Ticket Updates',
      'Total Time Tracked (Minutes)',
      'Time Log Details',
      'Response Time (Minutes)',
      'Date Created',
      'Date Closed'
    ];
    
    const rows = exportTickets.map(t => {
      const memberProfile = profiles.find(p => p.id === t.user_id);
      
      // Format updates as a single string with timestamps
      const updatesFormatted = t.updates && t.updates.length > 0
        ? t.updates.map((u: { text: string; timestamp: string }) => 
            `[${new Date(u.timestamp).toLocaleString('en-ZA')}] ${u.text}`
          ).join(' | ')
        : '';
      
      // Format time logs as a single string
      const timeLogsFormatted = t.time_logs && t.time_logs.length > 0
        ? t.time_logs.map((log: { minutes: number; description: string; timestamp: string; logged_by?: string }) => 
            `[${new Date(log.timestamp).toLocaleString('en-ZA')}] ${log.minutes}min - ${log.description}${log.logged_by ? ` (${log.logged_by})` : ''}`
          ).join(' | ')
        : '';
      
      return [
        t.ticket_number || '',
        memberProfile?.full_name || 'Unknown',
        t.client || '',
        t.ticket_type || '',
        t.estate_or_building || '',
        t.cml_location || '',
        t.location === 'on-site' ? 'On-Site' : t.location === 'remote' ? 'Remote' : '',
        t.clickup_ticket || '',
        t.status === 'open' ? 'Open' : t.status === 'closed' ? 'Closed' : '',
        `"${(t.issue || '').replace(/"/g, '""')}"`,
        `"${(t.resolution || '').replace(/"/g, '""')}"`,
        t.has_dependencies ? 'Yes' : 'No',
        t.dependency_name || '',
        `"${updatesFormatted.replace(/"/g, '""')}"`,
        t.total_time_minutes || '',
        `"${timeLogsFormatted.replace(/"/g, '""')}"`,
        t.response_time_minutes || '',
        new Date(t.created_at).toLocaleString('en-ZA'),
        t.closed_at ? new Date(t.closed_at).toLocaleString('en-ZA') : ''
      ];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kpi-report-${dateFrom}-to-${dateTo}.csv`;
    link.click();
  };

  const getExportStats = () => {
    const exportTickets = getFilteredTicketsForExport();
    const closed = exportTickets.filter(t => t.status === 'closed');
    const withResponseTime = closed.filter(t => t.response_time_minutes && t.response_time_minutes > 0);
    const avgResponseTime = withResponseTime.length > 0
      ? withResponseTime.reduce((sum, t) => sum + (t.response_time_minutes || 0), 0) / withResponseTime.length
      : 0;
    
    return {
      total: exportTickets.length,
      closed: closed.length,
      open: exportTickets.filter(t => t.status === 'open').length,
      closedRate: exportTickets.length > 0 ? ((closed.length / exportTickets.length) * 100).toFixed(1) : '0',
      avgResponseTime: avgResponseTime.toFixed(0)
    };
  };

  const getAvatarGradient = (name: string) => {
    const colors = ['from-cyan-400 to-blue-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Show loading or unauthorized state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show unauthorized state if not admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-4">You don't have permission to access this page.</p>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show unauthorized state if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-4">You don't have administrator privileges to access this page.</p>
        <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300">Go to Dashboard</Link>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Loading tickets and team data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-radial-gradient">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              
              <div className="relative group">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name} width={48} height={48} className="w-12 h-12 rounded-xl object-cover shadow-lg" />
                ) : (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg`}>
                    {profile?.avatar || 'A'}
                  </div>
                )}
                {profile && (
                  <button 
                    onClick={() => setUploadingFor(profile)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-400"
                    title="Upload profile picture"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-white">{profile?.full_name || 'Admin'}</h1>
                <p className="text-sm text-slate-400">{profile?.role || 'Administrator'} • Admin</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setShowUserManagement(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Manage Users
              </button>
              <button onClick={() => setShowStatsExport(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Stats
              </button>
              <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-lg hover:shadow-cyan-500/25 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Ticket
              </button>
              <button onClick={handleSignOut} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-white">{tickets.length}</p>
          </div>
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs text-amber-400 mb-1">Open</p>
            <p className="text-3xl font-bold text-amber-400">{totalOpen}</p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-xs text-emerald-400 mb-1">Closed</p>
            <p className="text-3xl font-bold text-emerald-400">{totalClosed}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 mb-1">Team Members</p>
            <p className="text-3xl font-bold text-white">{profiles.length}</p>
          </div>
        </section>

        {/* Team Members */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Team Members</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {profiles.map(p => {
              const memberTickets = tickets.filter(t => t.user_id === p.id);
              const openCount = memberTickets.filter(t => t.status === 'open').length;
              const closedCount = memberTickets.filter(t => t.status === 'closed').length;
              return (
                <div key={p.id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      {p.avatar_url ? (
                        <Image src={p.avatar_url} alt={p.full_name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarGradient(p.full_name)} flex items-center justify-center text-white font-bold text-sm`}>
                          {p.avatar}
                        </div>
                      )}
                      <button 
                        onClick={() => setUploadingFor(p)}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-400"
                        title="Upload profile picture"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.full_name.split(' ')[0]}</p>
                      <p className="text-xs text-slate-500 truncate">{p.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-amber-400">{openCount} open</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400">{closedCount} closed</span>
                  </div>
                  {p.is_admin && <span className="mt-2 inline-block px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-400">Admin</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Filter by Member</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm">
              <option value="all">All Members</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Filter by Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')} className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm">
              <option value="all">All Status</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
            </select>
          </div>
          <div className="ml-auto text-sm text-slate-400">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        </section>

        {/* Tickets List */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">All Tickets</h2>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-slate-500">No tickets found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map(ticket => {
                const memberProfile = profiles.find(p => p.id === ticket.user_id);
                return (
                  <div key={ticket.id} className={`p-4 rounded-xl border ${ticket.status === 'open' ? 'bg-slate-800/40 border-amber-500/30' : 'bg-slate-800/30 border-slate-700/50'}`}>
                    <div className="flex items-start gap-4">
                      {memberProfile?.avatar_url ? (
                        <Image src={memberProfile.avatar_url} alt={memberProfile.full_name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarGradient(memberProfile?.full_name || 'U')} flex items-center justify-center text-white font-bold text-sm`}>
                          {memberProfile?.avatar || 'U'}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${ticket.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                            {ticket.ticket_number}
                          </span>
                          <span className="text-xs text-slate-500">{memberProfile?.full_name}</span>
                          {ticket.client && <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">{ticket.client}</span>}
                          {ticket.clickup_ticket && <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">🔗 {ticket.clickup_ticket}</span>}
                          <span className={`px-2 py-0.5 rounded text-xs ${ticket.location === 'on-site' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-violet-500/20 text-violet-400'}`}>
                            {ticket.location === 'on-site' ? '📍 On-Site' : '🌐 Remote'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${ticket.status === 'open' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {ticket.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-300 mb-2">{ticket.issue}</p>

                        {/* Show ticket details */}
                        <div className="flex flex-wrap gap-2 mb-2 text-xs">
                          {ticket.ticket_type && (
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">{ticket.ticket_type}</span>
                          )}
                          {ticket.estate_or_building && (
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">{ticket.estate_or_building}</span>
                          )}
                          {ticket.cml_location && (
                            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">📍 {ticket.cml_location}</span>
                          )}
                          {ticket.has_dependencies && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">⚠️ {ticket.dependency_name}</span>
                          )}
                        </div>

                        {/* Show Updates */}
                        {ticket.updates && ticket.updates.length > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-blue-400 mb-2">Updates ({ticket.updates.length}):</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {ticket.updates.map((update: { text: string; timestamp: string }, idx: number) => (
                                <div key={idx} className="text-xs">
                                  <span className="text-blue-300">[{new Date(update.timestamp).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}]</span>
                                  <span className="text-slate-300 ml-1">{update.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show Auto Time Tracked */}
                        {(ticket.total_time_minutes || (ticket.time_logs && ticket.time_logs.length > 0)) && (
                          <div className="mt-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-violet-400">⏱️ Auto Time Tracked</p>
                              <span className="text-xs font-bold text-violet-300">
                                {(() => {
                                  // Calculate total time including current elapsed time
                                  const loggedTime = ticket.total_time_minutes || 0;
                                  const lastUpdateTime = ticket.updates && ticket.updates.length > 0 
                                    ? new Date(ticket.updates[ticket.updates.length - 1].timestamp).getTime()
                                    : new Date(ticket.created_at).getTime();
                                  const currentElapsed = ticket.status === 'open' 
                                    ? Math.round((new Date().getTime() - lastUpdateTime) / (1000 * 60))
                                    : 0;
                                  const totalMinutes = loggedTime + currentElapsed;
                                  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                                })()}
                              </span>
                            </div>
                            {ticket.time_logs && ticket.time_logs.length > 0 && (
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {ticket.time_logs.map((log: { minutes: number; description: string; timestamp: string; logged_by?: string }, idx: number) => {
                                  // For the initial "Ticket opened" log with 0 minutes, show actual elapsed time
                                  const isInitialLog = log.description === 'Ticket opened' && log.minutes === 0 && idx === 0;
                                  const displayMinutes = isInitialLog && ticket.status === 'open'
                                    ? Math.round((new Date().getTime() - new Date(ticket.created_at).getTime()) / (1000 * 60))
                                    : log.minutes;
                                  
                                  return (
                                    <div key={idx} className="text-xs">
                                      <span className="text-violet-300 font-medium">
                                        {displayMinutes > 0 ? `${displayMinutes}m` : '0m'}
                                        {isInitialLog && ticket.status === 'open' && (
                                          <span className="text-violet-400/70 ml-1 text-xs">(live)</span>
                                        )}
                                      </span>
                                      <span className="text-slate-400 mx-1">-</span>
                                      <span className="text-slate-300">{log.description}</span>
                                      {log.logged_by && log.logged_by !== 'System' && <span className="text-slate-500 ml-1">(by {log.logged_by})</span>}
                                      <span className="text-slate-500 ml-1 text-xs">
                                        - {new Date(log.timestamp).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  );
                                })}
                                {/* Show additional current elapsed time if there are updates */}
                                {ticket.status === 'open' && ticket.updates && ticket.updates.length > 0 && (() => {
                                  const lastUpdateTime = new Date(ticket.updates[ticket.updates.length - 1].timestamp).getTime();
                                  const currentElapsed = Math.round((new Date().getTime() - lastUpdateTime) / (1000 * 60));
                                  return currentElapsed > 0 ? (
                                    <div className="text-xs pt-1 border-t border-violet-500/20 mt-1">
                                      <span className="text-violet-300 font-medium">{currentElapsed}m</span>
                                      <span className="text-slate-400 mx-1">-</span>
                                      <span className="text-slate-300 italic">Currently tracking since last update</span>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {ticket.status === 'closed' && ticket.resolution && (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-2">
                            <p className="text-xs text-emerald-400 mb-1">Resolution:</p>
                            <p className="text-sm text-slate-300">{ticket.resolution}</p>
                          </div>
                        )}
                        
                        <p className="text-xs text-slate-600 mt-2">
                          Created: {new Date(ticket.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {ticket.closed_at && <> • Closed: {new Date(ticket.closed_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>}
                          {ticket.response_time_minutes && ticket.response_time_minutes > 0 && <> • Response: {ticket.response_time_minutes} min</>}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="shrink-0 p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete ticket"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCreateForm(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700/50 sticky top-0 bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Create Ticket</h2>
                  <button onClick={() => setShowCreateForm(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateTicket} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Assign to <span className="text-rose-400">*</span></label>
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="">Select a team member...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client <span className="text-rose-400">*</span></label>
                  <select
                    value={newTicketData.client}
                    onChange={(e) => setNewTicketData({ ...newTicketData, client: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white appearance-none cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white appearance-none cursor-pointer"
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
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                          className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">ClickUp Ticket <span className="text-slate-500">(optional)</span></label>
                  <input type="text" value={newTicketData.clickupTicket} onChange={(e) => setNewTicketData({ ...newTicketData, clickupTicket: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" placeholder="Enter ClickUp ticket ID..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setNewTicketData({ ...newTicketData, location: 'on-site' })} className={`flex-1 px-4 py-3 rounded-xl border ${newTicketData.location === 'on-site' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>📍 On-Site</button>
                    <button type="button" onClick={() => setNewTicketData({ ...newTicketData, location: 'remote' })} className={`flex-1 px-4 py-3 rounded-xl border ${newTicketData.location === 'remote' ? 'bg-violet-500/20 border-violet-500 text-violet-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>🌐 Remote</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Issue Description <span className="text-rose-400">*</span></label>
                  <textarea value={newTicketData.issue} onChange={(e) => setNewTicketData({ ...newTicketData, issue: e.target.value })} rows={4} required className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white resize-none" placeholder="Describe the issue..." />
                </div>

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
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
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

                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    disabled={
                      uploadingFiles ||
                      !selectedUserId || 
                      !newTicketData.issue.trim() || 
                      !newTicketData.client.trim() || 
                      !newTicketData.ticketType || 
                      (newTicketData.ticketType !== 'New Site' && (!newTicketData.estateOrBuilding.trim() || !newTicketData.cmlLocation.trim())) ||
                      (newTicketData.ticketType === 'New Site' && !newTicketData.siteName.trim())
                    } 
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium disabled:opacity-50"
                  >
                    {uploadingFiles ? 'Creating...' : 'Create Ticket'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTicketData({ 
                        issue: '', 
                        location: 'remote', 
                        client: '', 
                        clickupTicket: '', 
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
            </div>
          </div>
        </div>
      )}

      {/* Stats Export Modal */}
      {showStatsExport && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowStatsExport(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Export Statistics</h2>
                  <button onClick={() => setShowStatsExport(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">From Date</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">To Date</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Team Member</label>
                  <select value={exportUser} onChange={(e) => setExportUser(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="all">All Members (Global Report)</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Preview</h3>
                  {(() => {
                    const stats = getExportStats();
                    return (
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div><p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-xs text-slate-500">Total</p></div>
                        <div><p className="text-2xl font-bold text-emerald-400">{stats.closed}</p><p className="text-xs text-slate-500">Closed ({stats.closedRate}%)</p></div>
                        <div><p className="text-2xl font-bold text-amber-400">{stats.open}</p><p className="text-xs text-slate-500">Open</p></div>
                        <div><p className="text-2xl font-bold text-cyan-400">{stats.avgResponseTime}</p><p className="text-xs text-slate-500">Avg Response (min)</p></div>
                      </div>
                    );
                  })()}
                </div>

                <button onClick={exportToCSV} className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download CSV Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Upload Modal */}
      {uploadingFor && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !uploading && setUploadingFor(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl">
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Upload Profile Picture</h2>
                  <button 
                    onClick={() => !uploading && setUploadingFor(null)} 
                    disabled={uploading}
                    className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Current Avatar */}
                  <div className="flex items-center gap-4 w-full p-4 rounded-xl bg-slate-800/50">
                    {uploadingFor.avatar_url ? (
                      <Image src={uploadingFor.avatar_url} alt={uploadingFor.full_name} width={64} height={64} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getAvatarGradient(uploadingFor.full_name)} flex items-center justify-center text-white font-bold text-xl`}>
                        {uploadingFor.avatar}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-medium text-white">{uploadingFor.full_name}</p>
                      <p className="text-sm text-slate-400">{uploadingFor.role}</p>
                    </div>
                  </div>

                  {/* Upload Area */}
                  <label className={`w-full p-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 cursor-pointer transition-colors ${uploading ? 'border-slate-600 bg-slate-800/30' : 'border-slate-600 hover:border-cyan-500 hover:bg-cyan-500/5'}`}>
                    {uploading ? (
                      <>
                        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="text-center">
                          <p className="text-sm text-white">Click to upload an image</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleProfilePictureUpload} 
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowUserManagement(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-700/50 sticky top-0 bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Manage Users</h2>
                  <button onClick={() => setShowUserManagement(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Password Management Info */}
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">🔐 Password Management</h3>
                  <p className="text-xs text-slate-300 mb-3">
                    To reset a team member&apos;s password, go to your Supabase Dashboard:
                  </p>
                  <a 
                    href="https://supabase.com/dashboard/project/csbliwkldlglbniqmdin/auth/users" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Supabase Auth Dashboard
                  </a>
                </div>

                {/* Team Members List */}
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Team Members ({profiles.length})</h3>
                <div className="space-y-3">
                  {profiles.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <Image src={p.avatar_url} alt={p.full_name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarGradient(p.full_name)} flex items-center justify-center text-white font-bold text-sm`}>
                            {p.avatar}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{p.full_name}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">{p.role}</span>
                        {p.is_admin && (
                          <span className="px-2 py-1 rounded text-xs bg-rose-500/20 text-rose-400">Admin</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New User Info */}
                <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">➕ Add New Team Member</h3>
                  <p className="text-xs text-slate-400 mb-3">
                    New team members can sign up at:
                  </p>
                  <code className="block p-2 rounded bg-slate-900 text-cyan-400 text-xs break-all">
                    https://kpi-tracker-six.vercel.app/login
                  </code>
                  <p className="text-xs text-slate-500 mt-2">
                    They click &quot;Sign up&quot; and create their account. Then you can update their role in Supabase if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
