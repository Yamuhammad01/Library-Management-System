import { useMemberDashboard } from "../hooks/useDashboard";
import {
  BookCover, BookStatusBadge, DaysLeftPill, CatBadge,
  Avatar, iCls, iSty, PUR, TODAY,
} from "../components/BookUI";
import {
  BookOpen, BookMarked, Clock, AlertTriangle, Calendar,
  RefreshCw, BookCopy, ArrowLeftRight, Library,
} from "lucide-react";

/* ─────────────────── HELPERS ─────────────────── */
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getDaysLeft(dueDate: string | Date | null | undefined): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date(TODAY);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

/* ─────────────────── STAT CARD ─────────────────── */
function StatCard({
  label, value, icon, bg, color, loading, error,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  bg: string; color: string; loading?: boolean; error?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col justify-between"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", minHeight: 130 }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bg, color }}
        >
          {icon}
        </div>
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-20 rounded bg-gray-200 animate-pulse mt-1" />
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── SECTION CARD ─────────────────── */
function SectionCard({
  title, icon, iconBg, iconColor, children, loading, error, empty, emptyMessage,
}: {
  title: string; icon: React.ReactNode; iconBg: string; iconColor: string;
  children: React.ReactNode; loading?: boolean; error?: boolean;
  empty?: boolean; emptyMessage?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 py-4 text-red-500 text-sm">
          <AlertTriangle size={15} />
          <span>Failed to load data. Please try again.</span>
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <Library size={28} className="mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage || "No data available."}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/* ─────────────────── BORROWED BOOK ROW ─────────────────── */
function BorrowedBookRow({
  record,
}: {
  record: {
    _id: string;
    bookTitle: string;
    bookCoverColor: string;
    isbn: string;
    borrowDate: string;
    dueDate: string | null;
    status: string;
    bookId?: { title?: string; author?: string; coverColor?: string; category?: string; isbn?: string };
  };
}) {
  const daysLeft = getDaysLeft(record.dueDate);
  const title = record.bookId?.title || record.bookTitle;
  const author = record.bookId?.author || "";
  const coverColor = record.bookId?.coverColor || record.bookCoverColor;
  const category = record.bookId?.category || "";
  const isOverdue = record.status === "overdue";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <BookCover color={coverColor} title={title} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{title}</p>
        {author && <p className="text-xs text-gray-400 truncate">{author}</p>}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{fmtDate(record.borrowDate)}</span>
          <span className="text-gray-300">→</span>
          <span className="text-xs font-medium" style={{ color: isOverdue ? "#DC2626" : "#6B7280" }}>
            {fmtDate(record.dueDate)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {isOverdue ? (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>
            Overdue
          </span>
        ) : (
          <DaysLeftPill dueDate={record.dueDate || ""} status={record.status as any} />
        )}
        {category && <CatBadge label={category} />}
      </div>
    </div>
  );
}

/* ─────────────────── RESERVATION ROW ─────────────────── */
function ReservationRow({
  record,
}: {
  record: {
    _id: string;
    bookTitle: string;
    bookCoverColor: string;
    status: string;
    reservedAt: string;
    expiresAt: string;
    position: number;
    bookId?: { title?: string; author?: string; coverColor?: string; category?: string };
  };
}) {
  const title = record.bookId?.title || record.bookTitle;
  const coverColor = record.bookId?.coverColor || record.bookCoverColor;
  const category = record.bookId?.category || "";

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#FFF7ED", color: "#D97706", label: "Pending" },
    approved: { bg: "#ECFDF5", color: "#059669", label: "Approved" },
    notified: { bg: "#EDE9FE", color: PUR, label: "Ready for Pickup" },
  };
  const s = statusColors[record.status] || { bg: "#F3F4F6", color: "#6B7280", label: record.status };

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <BookCover color={coverColor} title={title} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{title}</p>
        <p className="text-xs text-gray-400">Reserved {fmtDate(record.reservedAt)}</p>
        {record.expiresAt && (
          <p className="text-xs text-gray-400">Expires {fmtDate(record.expiresAt)}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: s.bg, color: s.color }}
        >
          {s.label}
        </span>
        {record.position > 1 && (
          <span className="text-xs text-gray-400">Queue: #{record.position}</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── RECENTLY BORROWED ROW ─────────────────── */
function RecentlyBorrowedRow({
  record,
}: {
  record: {
    _id: string;
    bookTitle: string;
    bookCoverColor: string;
    status: string;
    borrowDate: string;
    returnDate?: string | null;
    bookId?: { title?: string; author?: string; coverColor?: string; category?: string };
  };
}) {
  const title = record.bookId?.title || record.bookTitle;
  const coverColor = record.bookId?.coverColor || record.bookCoverColor;
  const isReturned = record.status === "returned";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <BookCover color={coverColor} title={title} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{title}</p>
        <p className="text-xs text-gray-400">
          {isReturned
            ? `Returned ${fmtDate(record.returnDate)}`
            : `Borrowed ${fmtDate(record.borrowDate)}`
          }
        </p>
      </div>
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
        style={{
          background: isReturned ? "#ECFDF5" : "#F5F3FF",
          color: isReturned ? "#059669" : PUR,
        }}
      >
        {isReturned ? "Returned" : "Active"}
      </span>
    </div>
  );
}

/* ─────────────────── MAIN DASHBOARD ─────────────────── */
export default function LibraryMemberDashboard() {
  const { data, isLoading, isError, refetch } = useMemberDashboard();

  const currentlyBorrowed = data?.currentlyBorrowed || [];
  const dueSoon = data?.dueSoon || [];
  const dueSoonCount = data?.dueSoonCount || 0;
  const activeReservations = data?.activeReservations || [];
  const totalBorrowed = data?.totalBorrowed || 0;
  const recentlyBorrowed = data?.recentlyBorrowed || [];

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">My Library Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Dashboard › My Activity</p>
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
        <StatCard
          label="Currently Borrowed"
          value={currentlyBorrowed.length}
          icon={<BookOpen size={20} />}
          bg="#EDE9FE"
          color={PUR}
          loading={isLoading}
          error={isError}
        />
        <StatCard
          label="Due Soon"
          value={dueSoonCount}
          icon={<Clock size={20} />}
          bg="#FFF7ED"
          color="#D97706"
          loading={isLoading}
          error={isError}
        />
        <StatCard
          label="Active Reservations"
          value={activeReservations.length}
          icon={<BookMarked size={20} />}
          bg="#ECFDF5"
          color="#059669"
          loading={isLoading}
          error={isError}
        />
        <StatCard
          label="Total Books Borrowed"
          value={totalBorrowed}
          icon={<BookCopy size={20} />}
          bg="#FEF2F2"
          color="#DC2626"
          loading={isLoading}
          error={isError}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Books Currently Borrowed */}
        <SectionCard
          title="Books Currently Borrowed"
          icon={<BookOpen size={16} />}
          iconBg="#EDE9FE"
          iconColor={PUR}
          loading={isLoading}
          error={isError}
          empty={currentlyBorrowed.length === 0}
          emptyMessage="You have no books currently borrowed."
        >
          <div className="divide-y divide-gray-50">
            {currentlyBorrowed.map((record: any) => (
              <BorrowedBookRow key={record._id} record={record} />
            ))}
          </div>
        </SectionCard>

        {/* Books Due Soon */}
        <SectionCard
          title={`Books Due Soon${dueSoonCount > 0 ? ` (${dueSoonCount})` : ""}`}
          icon={<Clock size={16} />}
          iconBg="#FFF7ED"
          iconColor="#D97706"
          loading={isLoading}
          error={isError}
          empty={dueSoon.length === 0}
          emptyMessage="No books due in the next 3 days."
        >
          <div className="divide-y divide-gray-50">
            {dueSoon.map((record: any) => (
              <BorrowedBookRow key={record._id} record={record} />
            ))}
          </div>
        </SectionCard>

        {/* Active Reservations */}
        <SectionCard
          title="Active Reservations"
          icon={<BookMarked size={16} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          loading={isLoading}
          error={isError}
          empty={activeReservations.length === 0}
          emptyMessage="You have no active reservations."
        >
          <div className="divide-y divide-gray-50">
            {activeReservations.map((record: any) => (
              <ReservationRow key={record._id} record={record} />
            ))}
          </div>
        </SectionCard>

        {/* Recently Borrowed Books */}
        <SectionCard
          title="Recently Borrowed Books"
          icon={<ArrowLeftRight size={16} />}
          iconBg="#F5F3FF"
          iconColor={PUR}
          loading={isLoading}
          error={isError}
          empty={recentlyBorrowed.length === 0}
          emptyMessage="No borrowing history yet."
        >
          <div className="divide-y divide-gray-50">
            {recentlyBorrowed.map((record: any) => (
              <RecentlyBorrowedRow key={record._id} record={record} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}