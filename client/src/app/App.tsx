import { useState, useMemo, useRef, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import BookCatalogPage from "./pages/BookCatalogPage";
import BorrowingManagementPage from "./pages/BorrowingManagementPage";
import {
  BookOpen, Search, Plus, Download, Eye, Pencil, Trash2,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle2,
  LayoutDashboard, ArrowLeftRight, Users, BarChart3, Settings,
  LogOut, ChevronDown, Bell, MessageSquare, LayoutGrid, TrendingUp,
  TrendingDown, BookCopy, ArrowLeft, MapPin, Calendar, Hash,
  Globe, BookMarked, GraduationCap, Building2, User,
  MoreVertical, Check, RotateCcw, RefreshCw, ClipboardList,
  UserCheck, BookPlus, AlertTriangle, Clock, BadgeCheck,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  useDashboardStats,
  useBorrowingActivity,
  useCategoryData,
} from "./hooks/useDashboard";
import { useBooks } from "./hooks/useBooks";
import { fetchMe } from "./services/api";
import {
  BookCover, BookStatusBadge, BorrowBadge, DaysLeftPill, CatBadge,
  Avatar, Fld, iCls, iSty, IconBtn, PageBtn, PUR, TODAY, addDays,
} from "./components/BookUI";
import type { Book, BookStatus, BorrowStatus } from "./components/BookUI";

/* ─────────────────────────── TYPES ─────────────────────────── */
type BorrowTab     = "active"    | "history"   | "reservations";
type ActiveSection = "dashboard" | "books"     | "borrowing";
type View =
  | "dashboard" | "books" | "add" | "edit" | "details"
  | "borrowing" | "issue";

interface BorrowRecord {
  id: number; bookId: number; bookTitle: string; bookCoverColor: string;
  isbn: string; memberId: string; memberName: string;
  memberType: "student" | "staff"; borrowDate: string; dueDate: string;
  returnDate?: string; status: BorrowStatus;
}
interface Member {
  id: string; name: string; type: "student" | "staff";
  department: string; activeLoans: number; email: string;
}

/* ─────────────────────── MOCK: BORROWINGS ──────────────────── */
const SEED_BORROWS: BorrowRecord[] = [
  { id:1,  bookId:1, bookTitle:"Introduction to Algorithms",          bookCoverColor:"#6D28D9", isbn:"978-0-262-03384-8", memberId:"STU-2024-0042", memberName:"Emily Chen",       memberType:"student", borrowDate:"2026-06-28", dueDate:"2026-07-15", status:"borrowed"  },
  { id:2,  bookId:1, bookTitle:"Introduction to Algorithms",          bookCoverColor:"#6D28D9", isbn:"978-0-262-03384-8", memberId:"STU-2024-0087", memberName:"James Wilson",     memberType:"student", borrowDate:"2026-07-01", dueDate:"2026-07-15", status:"borrowed"  },
  { id:3,  bookId:2, bookTitle:"Molecular Biology of the Cell",       bookCoverColor:"#059669", isbn:"978-0-393-88443-0", memberId:"STF-2024-0012", memberName:"Aisha Rahman",    memberType:"staff",   borrowDate:"2026-06-15", dueDate:"2026-06-29", status:"overdue"   },
  { id:4,  bookId:3, bookTitle:"Principles of Economics",             bookCoverColor:"#D97706", isbn:"978-0-357-72210-3", memberId:"STU-2024-0156", memberName:"Michael Torres",  memberType:"student", borrowDate:"2026-07-05", dueDate:"2026-07-26", status:"borrowed"  },
  { id:5,  bookId:5, bookTitle:"Organic Chemistry",                   bookCoverColor:"#0891B2", isbn:"978-0-470-92765-0", memberId:"STU-2024-0203", memberName:"Priya Sharma",   memberType:"student", borrowDate:"2026-06-20", dueDate:"2026-07-04", status:"overdue"   },
  { id:6,  bookId:4, bookTitle:"Calculus: Early Transcendentals",     bookCoverColor:"#2563EB", isbn:"978-1-285-74155-0", memberId:"STU-2023-0089", memberName:"Daniel Park",     memberType:"student", borrowDate:"2026-07-08", dueDate:"2026-07-22", status:"borrowed"  },
  { id:7,  bookId:6, bookTitle:"Fundamentals of Physics",             bookCoverColor:"#7C3AED", isbn:"978-1-119-46049-7", memberId:"STU-2023-0134", memberName:"Sophie Martin",   memberType:"student", borrowDate:"2026-07-10", dueDate:"2026-07-17", status:"borrowed"  },
  { id:8,  bookId:2, bookTitle:"Molecular Biology of the Cell",       bookCoverColor:"#059669", isbn:"978-0-393-88443-0", memberId:"STU-2024-0055", memberName:"Kevin Liu",       memberType:"student", borrowDate:"2026-07-09", dueDate:"2026-07-12", status:"borrowed"  },
  { id:9,  bookId:8, bookTitle:"A History of Western Philosophy",     bookCoverColor:"#DB2777", isbn:"978-0-521-63306-9", memberId:"STU-2025-0021", memberName:"Lucas Nguyen",   memberType:"student", borrowDate:"2026-07-11", dueDate:"2026-07-25", status:"borrowed"  },
  { id:10, bookId:7, bookTitle:"Medical Physiology",                  bookCoverColor:"#DC2626", isbn:"978-0-7020-7504-4", memberId:"STF-2024-0008", memberName:"Fatima Al-Zahra",memberType:"staff",   borrowDate:"2026-07-10", dueDate:""           , status:"reserved"  },
  { id:11, bookId:3, bookTitle:"Principles of Economics",             bookCoverColor:"#D97706", isbn:"978-0-357-72210-3", memberId:"STU-2025-0021", memberName:"Lucas Nguyen",   memberType:"student", borrowDate:"2026-07-12", dueDate:"",            status:"reserved"  },
  { id:12, bookId:10,bookTitle:"Quantitative Chemical Analysis",      bookCoverColor:"#0D9488", isbn:"978-0-470-64818-0", memberId:"STU-2024-0042", memberName:"Emily Chen",      memberType:"student", borrowDate:"2026-06-01", dueDate:"2026-06-15", returnDate:"2026-06-13", status:"returned" },
  { id:13, bookId:7, bookTitle:"Medical Physiology",                  bookCoverColor:"#DC2626", isbn:"978-0-7020-7504-4", memberId:"STU-2024-0055", memberName:"Kevin Liu",       memberType:"student", borrowDate:"2026-05-01", dueDate:"2026-05-15", returnDate:"2026-05-14", status:"returned" },
  { id:14, bookId:9, bookTitle:"Cambridge History of the English Language", bookCoverColor:"#BE123C", isbn:"978-0-521-67444-4", memberId:"STU-2023-0089", memberName:"Daniel Park", memberType:"student", borrowDate:"2026-04-01", dueDate:"2026-04-15", returnDate:"2026-04-17", status:"returned" },
  { id:15, bookId:4, bookTitle:"Calculus: Early Transcendentals",     bookCoverColor:"#2563EB", isbn:"978-1-285-74155-0", memberId:"STU-2024-0203", memberName:"Priya Sharma",   memberType:"student", borrowDate:"2026-03-10", dueDate:"2026-03-24", returnDate:"2026-03-23", status:"returned" },
];

/* ──────────────────────── MOCK: MEMBERS ────────────────────── */
const MOCK_MEMBERS: Member[] = [
  { id:"STU-2024-0042", name:"Emily Chen",        type:"student", department:"Computer Science", activeLoans:2, email:"e.chen@uni.edu"       },
  { id:"STU-2024-0087", name:"James Wilson",      type:"student", department:"Biology",          activeLoans:1, email:"j.wilson@uni.edu"     },
  { id:"STF-2024-0012", name:"Aisha Rahman",      type:"staff",   department:"Library Services", activeLoans:1, email:"a.rahman@uni.edu"     },
  { id:"STU-2024-0156", name:"Michael Torres",    type:"student", department:"Economics",        activeLoans:1, email:"m.torres@uni.edu"     },
  { id:"STU-2024-0203", name:"Priya Sharma",      type:"student", department:"Chemistry",        activeLoans:0, email:"p.sharma@uni.edu"     },
  { id:"STU-2023-0089", name:"Daniel Park",       type:"student", department:"Mathematics",      activeLoans:1, email:"d.park@uni.edu"       },
  { id:"STU-2023-0134", name:"Sophie Martin",     type:"student", department:"Physics",          activeLoans:1, email:"s.martin@uni.edu"     },
  { id:"STU-2024-0055", name:"Kevin Liu",         type:"student", department:"Medicine",         activeLoans:1, email:"k.liu@uni.edu"        },
  { id:"STF-2024-0008", name:"Fatima Al-Zahra",  type:"staff",   department:"Research",         activeLoans:0, email:"f.alzahra@uni.edu"    },
  { id:"STU-2025-0021", name:"Lucas Nguyen",      type:"student", department:"Philosophy",       activeLoans:0, email:"l.nguyen@uni.edu"     },
  { id:"STU-2025-0044", name:"Sara Okafor",       type:"student", department:"History",          activeLoans:0, email:"s.okafor@uni.edu"     },
  { id:"STF-2025-0003", name:"Prof. Mark Evans", type:"staff",   department:"Literature",       activeLoans:0, email:"m.evans@uni.edu"      },
];

/* ──────────────────────── HELPERS ──────────────────────────── */
function getDaysLeft(dueDate: string): number {
  if (!dueDate) return 0;
  const due   = new Date(dueDate);
  const today = new Date(TODAY);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" });
}

/* ──────────────────────── SIDEBAR ──────────────────────────── */
function Sidebar({ active, onNav, user, onLogout }: { active:ActiveSection; onNav:(v:View)=>void; user:{name:string;role:string}; onLogout:()=>void }) {
  const [catOpen, setCatOpen] = useState(true);
  const [borOpen, setBorOpen] = useState(true);
  const [memOpen, setMemOpen] = useState(false);

  const navItem = (icon:React.ReactNode, label:string, isActive:boolean, onClick:()=>void) => (
    <button onClick={onClick}
      className="flex items-center gap-2.5 py-2 w-full text-left rounded-lg transition-colors"
      style={{color:isActive?PUR:"#6B7280",fontWeight:isActive?600:500,fontSize:13,
        background:isActive?"#F5F3FF":"transparent",padding:"8px 16px"}}>
      <span style={{color:isActive?PUR:"#9CA3AF"}}>{icon}</span>{label}
    </button>
  );
  const secHdr = (icon:React.ReactNode, label:string, open:boolean, toggle:()=>void) => (
    <button onClick={toggle}
      className="flex items-center gap-2.5 py-2 w-full text-left hover:text-gray-700 transition-colors"
      style={{color:"#374151",fontWeight:600,fontSize:13,padding:"8px 16px"}}>
      <span className="text-gray-400">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronDown size={13} className="text-gray-400" style={{transform:open?"none":"rotate(-90deg)",transition:"transform .2s"}}/>
    </button>
  );
  const subItem = (label:string, isActive:boolean, onClick:()=>void) => (
    <button onClick={onClick}
      className="flex items-center gap-2.5 py-1.5 w-full text-left transition-colors"
      style={{fontSize:12.5,color:isActive?PUR:"#6B7280",fontWeight:isActive?600:400,paddingLeft:36,paddingRight:16}}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:isActive?PUR:"#D1D5DB"}}/>
      {label}
    </button>
  );

  const initials = user.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  return (
    <aside style={{width:210,background:"#fff",borderRight:"1px solid rgba(0,0,0,0.06)"}}
      className="shrink-0 flex flex-col overflow-y-auto">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{background:PUR}}>{initials}</div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>
      </div>
      <nav className="flex flex-col py-3 gap-0.5 px-2">
        {navItem(<LayoutDashboard size={15}/>, "Dashboard", active==="dashboard", ()=>onNav("dashboard"))}
        <div className="px-2 py-1"><p style={{fontSize:10,fontWeight:700,color:"#9CA3AF",letterSpacing:"0.08em"}}>LIBRARY</p></div>
        {secHdr(<BookOpen size={15}/>, "Catalog", catOpen, ()=>setCatOpen(!catOpen))}
        {catOpen && <>
          {subItem("All Books",  active==="books",    ()=>onNav("books"))}
          {subItem("Categories", false,               ()=>{})}
          {subItem("Authors",    false,               ()=>{})}
          {subItem("Publishers", false,               ()=>{})}
        </>}
        {(user.role === "Librarian" || user.role === "Admin") && (
          <>
            {secHdr(<ArrowLeftRight size={15}/>, "Borrowing", borOpen, ()=>setBorOpen(!borOpen))}
            {borOpen && <>
              {subItem("Borrow Books",     active==="borrowing", ()=>onNav("borrowing"))}
              {subItem("Return Books",     false,                ()=>onNav("borrowing"))}
              {subItem("Borrowing History",false,                ()=>onNav("borrowing"))}
              {subItem("Reservations",     false,                ()=>onNav("borrowing"))}
            </>}
          </>
        )}
        {secHdr(<Users size={15}/>, "Members", memOpen, ()=>setMemOpen(!memOpen))}
        {memOpen && <>
          {subItem("Students", false, ()=>{})}
          {subItem("Staff",    false, ()=>{})}
        </>}
        <div className="mx-2 my-2 border-t border-gray-100"/>
        {navItem(<BarChart3 size={15}/>, "Reports",  false, ()=>{})}
        {navItem(<Settings  size={15}/>, "Settings", false, ()=>{})}
        <button onClick={onLogout} className="flex items-center gap-2.5 py-2 w-full text-left rounded-lg transition-colors"
          style={{color:"#EF4444",fontSize:13,fontWeight:500,padding:"8px 16px"}}>
          <LogOut size={15} style={{color:"#EF4444"}}/>Logout
          <ChevronRight size={13} className="ml-auto opacity-40"/>
        </button>
      </nav>
    </aside>
  );
}
/* ──────────────────────── HEADER ───────────────────────────── */
function Header() {
  return (
    <header className="shrink-0 flex items-center justify-between px-6"
      style={{height:56,background:"#fff",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
      <div className="flex items-center gap-2 w-52 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:PUR}}>
          <BookOpen size={14} color="#fff" strokeWidth={2.5}/>
        </div>
        <span className="font-bold text-gray-900 text-base tracking-tight">UniLib</span>
      </div>
      <nav className="flex items-center gap-6">
        {["Dashboards","Catalog","Borrowing","Members","Help"].map((item,i)=>(
          <button key={item} className="text-sm font-medium"
            style={{color:i===0?PUR:"#6B7280"}}>{item}</button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <button className="text-gray-400"><Search size={18}/></button>
        <button className="text-gray-400"><MessageSquare size={18}/></button>
        <button className="relative text-gray-400">
          <Bell size={18}/>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
            style={{background:PUR,fontSize:9}}>4</span>
        </button>
        <button className="text-gray-400"><LayoutGrid size={18}/></button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{background:PUR}}>SB</div>
      </div>
    </header>
  );
}

/* ──────────────────────── SHELL ─────────────────────────────── */
function Shell({ children, active, onNav, user, onLogout }: { children:React.ReactNode; active:ActiveSection; onNav:(v:View)=>void; user:{name:string;role:string}; onLogout:()=>void }) {
  return (
    <div style={{fontFamily:"'Inter',sans-serif",background:"#EBEDF2"}} className="w-full h-screen flex flex-col overflow-hidden">
      <Header/>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onNav={onNav} user={user} onLogout={onLogout}/>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}


/* ─────────────────── ISSUE BOOK PAGE ──────────────────────── */
function IssueBookPage({ onBack }: { onBack: () => void }) {
  const [memberQ,  setMemberQ]  = useState("");
  const [bookQ,    setBookQ]    = useState("");
  const [member,   setMember]   = useState<Member|null>(null);
  const [book,     setBook]     = useState<Book|null>(null);
  const [loanDays, setLoanDays] = useState(14);
  const [borrowDate,setBD]      = useState(TODAY);
  const [notes,    setNotes]    = useState("");
  const [issued,   setIssued]   = useState(false);
  const [errors,   setErrors]   = useState<{member?:string;book?:string}>({});

  const dueDate = useMemo(()=>addDays(borrowDate,loanDays),[borrowDate,loanDays]);

  const { data: booksData } = useBooks({ search: bookQ, status: "Available" });
  const availableBooks = booksData?.books || [];

  const filteredMembers = MOCK_MEMBERS.filter(m=>{
    const q=memberQ.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
  });
  const filteredBooks = availableBooks.filter((b: Book) => b.availableCopies > 0);

  const handleIssue = () => {
    const e: typeof errors = {};
    if (!member) e.member = "Please select a member.";
    if (!book)   e.book   = "Please select a book.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setIssued(true);
    setTimeout(onBack, 1600);
  };

  const LOAN_OPTIONS = [7, 14, 21, 30];

  const MemberRow = ({ m }: { m: Member }) => (
    <button onClick={()=>{setMember(m);setMemberQ("");setErrors(p=>({...p,member:undefined}));}}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0">
      <Avatar name={m.name} size={32}/>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{m.name}</p>
        <p className="text-xs text-gray-400">{m.id} · {m.department}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span style={{fontSize:10,fontWeight:700,background:m.type==="staff"?"#FFF7ED":"#F5F3FF",color:m.type==="staff"?"#D97706":PUR,padding:"1px 6px",borderRadius:8}}>{m.type}</span>
        <span style={{fontSize:10,color:"#9CA3AF"}}>{m.activeLoans} active loans</span>
      </div>
    </button>
  );

  function BookRow({ book }: { book: Book }) {
    return (
      <button key={book.isbn} onClick={()=>{setBook(book);setBookQ("");setErrors(p=>({...p,book:undefined}));}}
        className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0">
        <BookCover color={book.coverColor} title={book.title} size="sm"/>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{book.title}</p>
          <p className="text-xs text-gray-400 truncate">{book.author.split(",")[0]}</p>
          <p className="text-xs" style={{fontFamily:"monospace",color:"#9CA3AF"}}>{book.isbn}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-bold" style={{color:"#059669"}}>{book.availableCopies} avail.</p>
          <CatBadge label={book.category}/>
        </div>
      </button>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50"><ArrowLeft size={15} className="text-gray-600"/></button>
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">Issue a Book</h1>
          <p className="text-xs text-gray-400">Library Catalog › Borrowing › Issue a Book</p>
        </div>
      </div>

      {issued && (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{background:"#ECFDF5",border:"1px solid #A7F3D0"}}>
          <CheckCircle2 size={15} style={{color:"#059669"}}/><p className="text-sm font-medium" style={{color:"#065F46"}}>Book issued successfully! Loan record created.</p>
        </div>
      )}

      <div className="flex gap-5 items-start">
        {/* Left: selections */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Member selection */}
          <div className="rounded-2xl p-5" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#EDE9FE"}}>
                <UserCheck size={15} style={{color:PUR}}/>
              </div>
              <div><p className="text-sm font-bold text-gray-900">Select Member</p><p className="text-xs text-gray-400">Search by name, ID, or department</p></div>
              {member && <button onClick={()=>setMember(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"><X size={11}/>Change</button>}
            </div>

            {!member ? (
              <div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input value={memberQ} onChange={e=>setMemberQ(e.target.value)} placeholder="Search members…"
                    className={iCls} style={{...iSty,paddingLeft:32,borderColor:errors.member?"#DC2626":undefined}}/>
                </div>
                {errors.member && <p className="flex items-center gap-1 text-xs mb-2" style={{color:"#DC2626"}}><AlertCircle size={11}/>{errors.member}</p>}
                <div className="rounded-xl border border-gray-100 overflow-hidden" style={{maxHeight:220,overflowY:"auto"}}>
                  {filteredMembers.length===0
                    ? <p className="text-xs text-gray-400 text-center py-6">No members found.</p>
                    : filteredMembers.map(m=><MemberRow key={m.id} m={m}/>)
                  }
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{background:"#F5F3FF",border:`1.5px solid ${PUR}22`}}>
                <Avatar name={member.name} size={40}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.id} · {member.department}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
                </div>
                <div className="text-right">
                  <span style={{fontSize:10,fontWeight:700,background:member.type==="staff"?"#FFF7ED":"#EDE9FE",color:member.type==="staff"?"#D97706":PUR,padding:"2px 8px",borderRadius:10,display:"block",marginBottom:4}}>{member.type}</span>
                  <p className="text-xs text-gray-400">{member.activeLoans} active loans</p>
                </div>
              </div>
            )}
          </div>

          {/* Book selection */}
          <div className="rounded-2xl p-5" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#ECFDF5"}}>
                <BookOpen size={15} style={{color:"#059669"}}/>
              </div>
              <div><p className="text-sm font-bold text-gray-900">Select Book</p><p className="text-xs text-gray-400">Only showing books with available copies</p></div>
              {book && <button onClick={()=>setBook(null)} className="ml-auto text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"><X size={11}/>Change</button>}
            </div>

            {!book ? (
              <div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input value={bookQ} onChange={e=>setBookQ(e.target.value)} placeholder="Search by title, ISBN, or author…"
                    className={iCls} style={{...iSty,paddingLeft:32,borderColor:errors.book?"#DC2626":undefined}}/>
                </div>
                {errors.book && <p className="flex items-center gap-1 text-xs mb-2" style={{color:"#DC2626"}}><AlertCircle size={11}/>{errors.book}</p>}
                <div className="rounded-xl border border-gray-100 overflow-hidden" style={{maxHeight:240,overflowY:"auto"}}>
                  {filteredBooks.length===0
                    ? <p className="text-xs text-gray-400 text-center py-6">No available books found.</p>
                    : filteredBooks.map((b)=> <BookRow key={b.isbn} book={b}/>)
                  }
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{background:"#F0FDF4",border:"1.5px solid #A7F3D0"}}>
                <BookCover color={book.coverColor} title={book.title} size="sm"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 leading-tight">{book.title}</p>
                  <p className="text-xs text-gray-500">{book.author.split(",")[0]}</p>
                  <p className="text-xs" style={{fontFamily:"monospace",color:"#9CA3AF"}}>{book.isbn}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{color:"#059669"}}>{book.availableCopies} copies available</p>
                  <p className="text-xs text-gray-400">{book.shelfLocation}</p>
                  <CatBadge label={book.category}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Loan details */}
        <div className="flex flex-col gap-4 shrink-0" style={{width:300}}>
          {/* Loan details card */}
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#FFF7ED"}}>
                <Calendar size={15} style={{color:"#D97706"}}/>
              </div>
              <div><p className="text-sm font-bold text-gray-900">Loan Details</p><p className="text-xs text-gray-400">Set borrow period</p></div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{fontSize:12,fontWeight:600,color:"#374151"}}>Borrow Date</label>
              <input type="date" value={borrowDate} onChange={e=>setBD(e.target.value)}
                className={iCls} style={iSty}/>
            </div>

            <div className="flex flex-col gap-2">
              <label style={{fontSize:12,fontWeight:600,color:"#374151"}}>Loan Period</label>
              <div className="grid grid-cols-4 gap-1.5">
                {LOAN_OPTIONS.map(d=>(
                  <button key={d} onClick={()=>setLoanDays(d)}
                    className="py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{background:loanDays===d?PUR:"#F3F4F6",color:loanDays===d?"#fff":"#6B7280",boxShadow:loanDays===d?"0 2px 8px rgba(109,40,217,0.3)":"none"}}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{fontSize:12,fontWeight:600,color:"#374151"}}>Due Date</label>
              <div className="rounded-lg px-3 py-2.5 flex items-center gap-2"
                style={{background:"#F5F3FF",border:`1.5px solid ${PUR}33`}}>
                <Calendar size={14} style={{color:PUR}}/>
                <span className="text-sm font-bold" style={{color:PUR}}>{fmtDate(dueDate)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{fontSize:12,fontWeight:600,color:"#374151"}}>Notes <span style={{color:"#9CA3AF",fontWeight:400}}>(optional)</span></label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                placeholder="Any special instructions…" className={iCls} style={{...iSty,resize:"none"}}/>
            </div>
          </div>

          {/* Summary card (shows when both selected) */}
          {member && book && (
            <div className="rounded-2xl p-4" style={{background:"#F5F3FF",border:`1.5px solid ${PUR}33`}}>
              <p style={{fontSize:11,fontWeight:700,color:PUR,letterSpacing:"0.06em",marginBottom:10}}>LOAN SUMMARY</p>
              <div className="flex flex-col gap-2.5">
                {[
                  {label:"Member",  value:member.name},
                  {label:"Book",    value:book.title},
                  {label:"From",    value:fmtDate(borrowDate)},
                  {label:"Due",     value:fmtDate(dueDate)},
                  {label:"Period",  value:`${loanDays} days`},
                ].map(r=>(
                  <div key={r.label} className="flex justify-between gap-2">
                    <span style={{fontSize:11,color:"#7C3AED",fontWeight:600}}>{r.label}</span>
                    <span style={{fontSize:11,color:"#4C1D95",fontWeight:700,textAlign:"right",maxWidth:170,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button onClick={handleIssue}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{background:PUR,boxShadow:"0 4px 16px rgba(109,40,217,0.35)"}}>
              <BookPlus size={15}/> Issue Book
            </button>
            <button onClick={onBack}
              className="py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── DASHBOARD OVERVIEW ────────────────────── */
function StatCard({ label, value, icon, bg, color, loading, error }:{ label:string; value:string|number; icon:React.ReactNode; bg:string; color:string; loading?:boolean; error?:boolean }) {
  return (
    <div className="rounded-xl p-4 flex flex-col justify-between" style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",minHeight:130}}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:bg,color}}>{icon}</div>
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-20 rounded bg-gray-200 animate-pulse mt-1"/>
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load</p>
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

function DashboardOverview({ onGoBooks, onGoBorrowing }:{ onGoBooks:()=>void; onGoBorrowing:()=>void }) {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useBorrowingActivity();
  const { data: categories, isLoading: catLoading } = useCategoryData();

  const STATS_DEFS = [
    {label:"Total Books",      value:stats?.totalBooks ?? "—", icon:<BookCopy size={20}/>,       bg:"#EDE9FE", color:PUR},
    {label:"Active Borrowers", value:stats?.activeBorrowers ?? "—", icon:<GraduationCap size={20}/>,   bg:"#FFF7ED", color:"#D97706"},
    {label:"Books Borrowed",   value:stats?.booksBorrowed ?? "—", icon:<BookMarked size={20}/>,      bg:"#ECFDF5", color:"#059669"},
    {label:"Overdue Returns",  value:stats?.overdueReturns ?? "—", icon:<AlertCircle size={20}/>,     bg:"#FEF2F2", color:"#DC2626"},
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div><h1 className="font-extrabold text-xl text-gray-900">Library Dashboard</h1><p className="text-xs text-gray-400 mt-0.5">Dashboard › Overview</p></div>
        <div className="flex items-center gap-2">
          <button onClick={onGoBorrowing} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"><ArrowLeftRight size={14}/> Borrowing</button>
          <button onClick={onGoBooks} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90" style={{background:PUR,boxShadow:"0 4px 14px rgba(109,40,217,0.3)"}}><BookOpen size={14}/> Manage Books</button>
        </div>
      </div>
      <div className="grid gap-4" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        {STATS_DEFS.map(s=>(
          <StatCard key={s.label} {...s} loading={statsLoading} error={statsError}/>
        ))}
      </div>
      <div className="grid gap-4" style={{gridTemplateColumns:"1fr 320px"}}>
        <div className="rounded-xl p-4" style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
          <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-gray-800">Borrowing Activity</p><MoreVertical size={16} className="text-gray-400"/></div>
          {activityLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activity || []} margin={{top:4,right:4,left:-28,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                <XAxis dataKey="m" tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                <Tooltip/>
                <Line type="monotone" dataKey="b" name="Borrowed" stroke={PUR} strokeWidth={2.5} dot={false}/>
                <Line type="monotone" dataKey="r" name="Returned" stroke="#D1D5DB" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          )}
          {activity && activity.length === 0 && !activityLoading && (
            <p className="text-center text-gray-400 text-sm py-8">No borrowing activity data yet.</p>
          )}
        </div>
        <div className="rounded-xl p-4" style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
          <p className="text-sm font-semibold text-gray-800 mb-3">By Category</p>
          {catLoading ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categories || []} margin={{top:4,right:4,left:-28,bottom:0}} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="n" tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
                <Tooltip/>
                <Bar dataKey="v" name="Borrowed" fill={PUR} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
          {categories && categories.length === 0 && !catLoading && (
            <p className="text-center text-gray-400 text-sm py-8">No category data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── APP ROOT ─────────────────────────── */
const queryClient = new QueryClient();

function AppContent() {
  const [user, setUser] = useState<{name:string;role:string;email:string}|null>(null);
  const [view,    setView]   = useState<View>("borrowing");
  const [selBook, setSel]    = useState<Book|null>(null);
  const [editOrig,setOrig]   = useState<any>(null);
  const [showRegister, setShowRegister] = useState(false);

  // Token persistence: check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("unilib_token");
    if (token) {
      fetchMe()
        .then((data) => {
          setUser({ name: data.user.fullName, role: data.user.role, email: data.user.email });
          setView("dashboard");
        })
        .catch(() => {
          localStorage.removeItem("unilib_token");
        });
    }
  }, []);

  const handleLogin = (u: {name:string;role:string;email:string}) => {
    setUser(u);
    setView("dashboard");
    setShowRegister(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("unilib_token");
    setView("borrowing");
  };

  const goBooks     = ()              => { setSel(null); setView("books"); };
  const goBorrowing = ()              => setView("borrowing");
  const goIssue     = ()              => setView("issue");

  const goNav = (v: View) => {
    if (v==="dashboard") setView("dashboard");
    if (v==="books")     setView("books");
    if (v==="borrowing") setView("borrowing");
  };

  const activeSection: ActiveSection =
    view==="dashboard"            ? "dashboard" :
    view==="books"||view==="add"||view==="edit"||view==="details" ? "books" :
    "borrowing";

  if (!user) {
    if (showRegister) {
      return <RegisterPage onBackToLogin={() => setShowRegister(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onGoToRegister={() => setShowRegister(true)} />;
  }

  return (
    <Shell active={activeSection} onNav={goNav} user={user} onLogout={handleLogout}>
      {view==="dashboard" && <DashboardOverview onGoBooks={goBooks} onGoBorrowing={goBorrowing}/>}
      {view==="books" || view==="add" || view==="edit" || view==="details"
        ? <BookCatalogPage userRole={user.role} />
        : null
      }
      {(view==="borrowing" || view==="issue") && (user.role === "Librarian" || user.role === "Admin") && (
        <>
          {view==="borrowing" && <BorrowingManagementPage onIssue={goIssue}/>}
          {view==="issue"     && <IssueBookPage onBack={goBorrowing}/>}
        </>
      )}
    </Shell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}