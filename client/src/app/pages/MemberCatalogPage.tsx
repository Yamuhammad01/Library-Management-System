import { useState, useMemo } from "react";
import { useBooks, useBookFilters } from "../hooks/useBooks";
import { useBorrowForSelf } from "../hooks/useBorrowing";
import {
  BookCover, BookStatusBadge, CatBadge, iCls, iSty, PUR,
} from "../components/BookUI";
import {
  Search, ChevronLeft, ChevronRight, BookOpen, MapPin, Calendar,
  Hash, Building2, AlertTriangle, RefreshCw, Filter, X,
  ArrowUpDown, BookMarked, BookPlus, Layers, CheckCircle2, AlertCircle,
} from "lucide-react";
import type { Book } from "../components/BookUI";

/* ─────────────────── SORT OPTIONS ─────────────────── */
const SORT_OPTIONS = [
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
  { label: "Title A-Z",    sortBy: "title",     sortOrder: "asc" },
  { label: "Title Z-A",    sortBy: "title",     sortOrder: "desc" },
  { label: "Author A-Z",   sortBy: "author",    sortOrder: "asc" },
  { label: "Year (New)",   sortBy: "year",      sortOrder: "desc" },
  { label: "Year (Old)",   sortBy: "year",      sortOrder: "asc" },
];

/* ─────────────────── BOOK CARD ─────────────────── */
function BookCard({ book, onBorrowSuccess }: { book: Book; onBorrowSuccess?: () => void }) {
  const isAvailable = book.availableCopies > 0;
  const [borrowMsg, setBorrowMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isBorrowing, setIsBorrowing] = useState(false);

  const borrowMutation = useBorrowForSelf();

  const handleBorrow = async () => {
    setIsBorrowing(true);
    setBorrowMsg(null);
    try {
      const res = await borrowMutation.mutateAsync({ bookId: book._id } as any);
      setBorrowMsg({ type: "success", text: (res as any)?.message || `Borrowed "${book.title}" successfully!` });
      onBorrowSuccess?.();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Borrow failed. Please try again.";
      setBorrowMsg({ type: "error", text: msg });
    } finally {
      setIsBorrowing(false);
      setTimeout(() => setBorrowMsg(null), 4000);
    }
  };

  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden transition-all hover:shadow-md"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
    >
      {/* Cover */}
      <div className="flex items-center justify-center p-4" style={{ background: `${book.coverColor}15` }}>
        <BookCover color={book.coverColor} title={book.title} size="lg" />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{book.title}</p>
            <p className="text-xs text-gray-500 truncate">{book.author}</p>
          </div>
          <BookStatusBadge status={book.status} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <CatBadge label={book.category} />
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {book.description || "No description available."}
        </p>

        <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin size={11} />
            <span>{book.shelfLocation}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar size={11} />
            <span>{book.year}</span>
            <span className="mx-1">·</span>
            <Building2 size={11} />
            <span className="truncate">{book.publisher}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Hash size={11} />
            <span>{book.isbn}</span>
          </div>
        </div>

        {/* Availability + Action */}
        <div className="flex flex-col gap-2 pt-2 border-t border-gray-50 mt-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">Available: </span>
              <span className="text-sm font-bold" style={{ color: isAvailable ? "#059669" : "#DC2626" }}>
                {book.availableCopies}/{book.totalCopies}
              </span>
            </div>
            <button
              onClick={handleBorrow}
              disabled={isBorrowing || !isAvailable}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{
                background: isAvailable ? PUR : "#D97706",
                boxShadow: isAvailable ? `0 2px 8px ${PUR}55` : "0 2px 8px rgba(217,119,6,0.3)",
              }}
            >
              {isBorrowing ? (
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : isAvailable ? (
                <><BookPlus size={13} /> Borrow</>
              ) : (
                <><BookMarked size={13} /> Unavailable</>
              )}
            </button>
          </div>

          {/* Feedback message */}
          {borrowMsg && (
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                background: borrowMsg.type === "success" ? "#ECFDF5" : "#FEF2F2",
                color: borrowMsg.type === "success" ? "#065F46" : "#991B1B",
                border: `1px solid ${borrowMsg.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              }}
            >
              {borrowMsg.type === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span className="flex-1">{borrowMsg.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function MemberCatalogPage() {
  // ── Search & filter state ──
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // ── Queries ──
  const { data, isLoading, isError, refetch } = useBooks({
    page, search, category, status, author, publisher, sortBy, sortOrder,
  });
  const { data: filterOptions } = useBookFilters();

  const books = data?.books || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // ── Handlers ──
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setCategory("");
    setStatus("");
    setAuthor("");
    setPublisher("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const handleSort = (s: string, o: string) => {
    // Fix the duplicate sortBy key in the SORT_OPTIONS "Year (Old)" entry
    setSortBy(s === "year" && o === "asc" ? "year" : s);
    setSortOrder(o as "asc" | "desc");
    setPage(1);
  };

  const hasActiveFilters = search || category || status || author || publisher;

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">Book Catalog</h1>
          <p className="text-xs text-gray-400 mt-0.5">Catalog › Browse available books</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by title, ISBN, or author..."
            className={iCls}
            style={{ ...iSty, paddingLeft: 34, paddingRight: 40 }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white hover:opacity-90"
          style={{ background: PUR }}
        >
          <Search size={14} /> Search
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
        >
          <Filter size={14} /> Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full" style={{ background: PUR }} />
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <X size={12} /> Clear All
              </button>
            )}
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {/* Category */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Category</label>
              <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
                className={iCls} style={{ ...iSty, fontSize: 12 }}>
                <option value="">All Categories</option>
                {(filterOptions?.categories || []).map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Availability</label>
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                className={iCls} style={{ ...iSty, fontSize: 12 }}>
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="low-stock">Low Stock</option>
                <option value="checked-out">Checked Out</option>
              </select>
            </div>

            {/* Author */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Author</label>
              <select value={author} onChange={e => { setAuthor(e.target.value); setPage(1); }}
                className={iCls} style={{ ...iSty, fontSize: 12 }}>
                <option value="">All Authors</option>
                {(filterOptions?.authors || []).map((a: string) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Publisher */}
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Publisher</label>
              <select value={publisher} onChange={e => { setPublisher(e.target.value); setPage(1); }}
                className={iCls} style={{ ...iSty, fontSize: 12 }}>
                <option value="">All Publishers</option>
                {(filterOptions?.publishers || []).map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
            <ArrowUpDown size={13} className="text-gray-400" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>Sort by:</span>
            <div className="flex gap-1.5 flex-wrap">
              {SORT_OPTIONS.map((opt) => {
                // Fix the duplicate sortBy key issue
                const isActive = sortBy === (opt.sortBy === "year" && opt.sortOrder === "asc" ? "year" : opt.sortBy) && sortOrder === opt.sortOrder;
                return (
                  <button
                    key={`${opt.sortBy}-${opt.sortOrder}`}
                    onClick={() => handleSort(opt.sortBy, opt.sortOrder)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                    style={{
                      background: isActive ? PUR : "#F3F4F6",
                      color: isActive ? "#fff" : "#6B7280",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {!isLoading && !isError && (
        <p className="text-xs text-gray-400">
          Showing {books.length} of {total} books
          {hasActiveFilters && " (filtered)"}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: "#fff" }}>
              <div className="h-40 bg-gray-100 animate-pulse" />
              <div className="p-3 flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-gray-100 animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
                <div className="h-3 w-full bg-gray-100 animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl p-6 flex flex-col items-center gap-3" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <AlertTriangle size={32} className="text-red-400" />
          <p className="text-sm text-red-500">Failed to load books. Please try again.</p>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && books.length === 0 && (
        <div className="rounded-xl p-10 flex flex-col items-center gap-3" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <Layers size={40} className="text-gray-300" />
          <p className="text-sm font-semibold text-gray-500">No books found</p>
          <p className="text-xs text-gray-400">Try adjusting your search or filters.</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold text-purple-600 underline">Clear all filters</button>
          )}
        </div>
      )}

      {/* Book Grid */}
      {!isLoading && !isError && books.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {books.map((book: Book) => (
            <BookCard key={book._id} book={book} onBorrowSuccess={refetch} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} className="text-gray-600" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors"
              style={{
                background: p === page ? PUR : "#F9FAFB",
                color: p === page ? "#fff" : "#374151",
              }}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={14} className="text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}