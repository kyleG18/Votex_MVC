/**
 * Formats an image path to be usable in an <img> src attribute.
 * Handles both local paths (requiring the API prefix) and 
 * full URLs (like Cloudinary links).
 */
export const formatImageUrl = (path) => {
  if (!path) return null;
  
  // If it's already a full URL (http or https), return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Otherwise, prefix it with the API base URL
  // Note: Vite will replace import.meta.env.VITE_API_URL during build
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};
