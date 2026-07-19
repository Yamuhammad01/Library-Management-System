import { useState, useMemo } from "react";
import {
  Search, Filter, CheckCircle2, XCircle, X, Clock, Bell,
  ChevronLeft, ChevronRight, Calendar, BookOpen, MoreVertical,
  BadgeCheck, AlertTriangle, Eye, Trash2, BookMarked, Hash,
  RefreshCw, ClipboardList, Users, Download, ChevronDown,
} from "lucide-react";
import {
  useReservationStats,
  useReservations,
  useApproveReservation,
  useRejectReservation,
  useCancelReservation,
  useMarkReservationCompleted,
  useNotifyNextMember,
  useDeleteReservation,
} from "../hooks/useReservations";
import {
  Avatar, BorrowBadge, IconBtn, PageBtn, PUR,
} from "../components/BookUI";

/* ─────────────────────────── TYPES ─────────────────────────── */
type ReservationStatus =
  | "pending" | "approved" | "rejected"
  | "cancelled" | "completed" | "notified";

interface Reservation {
  _id: string;
  bookId: string;
  bookTitle: string;
  bookCoverColor: string;
  isbn: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberType: "student" | "staff";
  reservedAt: string;
  expiresAt: string;
  approvedAt?: string;
  completedAt?: string;
  notifiedAt?: string;
  position: number;
  status: ReservationStatus;
  rejectionReason?: string;
  notes?: string;
}

/* ─────────────────────────── STATUS CONFIG ──────────────────── */
const STATUS_CONFIG: Record<ReservationStatus, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  pending:   { bg: "#EFF6FF", color: "#2563EB",  label: "Pending",   icon: <Clock size={10} /> },
  approved:  { bg: "#ECFDF5", color: "#059669",  label: "Approved",  icon: <CheckCircle2 size={10} /> },
  rejected:  { bg: "#FEF2F2", color: "#DC2626",  label: "Rejected",  icon: <XCircle size={10} /> },
  cancelled: { bg: "#F3F4F6", color: "#6B7280",  label: "Cancelled", icon: <X size={10} /> },
  completed: { bg: "#F5F3FF", color: PUR,        label: "Completed", icon: <BadgeCheck size={10} /> },
  notified:  { bg: "#FFF7ED", color: "#D97706",  label: "Notified",  icon: <Bell size={10} /> },
};

/* ─────────────────────────── STATUS BADGE ──────────────────── */
function ResvBadge({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className="flex items-center gap-1 w-fit"
      style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}
    >
      {cfg.icon}{cfg.label}
    </span>
  );
}

/* ─────────────────────────── HELPERS ───────────────────────── */
function fmtDate(d: string | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: string | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function expiryPill(expiresAt: string, status: ReservationStatus) {
  if (["completed", "rejected", "cancelled"].includes(status)) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  let bg: string, color: string, label: string;
  if (diff < 0)       { bg = "#FEF2F2"; color = "#DC2626"; label = "Expired"; }
  else if (diff === 0){ bg = "#FFF7ED"; color = "#D97706"; label = "Expires today"; }
  else if (diff <= 2) { bg = "#FFF7ED"; color = "#D97706"; label = `${diff}d left`; }
  else                { bg = "#F0FDF4"; color = "#16A34A"; label = `${diff}d left`; }
  return <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{label}</span>;
}

/* ─────────────────────── STAT CARD ─────────────────────────── */
function StatCard({ label, value, icon, bg, color, sub, loading }: {
  label: string; value: number | string; icon: React.ReactNode;
  bg: string; color: string; sub: string; loading?: boolean;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 115 }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color }}>{icon}</div>
      </div>
      <div>
        {loading
          ? <div className="h-7 w-16 rounded bg-gray-200 animate-pulse mt-1" />
          : <p className="text-3xl font-extrabold leading-tight" style={{ color }}>{value}</p>
        }
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ───────────── REJECT MODAL ─────────────────────────────────── */
function RejectModal({ record, onConfirm, onClose }: {
  record: Reservation;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
            <XCircle size={20} style={{ color: "#DC2626" }} />
          </div>
          <div>
            <p className="font-bold text-gray-900">Reject Reservation</p>
            <p className="text-xs text-gray-400 truncate" style={{ maxWidth: 280 }}>
              {record.memberName} — {record.bookTitle}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-xs font-semibold text-gray-700">Reason <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Member has overdue books, book no longer available…"
            className="w-full text-sm outline-none rounded-lg border border-gray-200 bg-gray-50 focus:border-purple-600 transition-colors resize-none"
            style={{ padding: "9px 12px", color: "#111827" }}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "#DC2626" }}>
            Reject
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── DETAIL DRAWER ────────────────────────────────── */
function DetailDrawer({ record, onClose }: { record: Reservation; onClose: () => void }) {
  const fields: [string, string][] = [
    ["Member ID",    record.memberId],
    ["Member Type",  record.memberType],
    ["Member Email", record.memberEmail || "—"],
    ["Book ISBN",    record.isbn || "—"],
    ["Reserved At",  fmtDateTime(record.reservedAt)],
    ["Expires At",   fmtDateTime(record.expiresAt)],
    ["Approved At",  fmtDateTime(record.approvedAt)],
    ["Completed At", fmtDateTime(record.completedAt)],
    ["Notified At",  fmtDateTime(record.notifiedAt)],
    ["Queue Position", String(record.position)],
    ["Notes",        record.notes || "—"],
  ];
  if (record.rejectionReason) fields.push(["Rejection Reason", record.rejectionReason]);

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="ml-auto h-full overflow-y-auto flex flex-col" style={{ width: 420, background: "#fff", boxShadow: "-8px 0 32px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="font-bold text-gray-900 text-sm">Reservation Details</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Book + member hero */}
        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Book */}
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#F5F3FF", border: `1.5px solid ${PUR}22` }}>
            <div className="w-10 h-14 rounded flex items-center justify-center text-white font-extrabold text-xl shrink-0"
              style={{ background: record.bookCoverColor }}>
              {record.bookTitle.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{record.bookTitle}</p>
              {record.isbn && <p className="text-xs mt-0.5" style={{ fontFamily: "monospace", color: "#9CA3AF" }}>{record.isbn}</p>}
            </div>
          </div>

          {/* Member */}
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <Avatar name={record.memberName} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{record.memberName}</p>
              <p className="text-xs text-gray-400">{record.memberId}</p>
              {record.memberEmail && <p className="text-xs text-gray-400">{record.memberEmail}</p>}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, background: record.memberType === "staff" ? "#FFF7ED" : "#EDE9FE", color: record.memberType === "staff" ? "#D97706" : PUR, padding: "2px 8px", borderRadius: 10 }}>
              {record.memberType}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <ResvBadge status={record.status} />
            {expiryPill(record.expiresAt, record.status)}
            <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: "auto" }}>Queue #{record.position}</span>
          </div>

          {/* Fields */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {fields.map(([label, value], i) => (
              <div key={label} className="flex justify-between px-4 py-2.5"
                style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA", borderBottom: i < fields.length - 1 ? "1px solid #F3F4F6" : undefined }}>
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <span className="text-xs font-semibold text-gray-800 text-right" style={{ maxWidth: 220, wordBreak: "break-word" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── NOTIFY NEXT MODAL ─────────────────────── */
function NotifyModal({ records, onConfirm, onClose }: {
  records: Reservation[];
  onConfirm: (bookId: string, bookTitle: string) => void;
  onClose: () => void;
}) {
  // Group pending/approved by bookId
  const books = useMemo(() => {
    const map = new Map<string, { bookId: string; bookTitle: string; bookCoverColor: string; count: number }>();
    for (const r of records) {
      if (r.status === "pending") {
        if (!map.has(r.bookId)) map.set(r.bookId, { bookId: r.bookId, bookTitle: r.bookTitle, bookCoverColor: r.bookCoverColor, count: 0 });
        map.get(r.bookId)!.count += 1;
      }
    }
    return [...map.values()];
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FFF7ED" }}>
            <Bell size={20} style={{ color: "#D97706" }} />
          </div>
          <div>
            <p className="font-bold text-gray-900">Notify Next Member</p>
            <p className="text-xs text-gray-400">Select which book queue to notify</p>
          </div>
          <button onClick={onClose} className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
            <X size={14} className="text-gray-500" />
          </button>
        </div>
        {books.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No pending reservations to notify.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {books.map((b) => (
              <button key={b.bookId} onClick={() => onConfirm(b.bookId, b.bookTitle)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all text-left">
                <div className="w-8 h-11 rounded flex items-center justify-center text-white font-bold text-base shrink-0" style={{ background: b.bookCoverColor }}>
                  {b.bookTitle.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.bookTitle}</p>
                  <p className="text-xs text-gray-400">{b.count} member{b.count !== 1 ? "s" : ""} in queue</p>
                </div>
                <Bell size={14} style={{ color: "#D97706", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
        <button onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50">
          Close
        </button>
      </div>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ──────────────────────────────── */
export default function ReservationManagementPage() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusF]  = useState<ReservationStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<"student" | "staff" | "">("");
  const [pg, setPg]                 = useState(1);
  const [toast, setToast]           = useState<{ msg: string; ok?: boolean } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Reservation | null>(null);
  const [detailTarget, setDetailTarget] = useState<Reservation | null>(null);
  const [showNotify, setShowNotify]     = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);
  const PER = 8;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── Data ─── */
  const { data: statsData, isLoading: statsLoading } = useReservationStats();
  const { data, isLoading, error, refetch } = useReservations({
    page: pg, limit: PER,
    search, status: statusFilter, memberType: typeFilter,
  });

  const records: Reservation[] = data?.records || [];
  const total      = data?.total      || 0;
  const totalPages = data?.totalPages || 1;

  /* ─── Mutations ─── */
  const approveMut   = useApproveReservation()          as any;
  const rejectMut    = useRejectReservation()           as any;
  const cancelMut    = useCancelReservation()           as any;
  const completeMut  = useMarkReservationCompleted()    as any;
  const notifyMut    = useNotifyNextMember()            as any;
  const deleteMut    = useDeleteReservation()           as any;

  /* ─── Actions ─── */
  const handleApprove = async (id: string) => {
    try {
      await approveMut.mutateAsync(id);
      showToast("Reservation approved successfully.");
      refetch();
    } catch (e: any) { showToast(e.response?.data?.error || "Failed to approve.", false); }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectMut.mutateAsync({ id: rejectTarget._id, reason });
      showToast("Reservation rejected.");
      setRejectTarget(null);
      refetch();
    } catch (e: any) { showToast(e.response?.data?.error || "Failed to reject.", false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await cancelMut.mutateAsync(id);
      showToast("Reservation cancelled.");
      refetch();
    } catch (e: any) { showToast(e.response?.data?.error || "Failed to cancel.", false); }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMut.mutateAsync(id);
      showToast("Reservation marked as completed!");
      refetch();
    } catch (e: any) { showToast(e.response?.data?.error || "Failed to mark completed.", false); }
  };

  const handleNotifyConfirm = async (bookId: string, bookTitle: string) => {
    try {
      const res = await notifyMut.mutateAsync(bookId);
      showToast(res.message || `Next member notified for "${bookTitle}".`);
      setShowNotify(false);
      refetch();
    } catch (e: any) { showToast(e.response?.data?.error || "Failed to notify.", false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this reservation?")) return;
    try {
      await deleteMut.mutateAsync(id);
      showToast("Reservation deleted.");
      refetch();
    } catch (e: any) { showToast(e.response?.data?.error || "Failed to delete.", false); }
  };

  /* ─── Stat cards config ─── */
  const STAT_CARDS = [
    { label: "Total Reservations", value: statsData?.total      ?? 0, icon: <ClipboardList size={20} />, bg: "#EDE9FE", color: PUR,        sub: "All time" },
    { label: "Pending",            value: statsData?.pending    ?? 0, icon: <Clock size={20} />,         bg: "#EFF6FF", color: "#2563EB",   sub: "Awaiting action" },
    { label: "Approved",           value: statsData?.approved   ?? 0, icon: <CheckCircle2 size={20} />,  bg: "#ECFDF5", color: "#059669",   sub: "Ready for pickup" },
    { label: "Completed",          value: statsData?.completed  ?? 0, icon: <BadgeCheck size={20} />,    bg: "#F5F3FF", color: PUR,         sub: "Issued to member" },
  ];

  const STATUS_OPTIONS: { value: ReservationStatus | ""; label: string }[] = [
    { value: "",           label: "All Statuses"  },
    { value: "pending",    label: "Pending"       },
    { value: "approved",   label: "Approved"      },
    { value: "notified",   label: "Notified"      },
    { value: "completed",  label: "Completed"     },
    { value: "rejected",   label: "Rejected"      },
    { value: "cancelled",  label: "Cancelled"     },
  ];

  const activeFilters = (statusFilter ? 1 : 0) + (typeFilter ? 1 : 0);

  return (
    <div className="p-6 flex flex-col gap-5" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl animate-in"
          style={{ background: "#1F2937", color: "#fff", fontSize: 13, fontWeight: 500, minWidth: 300 }}>
          {toast.ok !== false
            ? <CheckCircle2 size={15} style={{ color: "#10B981", flexShrink: 0 }} />
            : <AlertTriangle size={15} style={{ color: "#F87171", flexShrink: 0 }} />
          }
          {toast.msg}
        </div>
      )}

      {/* ── Modals ── */}
      {rejectTarget && (
        <RejectModal record={rejectTarget} onConfirm={handleRejectConfirm} onClose={() => setRejectTarget(null)} />
      )}
      {detailTarget && (
        <DetailDrawer record={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
      {showNotify && (
        <NotifyModal records={records} onConfirm={handleNotifyConfirm} onClose={() => setShowNotify(false)} />
      )}

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">Reservation Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Library Catalog › Borrowing › Reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotify(true)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: "#FFF7ED", color: "#D97706", border: "1px solid #FDE68A" }}>
            <Bell size={14} /> Notify Next Member
          </button>
          <button
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {STAT_CARDS.map((s) => (
          <StatCard key={s.label} {...s} loading={statsLoading} />
        ))}
      </div>

      {/* ── Table Card ── */}
      <div className="rounded-2xl flex flex-col" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">

          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 220, maxWidth: 340 }}>
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPg(1); }}
              placeholder="Search member, book, ID…"
              className="w-full text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600 transition-colors"
              style={{ padding: "8px 12px 8px 30px" }}
            />
          </div>

          {/* Filter toggle */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border transition-all"
              style={{ background: activeFilters > 0 ? "#EDE9FE" : "#F9FAFB", borderColor: activeFilters > 0 ? `${PUR}44` : "#E5E7EB", color: activeFilters > 0 ? PUR : "#374151" }}>
              <Filter size={13} />
              Filters
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ background: PUR, fontSize: 10 }}>
                  {activeFilters}
                </span>
              )}
              <ChevronDown size={12} style={{ transform: filterOpen ? "none" : "rotate(-90deg)", transition: "transform .2s" }} />
            </button>
            {filterOpen && (
              <div className="absolute top-10 left-0 z-30 rounded-xl border border-gray-100 p-4 flex flex-col gap-3"
                style={{ background: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: 280 }}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Status</label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button key={opt.value}
                        onClick={() => { setStatusF(opt.value as any); setPg(1); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: statusFilter === opt.value ? PUR : "#F3F4F6",
                          color: statusFilter === opt.value ? "#fff" : "#6B7280",
                        }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Member Type</label>
                  <div className="flex gap-1.5">
                    {(["", "student", "staff"] as const).map((t) => (
                      <button key={t}
                        onClick={() => { setTypeFilter(t); setPg(1); }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: typeFilter === t ? PUR : "#F3F4F6",
                          color: typeFilter === t ? "#fff" : "#6B7280",
                        }}>
                        {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {activeFilters > 0 && (
                  <button onClick={() => { setStatusF(""); setTypeFilter(""); setPg(1); setFilterOpen(false); }}
                    className="text-xs font-semibold text-center py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active filter pills */}
          {statusFilter && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#EDE9FE", color: PUR }}>
              {STATUS_CONFIG[statusFilter]?.label}
              <button onClick={() => setStatusF("")}><X size={10} /></button>
            </span>
          )}
          {typeFilter && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#EDE9FE", color: PUR }}>
              {typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
              <button onClick={() => setTypeFilter("")}><X size={10} /></button>
            </span>
          )}

          <p className="ml-auto text-xs text-gray-400 shrink-0">
            {total} result{total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Member", "Book", "Reserved", "Expires", "Queue", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left font-semibold text-gray-400 py-3"
                    style={{ fontSize: 11, letterSpacing: "0.05em", padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                /* Skeleton rows */
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: j === 0 ? 140 : j === 1 ? 160 : 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sm" style={{ color: "#DC2626" }}>
                    Failed to load reservations.
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#F5F3FF" }}>
                        <ClipboardList size={24} style={{ color: PUR }} />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">No reservations found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : records.map((r, i) => {
                const canApprove  = r.status === "pending" || r.status === "notified";
                const canReject   = r.status === "pending" || r.status === "notified";
                const canCancel   = !["completed", "rejected", "cancelled"].includes(r.status);
                const canComplete = r.status === "approved";
                const isHighlight = r.status === "pending" || r.status === "notified";

                return (
                  <tr key={r._id}
                    style={{ borderBottom: "1px solid #F9FAFB", background: isHighlight ? "#FAFCFF" : i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                    className="hover:bg-purple-50 transition-colors group">

                    {/* Member */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.memberName} size={32} />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 leading-tight">{r.memberName}</p>
                          <p className="text-xs text-gray-400">{r.memberId}</p>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            background: r.memberType === "staff" ? "#FFF7ED" : "#F5F3FF",
                            color: r.memberType === "staff" ? "#D97706" : PUR,
                            padding: "1px 6px", borderRadius: 8,
                          }}>
                            {r.memberType}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Book */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-7 rounded flex items-center justify-center text-white font-bold shrink-0"
                          style={{ background: r.bookCoverColor, fontSize: 10 }}>
                          {r.bookTitle.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900 leading-tight" style={{ maxWidth: 170 }}>{r.bookTitle}</p>
                          {r.isbn && <p className="text-xs text-gray-400" style={{ fontFamily: "monospace" }}>{r.isbn}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Reserved date */}
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>
                      {fmtDate(r.reservedAt)}
                    </td>

                    {/* Expires */}
                    <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                      <div className="flex flex-col gap-1">
                        <span style={{ fontSize: 12, color: "#6B7280" }}>{fmtDate(r.expiresAt)}</span>
                        {expiryPill(r.expiresAt, r.status)}
                      </div>
                    </td>

                    {/* Queue position */}
                    <td style={{ padding: "10px 16px" }}>
                      <span className="flex items-center gap-1 w-fit"
                        style={{ background: "#F5F3FF", color: PUR, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 12 }}>
                        <Hash size={10} />#{r.position}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "10px 16px" }}>
                      <ResvBadge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "10px 16px" }}>
                      <div className="flex items-center gap-1">
                        {/* View details */}
                        <IconBtn color="#6B7280" title="View Details" onClick={() => setDetailTarget(r)}>
                          <Eye size={12} />
                        </IconBtn>

                        {/* Approve */}
                        {canApprove && (
                          <IconBtn color="#059669" title="Approve Reservation" onClick={() => handleApprove(r._id)}>
                            <CheckCircle2 size={12} />
                          </IconBtn>
                        )}

                        {/* Reject */}
                        {canReject && (
                          <IconBtn color="#DC2626" title="Reject Reservation" onClick={() => setRejectTarget(r)}>
                            <XCircle size={12} />
                          </IconBtn>
                        )}

                        {/* Mark Completed */}
                        {canComplete && (
                          <IconBtn color={PUR} title="Mark as Completed (Issue Book)" onClick={() => handleComplete(r._id)}>
                            <BadgeCheck size={12} />
                          </IconBtn>
                        )}

                        {/* Cancel */}
                        {canCancel && (
                          <IconBtn color="#D97706" title="Cancel Reservation" onClick={() => handleCancel(r._id)}>
                            <X size={12} />
                          </IconBtn>
                        )}
                      </div>
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
            Showing{" "}
            <strong>{records.length === 0 ? 0 : (pg - 1) * PER + 1}–{Math.min(pg * PER, total)}</strong>
            {" "}of <strong>{total}</strong> reservations
          </p>
          <div className="flex items-center gap-1">
            <PageBtn disabled={pg === 1} onClick={() => setPg((p) => p - 1)}>
              <ChevronLeft size={14} />
            </PageBtn>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const n = totalPages <= 7 ? i + 1 : pg <= 4 ? i + 1 : pg + i - 3;
              if (n < 1 || n > totalPages) return null;
              return <PageBtn key={n} active={n === pg} onClick={() => setPg(n)}>{n}</PageBtn>;
            })}
            <PageBtn disabled={pg === totalPages} onClick={() => setPg((p) => p + 1)}>
              <ChevronRight size={14} />
            </PageBtn>
          </div>
        </div>
      </div>

      {/* ── Extra info strip ── */}
      {statsData && (statsData.rejected > 0 || statsData.cancelled > 0 || statsData.expiringSoon > 0) && (
        <div className="rounded-xl flex items-center gap-4 px-5 py-3"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0 }} />
          <div className="flex items-center gap-5 text-xs text-amber-800 flex-wrap">
            {statsData.expiringSoon > 0 && (
              <span><strong>{statsData.expiringSoon}</strong> reservation{statsData.expiringSoon !== 1 ? "s" : ""} expiring within 24h</span>
            )}
            {statsData.notified > 0 && (
              <span><strong>{statsData.notified}</strong> member{statsData.notified !== 1 ? "s" : ""} notified — awaiting confirmation</span>
            )}
            {statsData.rejected > 0 && (
              <span><strong>{statsData.rejected}</strong> rejected</span>
            )}
            {statsData.cancelled > 0 && (
              <span><strong>{statsData.cancelled}</strong> cancelled</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
