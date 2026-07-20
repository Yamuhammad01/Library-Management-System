import { useState, useMemo } from "react";
import {
  useMyReservations,
  useCancelMyReservation,
} from "../hooks/useReservations";
import {
  BookCover, Avatar, IconBtn, PUR,
} from "../components/BookUI";
import {
  Search, RefreshCw, AlertTriangle, X, CheckCircle2, AlertCircle,
  Clock, BookMarked, Hash,
} from "lucide-react";

/* ─────────────────────────── TYPES ─────────────────────────── */
type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed" | "notified";

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

/* ─────────────────────────── STATUS MAP ────────────────────── */
const USER_STATUS_MAP: Record<ReservationStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: "#FFF7ED", color: "#D97706", label: "Pending" },
  approved:  { bg: "#ECFDF5", color: "#059669", label: "Ready for Pickup" },
  notified:  { bg: "#EDE9FE", color: PUR,        label: "Ready for Pickup" },
  rejected:  { bg: "#F3F4F6", color: "#6B7280",  label: "Cancelled" },
  cancelled: { bg: "#F3F4F6", color: "#6B7280",  label: "Cancelled" },
  completed: { bg: "#F5F3FF", color: PUR,        label: "Completed" },
};

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "ready", label: "Ready for Pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/* ─────────────────────────── HELPERS ───────────────────────── */
function fmtDate(d: string | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysLeft(expiresAt: string): number {
  if (!expiresAt) return 0;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  return diff;
}

function expiryInfo(expiresAt: string, status: ReservationStatus) {
  if (["completed", "rejected", "cancelled"].includes(status)) return null;
  const days = getDaysLeft(expiresAt);
  if (days < 0)       return { bg: "#FEF2F2", color: "#DC2626", label: "Expired" };
  if (days === 0)     return { bg: "#FFF7ED", color: "#D97706", label: "Expires today" };
  if (days <= 2)      return { bg: "#FFF7ED", color: "#D97706", label: `${days}d left` };
  return                    { bg: "#F0FDF4", color: "#16A34A", label: `${days}d left` };
}

/* ─────────────────────────── STAT CARD ─────────────────────── */
function StatCard({ label, value, icon, bg, color, loading }: {
  label: string; value: number; icon: React.ReactNode;
  bg: string; color: string; loading?: boolean;
}) {
  return (
    <div className="rounded-xl p-4 flex flex-col justify-between"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 100 }}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg, color }}>{icon}</div>
      </div>
      <div>
        {loading
          ? <div className="h-6 w-12 rounded bg-gray-200 animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        }
      </div>
    </div>
  );
}

/* ─────────────────────────── RESERVATION ROW ───────────────── */
function ReservationRow({
  record,
  onCancel,
  isCancelling,
}: {
  record: Reservation;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  const statusCfg = USER_STATUS_MAP[record.status] || USER_STATUS_MAP.pending;
  const exp = expiryInfo(record.expiresAt, record.status);
  const canCancel = ["pending", "approved", "notified"].includes(record.status);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
      {/* Cover */}
      <BookCover color={record.bookCoverColor} title={record.bookTitle} size="sm" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{record.bookTitle}</p>
        <p className="text-xs text-gray-400">Reserved {fmtDate(record.reservedAt)}</p>
        {record.expiresAt && (
          <p className="text-xs text-gray-400">Expires {fmtDate(record.expiresAt)}</p>
        )}
      </div>

      {/* Status + Queue + Expiry */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
        >
          {statusCfg.label}
        </span>

        <div className="flex items-center gap-2">
          {exp && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: exp.bg, color: exp.color }}
            >
              {exp.label}
            </span>
          )}
          {record.position > 1 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-gray-500" style={{ background: "#F5F3FF", color: PUR, padding: "2px 8px", borderRadius: 10 }}>
              <Hash size={10} />#{record.position}
            </span>
          )}
        </div>
      </div>

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => onCancel(record._id)}
          disabled={isCancelling}
          className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          {isCancelling ? (
            <span className="w-3 h-3 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
          ) : (
            <X size={12} />
          )}
          Cancel
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────── */
export default function MyReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [toast, setToast] = useState<{ msg: string; ok?: boolean } | null>(null);

  const { data, isLoading, isError, refetch } = useMyReservations({ status: statusFilter });
  const cancelMut = useCancelMyReservation();

  const records: Reservation[] = data?.records || [];
  const total = data?.total || 0;

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const pending = records.filter(r => r.status === "pending").length;
    const ready = records.filter(r => r.status === "approved" || r.status === "notified").length;
    const completed = records.filter(r => r.status === "completed").length;
    const cancelled = records.filter(r => r.status === "rejected" || r.status === "cancelled").length;
    return { pending, ready, completed, cancelled, total: records.length };
  }, [records]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await cancelMut.mutateAsync(id);
      showToast("Reservation cancelled successfully.");
      refetch();
    } catch (err: any) {
      showToast(err?.response?.data?.error || "Failed to cancel reservation.", false);
    }
  };

  const handleFilterChange = (val: string): void => {
    setStatusFilter(val);
  };

  const activeFilterLabel = FILTER_OPTIONS.find(f => f.value === statusFilter)?.label || "";

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{ background: "#1F2937", color: "#fff", fontSize: 13, fontWeight: 500, minWidth: 300 }}>
          {toast.ok !== false
            ? <CheckCircle2 size={15} style={{ color: "#10B981", flexShrink: 0 }} />
            : <AlertTriangle size={15} style={{ color: "#F87171", flexShrink: 0 }} />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">My Reservations</h1>
          <p className="text-xs text-gray-400 mt-0.5">Catalog › My Reservations</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard label="Total Reservations" value={stats.total} icon={<BookMarked size={18} />} bg="#EDE9FE" color={PUR} loading={isLoading} />
        <StatCard label="Pending" value={stats.pending} icon={<Clock size={18} />} bg="#FFF7ED" color="#D97706" loading={isLoading} />
        <StatCard label="Ready for Pickup" value={stats.ready} icon={<CheckCircle2 size={18} />} bg="#ECFDF5" color="#059669" loading={isLoading} />
        <StatCard label="Completed" value={stats.completed} icon={<BookMarked size={18} />} bg="#F5F3FF" color={PUR} loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleFilterChange(opt.value)}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl transition-all"
            style={{
              background: statusFilter === opt.value ? PUR : "#F3F4F6",
              color: statusFilter === opt.value ? "#fff" : "#6B7280",
            }}
          >
            {opt.label}
          </button>
        ))}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter("")}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Results count */}
      {!isLoading && !isError && (
        <p className="text-xs text-gray-400">
          Showing {records.length} of {total} reservation{total !== 1 ? "s" : ""}
          {activeFilterLabel && ` (${activeFilterLabel})`}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
              <div className="w-9 h-12 rounded bg-gray-100 animate-pulse" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 w-48 bg-gray-100 animate-pulse rounded" />
                <div className="h-3 w-32 bg-gray-100 animate-pulse rounded" />
              </div>
              <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl p-8 flex flex-col items-center gap-3" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <AlertTriangle size={36} className="text-red-400" />
          <p className="text-sm text-red-500 font-semibold">Failed to load reservations</p>
          <p className="text-xs text-gray-400">Please check your connection and try again.</p>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && records.length === 0 && (
        <div className="rounded-xl p-10 flex flex-col items-center gap-3" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <BookMarked size={40} className="text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">No reservations found</p>
          <p className="text-xs text-gray-400">
            {statusFilter
              ? "Try adjusting your filter or reserve an unavailable book from the catalog."
              : "You haven't made any reservations yet. Browse the catalog to reserve books."}
          </p>
        </div>
      )}

      {/* Reservation List */}
      {!isLoading && !isError && records.length > 0 && (
        <div className="rounded-xl flex flex-col" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Reservations</p>
          </div>
          <div className="px-5">
            {records.map((record) => (
              <ReservationRow
                key={record._id}
                record={record}
                onCancel={handleCancel}
                isCancelling={cancelMut.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}