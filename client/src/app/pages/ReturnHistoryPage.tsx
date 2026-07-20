import { useState } from "react";
import {
  Search, X, AlertCircle, CheckCircle2, ArrowLeft,
  Calendar, User, BookOpen, RotateCcw, RefreshCw,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useReturnHistory } from "../hooks/useBorrowing";
import {
  BookCover,
  Avatar,
  PUR,
  TODAY,
} from "../components/BookUI";

interface ReturnRecord {
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
  status: string;
  condition?: string;
  notes?: string;
}

function fmtDate(d: string | undefined | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(d: string | undefined | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ConditionBadge({ condition }: { condition?: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    good: { bg: "#ECFDF5", color: "#059669" },
    fair: { bg: "#FEFCE8", color: "#CA8A04" },
    damaged: { bg: "#FFF7ED", color: "#D97706" },
    lost: { bg: "#FEF2F2", color: "#DC2626" },
  };
  const c = colors[condition || "good"] || colors.good;
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: c.bg, color: c.color }}
    >
      {condition || "good"}
    </span>
  );
}

export default function ReturnHistoryPage({ onBack }: { onBack?: () => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [memberType, setMemberType] = useState("");
  const limit = 10;

  const { data, isLoading, isError, refetch } = useReturnHistory({
    page,
    limit,
    search,
    memberType,
  });

  const records: ReturnRecord[] = data?.records || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50"
            >
              <ArrowLeft size={15} className="text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="font-extrabold text-xl text-gray-900">Return History</h1>
            <p className="text-xs text-gray-400 mt-0.5">Library Catalog › Return Management › Return History</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}
        >
          <p className="text-xs font-medium text-gray-500">Total Returns</p>
          <p className="text-3xl font-extrabold" style={{ color: PUR }}>
            {isLoading ? "..." : total}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">All time returned books</p>
        </div>
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}
        >
          <p className="text-xs font-medium text-gray-500">Good Condition</p>
          <p className="text-3xl font-extrabold" style={{ color: "#059669" }}>
            {isLoading ? "..." : records.filter((r) => r.condition === "good" || !r.condition).length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">From current page</p>
        </div>
        <div
          className="rounded-xl p-4 flex flex-col justify-between"
          style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}
        >
          <p className="text-xs font-medium text-gray-500">Damaged/Lost</p>
          <p className="text-3xl font-extrabold" style={{ color: "#DC2626" }}>
            {isLoading ? "..." : records.filter((r) => r.condition === "damaged" || r.condition === "lost").length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">From current page</p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl flex flex-col"
        style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">Return Records</p>
            <p className="text-xs text-gray-400">Complete history of all book returns</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Member type filter */}
            <select
              value={memberType}
              onChange={(e) => { setMemberType(e.target.value); setPage(1); }}
              className="text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600"
              style={{ padding: "8px 12px", color: "#374151" }}
            >
              <option value="">All Members</option>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
            </select>
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search member, book, ISBN…"
                className="text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600"
                style={{ padding: "8px 12px 8px 30px", width: 260 }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Member", "Book", "Borrowed", "Returned", "Condition", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left font-semibold text-gray-400 py-3"
                    style={{ fontSize: 11, letterSpacing: "0.05em", padding: "12px 16px", whiteSpace: "nowrap" }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">
                    Loading return history...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} style={{ color: "#DC2626" }} />
                      <p className="text-sm font-medium" style={{ color: "#DC2626" }}>
                        Failed to load return history.
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                        style={{ color: PUR }}
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">
                    {search || memberType
                      ? "No returned books match your filters."
                      : "No returns have been recorded yet."}
                  </td>
                </tr>
              ) : (
                records.map((r: ReturnRecord, i: number) => (
                  <tr
                    key={r._id}
                    style={{
                      borderBottom: "1px solid #F9FAFB",
                      background: i % 2 === 0 ? "#fff" : "#FAFAFA",
                    }}
                    className="hover:bg-purple-50 transition-colors"
                  >
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.memberName} size={32} />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 leading-tight">{r.memberName}</p>
                          <p className="text-xs text-gray-400">{r.memberId}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-2">
                        <BookCover color={r.bookCoverColor} title={r.bookTitle} size="sm" />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 leading-tight" style={{ maxWidth: 220 }}>
                            {r.bookTitle}
                          </p>
                          <p className="text-xs text-gray-400" style={{ fontFamily: "monospace" }}>
                            {r.isbn}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      <p>{fmtDate(r.borrowDate)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Due: {fmtDate(r.dueDate)}</p>
                    </td>
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} style={{ color: "#059669" }} />
                        <span className="text-xs font-semibold" style={{ color: "#059669" }}>
                          {fmtDateTime(r.returnDate)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <ConditionBadge condition={r.condition} />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "#ECFDF5", color: "#059669" }}
                      >
                        Returned
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-4 border-t border-gray-100"
            style={{ background: "#FAFAFA" }}
          >
            <p className="text-xs text-gray-400">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} returns
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} className="text-gray-600" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors"
                    style={{
                      background: p === page ? PUR : "#fff",
                      color: p === page ? "#fff" : "#6B7280",
                      border: p === page ? "none" : "1px solid #E5E7EB",
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}