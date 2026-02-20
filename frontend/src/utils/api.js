import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // send httpOnly cookie on every request
  headers: { "Content-Type": "application/json" },
});

// ── Auth ──────────────────────────────────────────────────────
export const signUp = (data) => api.post("/user/signup", data);
export const signIn = (data) => api.post("/user/signin", data);
export const signOut = () => api.post("/user/logout");
export const checkLogin = () => api.get("/user/check-login");
export const checkEmail = (email) => api.get(`/user/check-email?email=${email}`);

// ── URLs ──────────────────────────────────────────────────────
export const createUrl = (data) => api.post("/url", data);
export const getMyUrls = () => api.get(`/url/my?t=${Date.now()}`);
export const getAnalytics = (shortId) => api.get(`/url/analytics/${shortId}`);
export const getQRCode = (shortId) => api.get(`/url/qrcode/${shortId}`);
export const editUrl = (shortId, data) => api.patch(`/url/${shortId}`, data);
export const deleteUrl = (shortId) => api.delete(`/url/${shortId}`);

export default api;
