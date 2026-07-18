import { useMemo, useState } from "react";
import {
  Search, X, AlertCircle, CheckCircle2, RotateCcw, AlertTriangle,
  Clock, BookMarked, BadgeCheck, ArrowLeft, Calendar,
  User, ClipboardList, Package, Eye, RefreshCw,
} from "lucide-react";
import {
  useBorrowRecords,
  useReturnStats,
  useReturnBook,
  useUpdateBorrowRecord,
} from "../hooks/useBorrowing";
import { useBook } from "../hooks/useBooks";
import {
  BookCover,
  BorrowBadge,
  Avatar,
  IconBtn,
  PUR,
  TODAY,
} from "../components/BookUI";

type Condition = "good" | "fair" | "damaged" | "lost";

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
  status: string;
  condition?: Condition;
  notes?: string;
}

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ReturnManagementPage({ userRole }: { userRole: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Live queries using React Query
  const { data: statsData, refetch: refetchStats } = useReturnStats();
  
  const { data: activeData, isLoading: activeLoading, refetch: refetchActive } = useBorrowRecords({
    page: 1,
    limit: 100,
    search,
    status: "active",
  });

  const { data: recentData, refetch: refetchRecent } = useBorrowRecords({
    page: 1,
    limit: 6,
    status: "returned",
  });

  const returnMutation = useReturnBook();
  const updateMutation = useUpdateBorrowRecord();

  const active = activeData?.records || [];
  const recent = recentData?.records || [];

  const selected = (active.find((r: BorrowRecord) => r._id === selectedId) || null) as BorrowRecord | null;
  const { data: selectedBook } = useBook(selected?.bookId || "");

  const overdueDays = selected ? Math.max(0, daysBetween(selected.dueDate, TODAY)) : 0;

  const STATS = [
    { label: "Awaiting Return", value: statsData?.active ?? 0, icon: <BookMarked size={20} />, bg: "#EDE9FE", color: PUR, trend: "Currently on loan" },
    { label: "Overdue", value: statsData?.overdue ?? 0, icon: <AlertTriangle size={20} />, bg: "#FEF2F2", color: "#DC2626", trend: "Needs attention" },
    { label: "Returned Today", value: statsData?.returnedToday ?? 0, icon: <BadgeCheck size={20} />, bg: "#ECFDF5", color: "#059669", trend: fmtDate(TODAY) },
  ];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleReturn = async () => {
    if (!selected) return;

    try {
      await returnMutation.mutateAsync({
        id: selected._id,
        condition,
        notes,
      });

      const msg =
        condition === "lost"
          ? "Marked as LOST. Inventory updated."
          : "Return processed. Inventory updated.";
      
      showToast(msg);
      setSelectedId(null);
      setCondition("good");
      setNotes("");
      
      // Refetch stats and data
      refetchStats();
      refetchActive();
      refetchRecent();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to process return.");
    }
  };

  const handleMarkOverdue = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: { status: "overdue" },
      });
      showToast("Loan flagged as overdue.");
      refetchStats();
      refetchActive();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to flag loan as overdue.");
    }
  };

  // Role check
  if (userRole !== "Librarian") {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p className="text-sm text-gray-500 mt-2">Only Librarians are authorized to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{ background: "#1F2937", color: "#fff", fontSize: 13, fontWeight: 500, minWidth: 280 }}
        >
          <CheckCircle2 size={15} style={{ color: "#10B981", flexShrink: 0 }} />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">Return Books</h1>
          <p className="text-xs text-gray-400 mt-0.5">Library Catalog › Borrowing › Return Books</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
            <ClipboardList size={14} /> View History
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 flex flex-col justify-between"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 115 }}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-tight" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-5 items-start">
        {/* LEFT: Active loans list */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div
            className="rounded-2xl flex flex-col"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Active Loans</p>
                <p className="text-xs text-gray-400">Select a loan to process return</p>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search member, book, ISBN…"
                  className="text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600"
                  style={{ padding: "8px 12px 8px 30px", width: 260 }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {["Member", "Book", "Due Date", "Status", "Actions"].map((h) => (
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
                  {activeLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                        Loading active loans...
                      </td>
                    </tr>
                  ) : active.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                        No active loans match your search.
                      </td>
                    </tr>
                  ) : (
                    active.map((r: BorrowRecord, i: number) => {
                      const isSelected = r._id === selectedId;
                      const isOverdue = r.status === "overdue";
                      const days = daysBetween(TODAY, r.dueDate);
                      return (
                        <tr
                          key={r._id}
                          onClick={() => setSelectedId(r._id)}
                          style={{
                            borderBottom: "1px solid #F9FAFB",
                            background: isSelected
                              ? "#F5F3FF"
                              : isOverdue
                                ? "#FFFBFB"
                                : i % 2 === 0
                                  ? "#fff"
                                  : "#FAFAFA",
                            cursor: "pointer",
                            borderLeft: isSelected ? `3px solid ${PUR}` : "3px solid transparent",
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
                                <p className="text-xs font-semibold text-gray-900 leading-tight" style={{ maxWidth: 200 }}>
                                  {r.bookTitle}
                                </p>
                                <p className="text-xs text-gray-400" style={{ fontFamily: "monospace" }}>
                                  {r.isbn}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                            <p>{fmtDate(r.dueDate)}</p>
                            <p
                              className="mt-0.5"
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: days < 0 ? "#DC2626" : days <= 3 ? "#D97706" : "#16A34A",
                              }}
                            >
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                            </p>
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <BorrowBadge status={r.status as any} />
                          </td>
                          <td style={{ padding: "10px 16px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <IconBtn color="#059669" title="Process Return" onClick={() => setSelectedId(r._id)}>
                                <RotateCcw size={12} />
                              </IconBtn>
                              {r.status === "borrowed" && (
                                <IconBtn color="#DC2626" title="Mark Overdue" onClick={() => handleMarkOverdue(r._id)}>
                                  <AlertTriangle size={12} />
                                </IconBtn>
                              )}
                              <IconBtn color="#6B7280" title="View Record">
                                <Eye size={12} />
                              </IconBtn>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent returns */}
          <div
            className="rounded-2xl"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Recent Returns</p>
                <p className="text-xs text-gray-400">Latest updates to borrowing history</p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "#ECFDF5", color: "#059669" }}
              >
                {recent.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {["Member", "Book", "Returned", "Condition"].map((h) => (
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
                  {recent.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                        No returns logged yet.
                      </td>
                    </tr>
                  ) : (
                    recent.map((r: BorrowRecord, i: number) => (
                      <tr key={r._id} style={{ borderBottom: "1px solid #F9FAFB", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="flex items-center gap-2">
                            <Avatar name={r.memberName} size={26} />
                            <p className="text-xs font-semibold text-gray-900">{r.memberName}</p>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <p className="text-xs font-semibold text-gray-900" style={{ maxWidth: 200 }}>
                            {r.bookTitle}
                          </p>
                        </td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                          {fmtDate(r.returnDate || "")}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 10,
                              background: r.condition === "good" ? "#ECFDF5" : r.condition === "fair" ? "#FEFCE8" : r.condition === "damaged" ? "#FFF7ED" : "#FEF2F2",
                              color: r.condition === "good" ? "#059669" : r.condition === "fair" ? "#CA8A04" : r.condition === "damaged" ? "#D97706" : "#DC2626",
                              textTransform: "capitalize",
                            }}
                          >
                            {r.condition || "good"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Return processor */}
        <div className="flex flex-col gap-4 shrink-0" style={{ width: 340 }}>
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#ECFDF5" }}>
                <RotateCcw size={15} style={{ color: "#059669" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Process Return</p>
                <p className="text-xs text-gray-400">Confirm details & log</p>
              </div>
              {selected && (
                <button
                  onClick={() => setSelectedId(null)}
                  className="ml-auto text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"
                >
                  <X size={11} />
                  Clear
                </button>
              )}
            </div>

            {!selected ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "#F5F3FF" }}
                >
                  <ArrowLeft size={22} style={{ color: PUR }} />
                </div>
                <p className="text-sm font-semibold text-gray-700">No loan selected</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                  Pick an active loan from the list to record a return.
                </p>
              </div>
            ) : (
              <>
                {/* Member */}
                <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F5F3FF", border: `1.5px solid ${PUR}22` }}>
                  <Avatar name={selected.memberName} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{selected.memberName}</p>
                    <p className="text-xs text-gray-500">{selected.memberId}</p>
                  </div>
                  <User size={14} style={{ color: PUR }} />
                </div>

                {/* Book */}
                <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F9FAFB", border: "1px solid #F3F4F6" }}>
                  <BookCover color={selected.bookCoverColor} title={selected.bookTitle} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight">{selected.bookTitle}</p>
                    <p className="text-xs" style={{ fontFamily: "monospace", color: "#9CA3AF" }}>
                      {selected.isbn}
                    </p>
                    {selectedBook && (
                      <p className="text-xs text-gray-500 mt-0.5">Shelf: {selectedBook.shelfLocation}</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-2.5" style={{ background: "#F9FAFB" }}>
                    <p className="text-[10px] font-bold text-gray-400 tracking-wider">BORROWED</p>
                    <p className="text-xs font-semibold text-gray-900 mt-0.5">{fmtDate(selected.borrowDate)}</p>
                  </div>
                  <div
                    className="rounded-lg p-2.5"
                    style={{
                      background: overdueDays > 0 ? "#FEF2F2" : "#F0FDF4",
                    }}
                  >
                    <p className="text-[10px] font-bold tracking-wider" style={{ color: overdueDays > 0 ? "#DC2626" : "#059669" }}>
                      DUE
                    </p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: overdueDays > 0 ? "#DC2626" : "#065F46" }}>
                      {fmtDate(selected.dueDate)}
                    </p>
                  </div>
                </div>

                {overdueDays > 0 && (
                  <div
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                  >
                    <AlertCircle size={14} style={{ color: "#DC2626" }} />
                    <p className="text-xs font-semibold" style={{ color: "#991B1B" }}>
                      {overdueDays} day{overdueDays > 1 ? "s" : ""} overdue
                    </p>
                  </div>
                )}

                {/* Condition */}
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Book Condition</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["good", "fair", "damaged", "lost"] as Condition[]).map((c) => {
                      const active = condition === c;
                      const colors: Record<Condition, string> = {
                        good: "#059669", fair: "#CA8A04", damaged: "#D97706", lost: "#DC2626",
                      };
                      return (
                        <button
                          key={c}
                          onClick={() => setCondition(c)}
                          className="py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                          style={{
                            background: active ? colors[c] : "#F3F4F6",
                            color: active ? "#fff" : "#6B7280",
                            boxShadow: active ? `0 2px 8px ${colors[c]}55` : "none",
                          }}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Return Date */}
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Return Date</label>
                  <div
                    className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                    style={{ background: "#F5F3FF", border: `1.5px solid ${PUR}33` }}
                  >
                    <Calendar size={14} style={{ color: PUR }} />
                    <span className="text-sm font-bold" style={{ color: PUR }}>{fmtDate(TODAY)}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    Notes <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Any observations…"
                    className="w-full text-sm outline-none rounded-lg border border-gray-200 bg-gray-50 focus:border-purple-600 transition-colors"
                    style={{ padding: "9px 12px", color: "#111827", resize: "none" }}
                  />
                </div>

                {/* Inventory preview */}
                {selectedBook && (
                  <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F9FAFB" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EDE9FE" }}>
                      <Package size={14} style={{ color: PUR }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700">Inventory after return</p>
                      <p className="text-xs text-gray-400">
                        {selectedBook.availableCopies} → <strong style={{ color: condition === "lost" ? "#DC2626" : "#059669" }}>
                          {condition === "lost" ? selectedBook.availableCopies : selectedBook.availableCopies + 1}
                        </strong>{" "}
                        / {condition === "lost" ? Math.max(0, selectedBook.totalCopies - 1) : selectedBook.totalCopies} copies
                      </p>
                    </div>
                    <RefreshCw size={13} className="text-gray-400" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleReturn}
                    disabled={returnMutation.isPending}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: PUR, boxShadow: "0 4px 16px rgba(109,40,217,0.35)" }}
                  >
                    <BadgeCheck size={15} /> {returnMutation.isPending ? "Confirming..." : "Confirm Return"}
                  </button>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
