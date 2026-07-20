import { useState, useMemo } from "react";
import {
  Search, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2,
  ArrowLeft, Calendar, Hash, BookOpen, MoreVertical, Eye,
  Clock, AlertTriangle, CheckCircle, BookMarked,
} from "lucide-react";
import { useMyBorrowingHistory } from "../hooks/useMyBorrowingHistory";
import {
  BookCover, BookStatusBadge, BorrowBadge, DaysLeftPill, CatBadge,
  Avatar, Fld, iCls, iSty, IconBtn, PageBtn, PUR, TODAY, addDays,
} from "../components/BookUI";
import type { BorrowStatus } from "../components/BookUI";

/* ─────────────────────────── TYPES ─────────────────────────── */
interface BorrowRecord {
  _id: string;
  bookId: string;
  bookTitle: string;
  bookCoverColor: string;
  isbn: string;
  memberId: string;
  memberName: string;
  memberType: "student" | "staff";
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: BorrowStatus;
}

type StatusFilter = "all" | "borrowed" | "returned" | "overdue";
type SortField = "borrowDate" | "dueDate" | "returnDate" | "bookTitle";
type SortOrder = "asc" | "desc";

/* ──────────────────────── HELPERS ──────────────────────────── */
function getDaysLeft(dueDate: string): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date(TODAY);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────────── BORROWING HISTORY PAGE ────────────────── */
export default function MyBorrowingHistoryPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortField>("borrowDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [pg, setPg] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const PER = 8;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // Map status filter to API status param
  const apiStatus = statusFilter === "all" ? "" : statusFilter;

  // API hooks
  const { data, isLoading, error, refetch } = useMyBorrowingHistory({
    page: pg,
    limit: PER,
    search,
    status: apiStatus,
    sortBy,
    sortOrder,
  });

  const records: BorrowRecord[] = data?.records || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Stats
  const stats = useMemo(() => {
    return {
      total: records.length,
      borrowed: records.filter(r => r.status === "borrowed").length,
      returned: records.filter(r => r.status === "returned").length,
      overdue: records.filter(r => r.status === "overdue").length,
    };
  }, [records]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPg(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span style={{ fontSize: 10, color: "#9CA3AF" }}>↕</span>;
    return <span style={{ fontSize: 10, color: PUR }}>{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const statusFilters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All Records", count: total },
    { id: "borrowed", label: "Borrowed", count: records.filter(r => r.status === "borrowed").length },
    { id: "returned", label: "Returned", count: records.filter(r => r.status === "returned").length },
    { id: "overdue", label: "Overdue", count: records.filter(r => r.status === "overdue").length },
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{ background: "#1F2937", color: "#fff", fontSize: 13, fontWeight: 500, minWidth: 280 }}>
          <CheckCircle2 size={15} style={{ color: "#10B981", flexShrink: 0 }} />{toast}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">My Borrowing History</h1>
          <p className="text-xs text-gray-400 mt-0.5">My Account › Borrowing History</p>
        </div>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}>
          <p className="text-xs font-medium text-gray-500">Total Borrowed</p>
          <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}>
          <p className="text-xs font-medium text-gray-500">Currently Borrowed</p>
          <p className="text-2xl font-extrabold" style={{ color: "#2563EB" }}>{stats.borrowed}</p>
        </div>
        <div className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}>
          <p className="text-xs font-medium text-gray-500">Returned</p>
          <p className="text-2xl font-extrabold" style={{ color: "#059669" }}>{stats.returned}</p>
        </div>
        <div className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}>
          <p className="text-xs font-medium text-gray-500">Overdue</p>
          <p className="text-2xl font-extrabold" style={{ color: "#DC2626" }}>{stats.overdue}</p>
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl flex flex-col" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}>
        {/* Filters + search */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-gray-100">
          <div className="flex items-center gap-0">
            {statusFilters.map(f => (
              <button key={f.id} onClick={() => { setStatusFilter(f.id); setPg(1); }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative"
                style={{ color: statusFilter === f.id ? PUR : "#6B7280" }}>
                {f.label}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: statusFilter === f.id ? PUR : "#F3F4F6", color: statusFilter === f.id ? "#fff" : "#6B7280" }}>
                  {f.count}
                </span>
                {statusFilter === f.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: PUR }} />}
              </button>
            ))}
          </div>
          <div className="relative pb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPg(1); }}
              placeholder="Search by title or ISBN…"
              className="text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600"
              style={{ padding: "8px 12px 8px 30px", width: 240 }} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Book Cover", "Book Title", "Borrow Date", "Due Date", "Return Date", "Status"].map(h => (
                  <th key={h} className="text-left font-semibold text-gray-400 py-3"
                    style={{ fontSize: 11, letterSpacing: "0.05em", padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">Loading records...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="text-center py-16 text-red-500 text-sm">Failed to load records.</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No records found.</td></tr>
              ) : records.map((r, i) => {
                const isOverdue = r.status === "overdue";
                return (
                  <tr key={r._id}
                    style={{ borderBottom: "1px solid #F9FAFB", background: isOverdue ? "#FFFBFB" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    className="hover:bg-purple-50 transition-colors">
                    {/* Book Cover */}
                    <td style={{ padding: "10px 16px" }}>
                      <BookCover color={r.bookCoverColor} title={r.bookTitle} size="sm" />
                    </td>
                    {/* Book Title */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-gray-900 leading-tight" style={{ maxWidth: 200 }}>{r.bookTitle}</p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "monospace" }}>{r.isbn}</p>
                      </div>
                    </td>
                    {/* Borrow Date */}
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {fmtDate(r.borrowDate)}
                    </td>
                    {/* Due Date */}
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      <div className="flex flex-col gap-1">
                        <span>{fmtDate(r.dueDate)}</span>
                        {r.status === "borrowed" && (
                          <span className="text-xs" style={{ color: getDaysLeft(r.dueDate) <= 3 ? "#DC2626" : "#D97706" }}>
                            {getDaysLeft(r.dueDate)} days left
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Return Date */}
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {r.returnDate ? fmtDate(r.returnDate) : "—"}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "10px 16px" }}>
                      <BorrowBadge status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing <strong>{records.length === 0 ? 0 : (pg - 1) * PER + 1}–{Math.min(pg * PER, total)}</strong> of <strong>{total}</strong> records
          </p>
          <div className="flex items-center gap-1">
            <PageBtn disabled={pg === 1} onClick={() => setPg(p => p - 1)}><ChevronLeft size={14} /></PageBtn>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <PageBtn key={n} active={n === pg} onClick={() => setPg(n)}>{n}</PageBtn>
            ))}
            <PageBtn disabled={pg === totalPages} onClick={() => setPg(p => p + 1)}><ChevronRight size={14} /></PageBtn>
          </div>
        </div>
      </div>
    </div>
  );
}