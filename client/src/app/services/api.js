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

// ─── Books API ───

export async function fetchBooks({ page = 1, limit = 8, search = "", category = "", status = "" } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (status) params.set("status", status);
  const { data } = await api.get(`/books?${params.toString()}`);
  return data; // { books, total, page, totalPages }
}

export async function fetchBook(id) {
  const { data } = await api.get(`/books/${id}`);
  return data; // Book object
}

export async function createBook(bookData) {
  const { data } = await api.post("/books", bookData);
  return data; // { message, book }
}

export async function updateBook(id, bookData) {
  const { data } = await api.put(`/books/${id}`, bookData);
  return data; // { message, book }
}

export async function deleteBook(id) {
  const { data } = await api.delete(`/books/${id}`);
  return data; // { message }
}

// ─── Borrowing API ───

export async function fetchBorrowRecords({ page = 1, limit = 10, search = "", status = "", memberType = "" } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (memberType) params.set("memberType", memberType);
  const { data } = await api.get(`/borrowing?${params.toString()}`);
  return data; // { records, total, page, totalPages }
}

export async function fetchBorrowRecord(id) {
  const { data } = await api.get(`/borrowing/${id}`);
  return data; // BorrowRecord object
}

export async function createBorrowRecord(recordData) {
  const { data } = await api.post("/borrowing", recordData);
  return data; // { message, record }
}

export async function updateBorrowRecord(id, recordData) {
  const { data } = await api.put(`/borrowing/${id}`, recordData);
  return data; // { message, record }
}

export async function returnBook(id) {
  const { data } = await api.post(`/borrowing/${id}/return`);
  return data; // { message, record }
}

export async function renewLoan(id, dueDate) {
  const { data } = await api.post(`/borrowing/${id}/renew`, { dueDate });
  return data; // { message, record }
}

export async function deleteBorrowRecord(id) {
  const { data } = await api.delete(`/borrowing/${id}`);
  return data; // { message }
}

export default api;
