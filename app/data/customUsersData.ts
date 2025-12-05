// Custom users storage - allows admin to create/edit/delete users

export interface CustomUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
  definition: string;
  responsibilities: string[];
  isCustom: true;
  createdAt: string;
  updatedAt: string;
}

// Get all custom users from localStorage
export function getCustomUsers(): CustomUser[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('custom-users');
  return stored ? JSON.parse(stored) : [];
}

// Save custom users to localStorage
export function saveCustomUsers(users: CustomUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('custom-users', JSON.stringify(users));
}

// Add a new custom user
export function addCustomUser(user: Omit<CustomUser, 'id' | 'isCustom' | 'createdAt' | 'updatedAt'>): CustomUser {
  const users = getCustomUsers();
  const newUser: CustomUser = {
    ...user,
    id: `custom-${Date.now()}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  users.push(newUser);
  saveCustomUsers(users);
  
  // Also set default password
  const initials = user.name.split(' ').map(p => p.charAt(0).toUpperCase()).join('');
  localStorage.setItem(`password-${newUser.id}`, `${initials}2024!`);
  
  return newUser;
}

// Update a custom user
export function updateCustomUser(id: string, updates: Partial<Omit<CustomUser, 'id' | 'isCustom' | 'createdAt'>>): CustomUser | null {
  const users = getCustomUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveCustomUsers(users);
  return users[index];
}

// Delete a custom user
export function deleteCustomUser(id: string): boolean {
  const users = getCustomUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) return false;
  
  saveCustomUsers(filtered);
  
  // Clean up related data
  localStorage.removeItem(`password-${id}`);
  localStorage.removeItem(`tickets-${id}`);
  localStorage.removeItem(`profile-picture-${id}`);
  
  return true;
}

// Generate initials from name
export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

