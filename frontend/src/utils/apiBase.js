// Centralized API base URL – derives from environment variable only.
// In production, VITE_API_BASE_URL must be set to the deployed backend URL.
// In local development, the Vite proxy handles /api/* → localhost:5000.
const raw = import.meta.env.VITE_API_BASE_URL || '';

// Normalize: strip trailing slash to prevent double-slash in URL construction
const API_BASE = raw.endsWith('/') ? raw.slice(0, -1) : raw;

export default API_BASE;
