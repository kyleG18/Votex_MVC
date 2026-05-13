// Axios Configuration - Reusable Axios Instance
// Reference: Node-Express-API-MVC-CRUD Lecture by Paulo Jay Christian P. De Guzman, LPT
//
// Instead of configuring every request individually, we create one shared
// instance with a base URL and default headers.
// This file is placed in src/api/axios.js as instructed in the lecture.

// Install axios first: npm install axios
import axios from 'axios';

// axios.create() builds a custom instance with preset config
const api = axios.create({
  // All requests will prefix this URL automatically
  baseURL: 'http://localhost:5000',
  headers: {
    // Tell the server we're sending and expecting JSON
    'Content-Type': 'application/json',
  },
});

// Export the instance so other files can import and use it
export default api;
