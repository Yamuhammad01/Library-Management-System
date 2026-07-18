import React, { useState, useMemo } from "react";
import {
  Search, Plus, Download, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2,
  ArrowLeft, MapPin, Hash, Globe, Building2, BookMarked,
  Calendar, BookOpen, Check, MoreVertical,
} from "lucide-react";
import {
  BookCover, BookStatusBadge, CatBadge, Fld, iCls, iSty,
  IconBtn, PageBtn, Avatar, COVER_PALETTE, CATEGORIES, LANGUAGES,
  PUBLISHERS, PUR,
} from "../components/BookUI";
import type { Book } from "../components/BookUI";
import { useBooks, useBook, useCreateBook, useUpdateBook, useDeleteBook } from "../hooks/useBooks";

/* ──────────────────── Helpers ──────────────────── */
function toBFD(b: Book) {
  return {
    _id: b._id,
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    category: b.category,
    publisher: b.publisher,
    year: String(b.year),
    edition: b.edition,
    pages: String(b.pages),
    language: b.language,
    description: b.description,
    shelfLocation: b.shelfLocation,
    totalCopies: String(b.totalCopies),
    availableCopies: String(b.availableCopies),
    coverColor: b.coverColor,
  };
}

interface BFD {
  _id?: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publisher: string;
  year: string;
  edition: string;
  pages: string;
  language: string;
  description: string;
  shelfLocation: string;
  totalCopies: string;
  availableCopies: string;
  coverColor: string;
}

const BLANK_BF: BFD = {
  _id: undefined,
  isbn: "", title: "", author: "", category: "", publisher: "",
  year: "", edition: "", pages: "", language: "English",
  description: "", shelfLocation: "", totalCopies: "1",
  availableCopies: "1", coverColor: COVER_PALETTE[0],
};

/* ──────────────────── Book List View ──────────────────── */
function BooksPageView({ onAdd, onEdit, onDetails }: {
  onAdd: () => void;
  onEdit: (b: Book) => void;
  onDetails: (b: Book) => void;
}) {
  const [search, setSearch] = useState("");
  const [catF, setCat] = useState("");
  const [stF, setSt] = useState("");
  const [pg, setPg] = useState(1);

  const { data, isLoading, isError, error } = useBooks({
    page: pg,
    search,
    category: catF,
    status: stF,
  });

  const books = data?.books ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPg(1); };
  const handleCategory = (v: string) => { setCat(v); setPg(1); };
  const handleStatus = (v: string) => { setSt(v); setPg(1); };

  const deleteBook = useDeleteBook();
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      (deleteBook as any).mutate(id);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">All Books</h1>
          <p className="text-xs text-gray-400 mt-0.5">Library Catalog › Catalog › All Books</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90"
            style={{ background: PUR, boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}>
            <Plus size={14} /> Add New Book
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by title, author, or ISBN…"
            className="w-full text-sm outline-none rounded-xl border border-gray-200 bg-white focus:border-purple-600"
            style={{ padding: "9px 12px 9px 34px" }} />
        </div>
        {[
          { val: catF, set: handleCategory, opts: CATEGORIES, ph: "All Categories" },
          { val: stF, set: handleStatus, opts: ["available", "low-stock", "checked-out", "reserved"], ph: "All Status" },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
            className="text-sm outline-none rounded-xl border border-gray-200 bg-white appearance-none"
            style={{
              padding: "9px 28px 9px 12px", color: f.val ? "#111827" : "#9CA3AF",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
            }}>
            <option value="">{f.ph}</option>
            {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {(search || catF || stF) && <button onClick={() => { setSearch(""); setCat(""); setSt(""); setPg(1); }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><X size={12} /> Clear</button>}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-400">Loading books...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-red-500">Failed to load books. Please try again.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #F3F4F6" }}>
                    {["Cover", "ISBN", "Title & Author", "Category", "Publisher", "Copies", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left font-semibold text-gray-500 py-3"
                        style={{ fontSize: 11, letterSpacing: "0.06em", padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0
                    ? <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">No books match your search.</td></tr>
                    : books.map((b: Book, i: number) => (
                      <tr key={b._id} style={{ borderBottom: "1px solid #F9FAFB", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}
                        className="hover:bg-purple-50 transition-colors">
                        <td style={{ padding: "10px 16px" }}><BookCover color={b.coverColor} title={b.title} size="sm" /></td>
                        <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: 11, color: "#6B7280", whiteSpace: "nowrap" }}>{b.isbn}</td>
                        <td style={{ padding: "10px 16px", maxWidth: 220 }}>
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{b.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{b.author}</p>
                        </td>
                        <td style={{ padding: "10px 16px" }}><CatBadge label={b.category} /></td>
                        <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{b.publisher}</td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <p className="font-bold text-sm" style={{ color: b.availableCopies === 0 ? "#DC2626" : "#111827" }}>{b.availableCopies}</p>
                          <p className="text-xs text-gray-400">/ {b.totalCopies}</p>
                        </td>
                        <td style={{ padding: "10px 16px" }}><BookStatusBadge status={b.status} /></td>
                        <td style={{ padding: "10px 16px" }}>
                          <div className="flex items-center gap-1">
                            <IconBtn color="#2563EB" title="View Details" onClick={() => onDetails(b)}><Eye size={13} /></IconBtn>
                            <IconBtn color="#D97706" title="Edit Book" onClick={() => onEdit(b)}><Pencil size={13} /></IconBtn>
                            <IconBtn color="#DC2626" title="Delete Book" onClick={() => handleDelete(b._id)}><Trash2 size={13} /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing <strong>{total === 0 ? 0 : (pg - 1) * 8 + 1}–{Math.min(pg * 8, total)}</strong> of <strong>{total}</strong> books
              </p>
              <div className="flex items-center gap-1">
                <PageBtn disabled={pg === 1} onClick={() => setPg(p => p - 1)}><ChevronLeft size={14} /></PageBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <PageBtn key={n} active={n === pg} onClick={() => setPg(n)}>{n}</PageBtn>
                ))}
                <PageBtn disabled={pg === totalPages} onClick={() => setPg(p => p + 1)}><ChevronRight size={14} /></PageBtn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Book Form View ──────────────────── */
function BookFormView({ mode, initial, originalBook, onBack }: {
  mode: "add" | "edit";
  initial: BFD;
  originalBook?: BFD;
  onBack: () => void;
}) {
  const [form, setForm] = useState<BFD>(initial);
  const [saved, setSaved] = useState(false);
  const [errs, setErrs] = useState<Partial<BFD>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const isMod = (k: keyof BFD) => mode === "edit" && !!originalBook && form[k] !== originalBook[k];
  const set = (k: keyof BFD) => (v: string) => { setForm(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: undefined })); };
  const validate = () => {
    const e: Partial<BFD> = {};
    if (!form.isbn.trim()) e.isbn = "Required";
    if (!form.title.trim()) e.title = "Required";
    if (!form.author.trim()) e.author = "Required";
    if (!form.category) e.category = "Required";
    if (!form.publisher.trim()) e.publisher = "Required";
    if (!form.shelfLocation.trim()) e.shelfLocation = "Required";
    if (!form.totalCopies || isNaN(Number(form.totalCopies))) e.totalCopies = "Required";
    return e;
  };
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setApiError(null);
    try {
      const payload = {
        isbn: form.isbn, title: form.title, author: form.author,
        category: form.category, publisher: form.publisher, year: form.year || "2024",
        edition: form.edition, pages: form.pages || "0", language: form.language,
        description: form.description, shelfLocation: form.shelfLocation,
        totalCopies: form.totalCopies, availableCopies: form.availableCopies || form.totalCopies,
        coverColor: form.coverColor,
      };
      if (mode === "add") {
        await (createBook as any).mutateAsync(payload);
      } else if (form._id) {
        await (updateBook as any).mutateAsync({ id: form._id, data: payload });
      }
      setSaved(true);
      setTimeout(() => { setSaved(false); onBack(); }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Something went wrong. Please try again.";
      setApiError(msg);
    }
  };

  const inp = (k: keyof BFD, label: string, ph: string, opts?: { type?: string }) => (
    <Fld label={label} modified={isMod(k)}>
      <input value={form[k] as string} onChange={e => set(k)(e.target.value)} type={opts?.type || "text"} placeholder={ph}
        className={iCls} style={{ ...iSty, borderColor: errs[k] ? "#DC2626" : undefined }} />
      {errs[k] && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#DC2626" }}><AlertCircle size={11} />{errs[k]}</p>}
    </Fld>
  );
  const sel = (k: keyof BFD, label: string, opts: string[]) => (
    <Fld label={label} modified={isMod(k)}>
      <select value={form[k] as string} onChange={e => set(k)(e.target.value)} className={`${iCls} appearance-none`} style={{ ...iSty, borderColor: errs[k] ? "#DC2626" : undefined }}>
        <option value="">Select…</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {errs[k] && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#DC2626" }}><AlertCircle size={11} />{errs[k]}</p>}
    </Fld>
  );

  const isPending = createBook.isPending || updateBook.isPending;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50">
          <ArrowLeft size={15} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">{mode === "add" ? "Add New Book" : "Edit Book"}</h1>
          <p className="text-xs text-gray-400">Library Catalog › Catalog › {mode === "add" ? "Add New Book" : "Edit Book"}</p>
        </div>
      </div>
      {saved && <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}><CheckCircle2 size={15} style={{ color: "#059669" }} /><p className="text-sm font-medium" style={{ color: "#065F46" }}>Book {mode === "add" ? "added" : "updated"} successfully!</p></div>}
      {apiError && <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}><AlertCircle size={15} style={{ color: "#DC2626" }} /><p className="text-sm font-medium" style={{ color: "#991B1B" }}>{apiError}</p></div>}
      {(createBook.isPending || updateBook.isPending) && <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium" style={{ color: "#1E40AF" }}>{mode === "add" ? "Adding book..." : "Saving changes..."}</p>
      </div>}

      <div className="flex gap-5">
        <div className="shrink-0" style={{ width: 200 }}>
          <div className="rounded-2xl p-4 flex flex-col gap-4" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Book Cover</p>
            <div className="flex flex-col items-center gap-3">
              <BookCover color={form.coverColor} title={form.title || "?"} size="lg" />
              <p className="text-xs text-gray-500 text-center leading-snug">{form.title || "Book title preview"}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", marginBottom: 8 }}>COVER COLOR</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
                {COVER_PALETTE.map(c => (
                  <button key={c} onClick={() => set("coverColor")(c)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ background: c, border: form.coverColor === c ? "2px solid #fff" : "none", boxShadow: form.coverColor === c ? `0 0 0 2px ${c}` : "none" }}>
                    {form.coverColor === c && <Check size={11} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Inventory</p>
              <Fld label="Total Copies" modified={isMod("totalCopies")}><input value={form.totalCopies} onChange={e => set("totalCopies")(e.target.value)} type="number" min="1" className={iCls} style={iSty} /></Fld>
              <Fld label="Available" modified={isMod("availableCopies")}><input value={form.availableCopies} onChange={e => set("availableCopies")(e.target.value)} type="number" min="0" className={iCls} style={iSty} /></Fld>
            </div>
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-5 flex flex-col gap-4" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{inp("isbn", "ISBN", "e.g. 978-0-262-03384-8")}{inp("year", "Publication Year", "e.g. 2022")}</div>
          {inp("title", "Book Title", "Enter the full book title")}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{inp("author", "Author(s)", "Full name(s)")}{sel("publisher", "Publisher", PUBLISHERS)}</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{sel("category", "Category", CATEGORIES)}{inp("edition", "Edition", "e.g. 4th Edition")}</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>{inp("pages", "Pages", "e.g. 1312", { type: "number" })}{sel("language", "Language", LANGUAGES)}</div>
          {inp("shelfLocation", "Shelf Location", "e.g. CS-A1-001")}
          <Fld label="Description" modified={isMod("description")}><textarea value={form.description} onChange={e => set("description")(e.target.value)} rows={4} placeholder="Brief description…" className={iCls} style={{ ...iSty, resize: "vertical" }} /></Fld>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onBack} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={isPending}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: PUR, boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}>
              {isPending ? "Saving..." : mode === "add" ? "Add Book" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Book Details View ──────────────────── */
function BookDetailsView({ book, onBack, onEdit }: { book: Book; onBack: () => void; onEdit: (b: Book) => void }) {
  const { data: detailedBook, isLoading } = useBook(book._id);

  const b = detailedBook || book;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50"><ArrowLeft size={15} className="text-gray-600" /></button>
        <div className="flex-1">
          <h1 className="font-extrabold text-xl text-gray-900">Book Details</h1>
          <p className="text-xs text-gray-400">Library Catalog › Catalog › Book Details</p>
        </div>
        <button onClick={() => onEdit(b)} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90"
          style={{ background: PUR, boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}><Pencil size={13} /> Edit Book</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">Loading details...</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-5 items-start">
          <div className="flex-1 flex flex-col gap-4">
            <div className="rounded-2xl p-5 flex gap-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <BookCover color={b.coverColor} title={b.title} size="lg" />
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h2 className="font-extrabold text-lg text-gray-900 leading-tight flex-1">{b.title}</h2>
                  <BookStatusBadge status={b.status} />
                </div>
                <p className="text-sm text-gray-500 mb-3">{b.author}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <CatBadge label={b.category} />
                  <span style={{ fontSize: 11, background: "#F3F4F6", color: "#6B7280", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>{b.edition}</span>
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                  {[
                    { icon: <Hash size={13} />, label: "ISBN", value: b.isbn, mono: true },
                    { icon: <MapPin size={13} />, label: "Shelf", value: b.shelfLocation },
                    { icon: <BookOpen size={13} />, label: "Pages", value: String(b.pages) },
                    { icon: <Building2 size={13} />, label: "Publisher", value: b.publisher },
                    { icon: <Calendar size={13} />, label: "Year", value: String(b.year) },
                    { icon: <BookMarked size={13} />, label: "Borrows", value: String(b.borrowCount) },
                  ].map(s => (
                    <div key={s.label} className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-gray-400">{s.icon}<span style={{ fontSize: 11, fontWeight: 600 }}>{s.label}</span></div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", fontFamily: s.mono ? "monospace" : undefined }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", marginBottom: 10 }}>DESCRIPTION</p>
              <p className="text-sm leading-relaxed text-gray-600">{b.description}</p>
            </div>
            <div className="rounded-2xl p-5 grid gap-4" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                { label: "Total Copies", v: b.totalCopies, c: PUR },
                { label: "Available", v: b.availableCopies, c: "#059669" },
                { label: "On Loan", v: b.totalCopies - b.availableCopies, c: "#D97706" },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 py-2">
                  <p className="text-2xl font-extrabold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-xs font-semibold text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Main Export ──────────────────── */
export default function BookCatalogPage({
  userRole,
}: {
  userRole: string;
}) {
  const [view, setView] = useState<"list" | "add" | "edit" | "details">("list");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editOrig, setEditOrig] = useState<BFD | null>(null);

  const canAccess = userRole === "Librarian" || userRole === "Admin";

  if (!canAccess) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-4xl mb-2">🔒</p>
          <h2 className="font-bold text-xl text-gray-900 mb-1">Access Restricted</h2>
          <p className="text-sm text-gray-500">You do not have permission to access the Book Catalog.</p>
          <p className="text-xs text-gray-400 mt-1">Required role: Librarian or Admin</p>
        </div>
      </div>
    );
  }

  const goList = () => { setSelectedBook(null); setEditOrig(null); setView("list"); };
  const goAdd = () => setView("add");
  const goEdit = (b: Book) => { setSelectedBook(b); setEditOrig(toBFD(b)); setView("edit"); };
  const goDetails = (b: Book) => { setSelectedBook(b); setView("details"); };

  return (
    <>
      {view === "list" && <BooksPageView onAdd={goAdd} onEdit={goEdit} onDetails={goDetails} />}
      {view === "add" && <BookFormView mode="add" initial={BLANK_BF} onBack={goList} />}
      {view === "edit" && selectedBook && editOrig && (
        <BookFormView mode="edit" initial={toBFD(selectedBook)} originalBook={editOrig} onBack={goList} />
      )}
      {view === "details" && selectedBook && <BookDetailsView book={selectedBook} onBack={goList} onEdit={goEdit} />}
    </>
  );
}