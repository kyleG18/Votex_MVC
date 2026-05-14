import axios from 'axios';

// axios.create() builds a custom instance with preset config
const api = axios.create({
  // Use Vite environment variable in production, fallback to localhost for development
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    // Tell the server we're sending and expecting JSON
    'Content-Type': 'application/json',
  },
});

// Export the instance so other files can import and use it
export default api;
