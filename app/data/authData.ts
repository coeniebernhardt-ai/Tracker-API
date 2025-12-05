// Default passwords for each team member (can be changed by admin)
export const defaultPasswords: Record<string, string> = {
  andreas: 'AG2024!',
  cornett: 'CN2024!',
  lisandro: 'LD2024!',
  lucas: 'LB2024!',
  marcellus: 'MH2024!',
  'coenie-test': 'CT2024!'
};

// Auth utility functions
export function getPassword(memberId: string): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(`password-${memberId}`);
  return stored || defaultPasswords[memberId] || '';
}

export function setPassword(memberId: string, password: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`password-${memberId}`, password);
}

export function getAllPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return defaultPasswords;
  
  const passwords: Record<string, string> = {};
  Object.keys(defaultPasswords).forEach(memberId => {
    passwords[memberId] = getPassword(memberId);
  });
  return passwords;
}

export function verifyPassword(memberId: string, inputPassword: string): boolean {
  const correctPassword = getPassword(memberId);
  return inputPassword === correctPassword;
}

export function isLoggedIn(memberId: string): boolean {
  if (typeof window === 'undefined') return false;
  const session = sessionStorage.getItem(`session-${memberId}`);
  return session === 'authenticated';
}

export function login(memberId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`session-${memberId}`, 'authenticated');
}

export function logout(memberId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`session-${memberId}`);
}

