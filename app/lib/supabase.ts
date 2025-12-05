import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar: string;
  avatar_url?: string;
  definition?: string;
  responsibilities?: string[];
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  user_id: string;
  client: string;
  clickup_ticket?: string;
  location: 'on-site' | 'remote';
  status: 'open' | 'closed';
  issue: string;
  resolution?: string;
  response_time_minutes?: number;
  created_at: string;
  closed_at?: string;
  created_by?: string;
  has_dependencies?: boolean;
  dependency_name?: string;
  ticket_type?: 'Hardware' | 'Software';
  estate_or_building?: string;
  cml_location?: string;
  updates?: { text: string; timestamp: string }[];
  // Joined data
  profile?: Profile;
}

// Auth helpers
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string, metadata: { full_name: string; role: string; avatar: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(userId?: string): Promise<Profile | null> {
  try {
    let uid = userId;
    
    if (!uid) {
      const user = await getCurrentUser();
      uid = user?.id;
      console.log('getCurrentProfile: got user from auth =', uid);
    } else {
      console.log('getCurrentProfile: using provided userId =', uid);
    }
    
    if (!uid) {
      console.log('getCurrentProfile: No user found');
      return null;
    }

    console.log('getCurrentProfile: Fetching profile for user', uid);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log('getCurrentProfile: TIMEOUT after 5 seconds');
        resolve(null);
      }, 5000);
    });

    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
      .then(({ data, error }) => {
        console.log('getCurrentProfile: Result =', { data, error });
        if (error) {
          console.error('getCurrentProfile: Error:', error.message, error.details, error.hint);
          return null;
        }
        return data;
      });

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    return result;
  } catch (err) {
    console.error('getCurrentProfile: Exception:', err);
    return null;
  }
}

// Profile helpers
export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return data || [];
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// Ticket helpers
export async function getTicketsByUserId(userId: string): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }

  return data || [];
}

export async function getAllTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      profile:profiles!tickets_user_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all tickets:', error);
    return [];
  }

  return data || [];
}

export async function createTicket(ticket: {
  user_id: string;
  client: string;
  clickup_ticket?: string;
  location: 'on-site' | 'remote';
  issue: string;
  created_by?: string;
  has_dependencies?: boolean;
  dependency_name?: string;
  ticket_type?: 'Hardware' | 'Software';
  estate_or_building?: string;
  cml_location?: string;
}): Promise<{ data: Ticket | null; error: Error | null }> {
  // Get user profile to get avatar for ticket number
  const profile = await getProfileById(ticket.user_id);
  if (!profile) {
    return { data: null, error: new Error('User profile not found') };
  }

  // Generate ticket number
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  // Get count of tickets for this user today
  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', ticket.user_id)
    .like('ticket_number', `${profile.avatar}-${dateStr}%`);

  const sequence = String((count || 0) + 1).padStart(3, '0');
  const ticketNumber = `${profile.avatar}-${dateStr}-${sequence}`;

  const insertData = {
    ...ticket,
    ticket_number: ticketNumber,
    status: 'open'
  };
  console.log('Inserting ticket:', insertData);

  const { data, error } = await supabase
    .from('tickets')
    .insert(insertData)
    .select()
    .single();

  console.log('Insert result:', { data, error });
  return { data, error: error as Error | null };
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function closeTicket(id: string, resolution: string, responseTimeMinutes?: number) {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'closed',
      resolution,
      response_time_minutes: responseTimeMinutes,
      closed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function addTicketUpdate(ticketId: string, updateText: string) {
  // First get the current ticket to get existing updates
  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select('updates')
    .eq('id', ticketId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Create new update with timestamp
  const newUpdate = {
    text: updateText,
    timestamp: new Date().toISOString()
  };

  // Append to existing updates or create new array
  const existingUpdates = ticket?.updates || [];
  const updatedUpdates = [...existingUpdates, newUpdate];

  // Update the ticket
  const { data, error } = await supabase
    .from('tickets')
    .update({ updates: updatedUpdates })
    .eq('id', ticketId)
    .select()
    .single();

  return { data, error };
}

export async function deleteTicket(id: string) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  return { error };
}

// Profile picture upload
export async function uploadProfilePicture(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: null, error: uploadError as Error };
    }

    // Get public URL
    const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return { url: null, error: updateError as Error };
    }

    return { url: data.publicUrl, error: null };
  } catch (err) {
    console.error('Upload exception:', err);
    return { url: null, error: err as Error };
  }
}

// Stats helpers
export async function getTicketStats(userId?: string, dateFrom?: string, dateTo?: string) {
  let query = supabase.from('tickets').select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      total: 0,
      open: 0,
      closed: 0,
      onSite: 0,
      remote: 0,
      avgResponseTime: 0
    };
  }

  const closed = data.filter(t => t.status === 'closed');
  const withResponseTime = closed.filter(t => t.response_time_minutes && t.response_time_minutes > 0);
  const avgResponseTime = withResponseTime.length > 0
    ? withResponseTime.reduce((sum, t) => sum + (t.response_time_minutes || 0), 0) / withResponseTime.length
    : 0;

  return {
    total: data.length,
    open: data.filter(t => t.status === 'open').length,
    closed: closed.length,
    onSite: data.filter(t => t.location === 'on-site').length,
    remote: data.filter(t => t.location === 'remote').length,
    avgResponseTime: Math.round(avgResponseTime)
  };
}

