import { useState, useMemo } from "react";
import {
  BookOpen, Search, Plus, Download, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2,
  ArrowLeft, Calendar, Hash, User, MoreVertical, Check, RotateCcw, RefreshCw,
  ClipboardList, UserCheck, BookPlus, AlertTriangle, Clock, BadgeCheck, BookMarked,
} from "lucide-react";
import {
  useBorrowRecords,
  useCreateBorrowRecord,
  useReturnBook,
  useRenewLoan,
  useDeleteBorrowRecord,
} from "../hooks/useBorrowing";
import {
  BookCover, BookStatusBadge, BorrowBadge, DaysLeftPill, CatBadge,
  Avatar, Fld, iCls, iSty, IconBtn, PageBtn, PUR, TODAY, addDays,
} from "../components/BookUI";
import type { Book, BorrowStatus } from "../components/BookUI";

/* ─────────────────────────── TYPES ─────────────────────────── */
type BorrowTab = "active" | "history";

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

/* ─────────────────── BORROWING MANAGEMENT PAGE ───────────────── */
export default function BorrowingManagementPage({ onIssue }: { onIssue: () => void }) {
  const [tab, setTab] = useState<BorrowTab>("active");
  const [search, setSearch] = useState("");
  const [pg, setPg] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const PER = 7;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  // API hooks
  const { data, isLoading, error, refetch } = useBorrowRecords({
    page: pg,
    limit: PER,
    search,
    status: tab === "active" ? "" : tab === "history" ? "returned" : "reserved",
    memberType: "",
  });

  const returnMutation = useReturnBook() as any;
  const renewMutation = useRenewLoan() as any;
  const deleteMutation = useDeleteBorrowRecord() as any;

  const records: BorrowRecord[] = data?.records || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const stats = useMemo(() => {
    const all = records;
    return {
      active: all.filter(r => r.status === "borrowed").length,
      overdue: all.filter(r => r.status === "overdue").length,
      dueWeek: all.filter(r => r.status === "borrowed" && getDaysLeft(r.dueDate) >= 0 && getDaysLeft(r.dueDate) <= 7).length,
    };
  }, [records]);

  const handleReturn = async (id: string) => {
    try {
      await returnMutation.mutateAsync(id);
      showToast("Book marked as returned successfully.");
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to return book.");
    }
  };

  const handleRenew = async (id: string) => {
    const record = records.find(r => r._id === id);
    if (!record) return;
    const newDueDate = addDays(record.dueDate, 14);
    try {
      await renewMutation.mutateAsync({ id, dueDate: newDueDate });
      showToast("Loan renewed for 14 additional days.");
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to renew loan.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this borrow record?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast("Borrow record deleted successfully.");
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to delete record.");
    }
  };

  const tabDef: { id: BorrowTab; label: string; count: number }[] = [
    { id: "active", label: "Active Borrowings", count: stats.active + stats.overdue },
    { id: "history", label: "Borrow History", count: data?.records?.filter((r: BorrowRecord) => r.status === "returned").length || 0 },
  ];

  const STAT_CARDS = [
    { label: "Active Borrowings", value: stats.active, icon: <BookMarked size={20} />, bg: "#EDE9FE", color: PUR, trend: "+3 today" },
    { label: "Overdue", value: stats.overdue, icon: <AlertTriangle size={20} />, bg: "#FEF2F2", color: "#DC2626", trend: "Needs attention" },
    { label: "Due This Week", value: stats.dueWeek, icon: <Clock size={20} />, bg: "#FFF7ED", color: "#D97706", trend: "Within 7 days" },
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
          <h1 className="font-extrabold text-xl text-gray-900">Borrowing Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Library Catalog › Borrowing › Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
          <button onClick={onIssue}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90"
            style={{ background: PUR, boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}>
            <BookPlus size={14} /> Issue a Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} className="rounded-xl p-4 flex flex-col justify-between"
            style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 115 }}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl flex flex-col" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}>
        {/* Tab bar + search */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-gray-100">
          <div className="flex items-center gap-0">
            {tabDef.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setPg(1); }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative"
                style={{ color: tab === t.id ? PUR : "#6B7280" }}>
                {t.label}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: tab === t.id ? PUR : "#F3F4F6", color: tab === t.id ? "#fff" : "#6B7280" }}>
                  {t.count}
                </span>
                {tab === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: PUR }} />}
              </button>
            ))}
          </div>
          <div className="relative pb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPg(1); }}
              placeholder="Search member or book…"
              className="text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600"
              style={{ padding: "8px 12px 8px 30px", width: 240 }} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Member", "Book", "Borrow Date", tab === "history" ? "Return Date" : "Due Date", "Days / Status", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left font-semibold text-gray-400 py-3"
                    style={{ fontSize: 11, letterSpacing: "0.05em", padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">Loading records...</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="text-center py-16 text-red-500 text-sm">Failed to load records.</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">No records found.</td></tr>
              ) : records.map((r, i) => {
                const isOverdue = r.status === "overdue";
                return (
                  <tr key={r._id}
                    style={{ borderBottom: "1px solid #F9FAFB", background: isOverdue ? "#FFFBFB" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    className="hover:bg-purple-50 transition-colors">
                    {/* Member */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.memberName} size={32} />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 leading-tight">{r.memberName}</p>
                          <p className="text-xs text-gray-400">{r.memberId}</p>
                          <span style={{ fontSize: 10, fontWeight: 700,
                            background: r.memberType === "staff" ? "#FFF7ED" : "#F5F3FF",
                            color: r.memberType === "staff" ? "#D97706" : PUR,
                            padding: "1px 6px", borderRadius: 8 }}>
                            {r.memberType}
                          </span>
                        </div>
                      </div>
                    </td>
                    {/* Book */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-7 rounded flex items-center justify-center text-white font-bold shrink-0"
                          style={{ background: r.bookCoverColor, fontSize: 10 }}>{r.bookTitle.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900 leading-tight" style={{ maxWidth: 160 }}>{r.bookTitle}</p>
                          <p className="text-xs text-gray-400" style={{ fontFamily: "monospace" }}>{r.isbn}</p>
                        </div>
                      </div>
                    </td>
                    {/* Borrow Date */}
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{fmtDate(r.borrowDate)}</td>
                    {/* Due / Return Date */}
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {tab === "history" ? fmtDate(r.returnDate || "") : fmtDate(r.dueDate)}
                    </td>
                    {/* Days Left */}
                    <td style={{ padding: "10px 16px" }}>
                      <DaysLeftPill dueDate={r.dueDate} status={r.status} />
                      {r.status === "reserved" && <span style={{ fontSize: 10, fontWeight: 700, background: "#EFF6FF", color: "#2563EB", padding: "2px 7px", borderRadius: 10 }}>Awaiting</span>}
                      {r.status === "returned" && <span style={{ fontSize: 10, fontWeight: 700, background: "#ECFDF5", color: "#059669", padding: "2px 7px", borderRadius: 10 }}>{fmtDate(r.returnDate || "")}</span>}
                    </td>
                    {/* Status */}
                    <td style={{ padding: "10px 16px" }}><BorrowBadge status={r.status} /></td>
                    {/* Actions */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-1">
                        {(r.status === "borrowed" || r.status === "overdue") && <>
                          <IconBtn color="#059669" title="Return Book" onClick={() => handleReturn(r._id)}><RotateCcw size={12} /></IconBtn>
                          {r.status === "borrowed" && <IconBtn color="#D97706" title="Renew Loan" onClick={() => handleRenew(r._id)}><RefreshCw size={12} /></IconBtn>}
                        </>}
                        {r.status === "reserved" && <IconBtn color={PUR} title="Issue Book" onClick={() => handleReturn(r._id)}><BookPlus size={12} /></IconBtn>}
                        <IconBtn color="#6B7280" title="View Record"><Eye size={12} /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })
              }
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