import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Auth Interceptor: attach JWT to every request ───
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("unilib_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth API ───

export async function loginUser(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data; // { message, user, token }
}

export async function registerUser(fullName, email, password) {
  const { data } = await api.post("/auth/register", { fullName, email, password });
  return data; // { message, user }
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data; // { user }
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout");
  return data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post("/auth/change-password", { currentPassword, newPassword });
  return data;
}

// ─── Dashboard API ───

export async function fetchDashboardStats() {
  const { data } = await api.get("/dashboard/stats");
  return data;
}

export async function fetchBorrowingActivity() {
  const { data } = await api.get("/dashboard/activity");
  return data;
}

export async function fetchCategoryData() {
  const { data } = await api.get("/dashboard/categories");
  return data;
}

export default api;