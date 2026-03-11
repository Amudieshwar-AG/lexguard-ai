export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_PREFIX = "/api/v1";

export const ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}${API_PREFIX}/documents/upload`,
  ANALYZE: `${API_BASE_URL}${API_PREFIX}/analysis/analyze`,
  REPORTS: `${API_BASE_URL}${API_PREFIX}/reports`,
  CHAT: `${API_BASE_URL}${API_PREFIX}/chat/message`,
  NEGOTIATION: `${API_BASE_URL}${API_PREFIX}/negotiation`,
};
