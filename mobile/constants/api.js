// Loaded from mobile/.env (or build-time env) because Expo only exposes EXPO_PUBLIC_* variables to app code.
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

export const API_URL = envApiUrl && envApiUrl.trim() ? envApiUrl.trim() : 'http://localhost:5000';
