// Profile picture storage utilities

export function getProfilePicture(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`profile-picture-${userId}`);
}

export function setProfilePicture(userId: string, base64Image: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`profile-picture-${userId}`, base64Image);
}

export function removeProfilePicture(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`profile-picture-${userId}`);
}

// Admin profile picture
export function getAdminProfilePicture(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin-profile-picture');
}

export function setAdminProfilePicture(base64Image: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin-profile-picture', base64Image);
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

