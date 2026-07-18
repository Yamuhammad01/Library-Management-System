import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Dashboard API ───

export async function fetchDashboardStats() {
  const { data } = await api.get("/dashboard/stats");
  return data; // { totalBooks, activeBorrowers, booksBorrowed, overdueReturns }
}

export async function fetchBorrowingActivity() {
  const { data } = await api.get("/dashboard/activity");
  return data; // [{ m, b, r }, ...]
}

export async function fetchCategoryData() {
  const { data } = await api.get("/dashboard/categories");
  return data; // [{ n, v }, ...]
}

export default api;