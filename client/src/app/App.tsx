import { useState, useMemo, useRef, useEffect } from "react";
import LoginPage from "./LoginPage";
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

/* ─────────────────────────── TYPES ─────────────────────────── */
type BookStatus    = "available" | "low-stock" | "checked-out" | "reserved";
type BorrowStatus  = "borrowed"  | "returned"  | "overdue"     | "reserved";
type BorrowTab     = "active"    | "history"   | "reservations";
type ActiveSection = "dashboard" | "books"     | "borrowing";
type View =
  | "dashboard" | "books" | "add" | "edit" | "details"
  | "borrowing" | "issue";

interface Book {
  id: number; isbn: string; title: string; author: string;
  category: string; publisher: string; year: number; edition: string;
  pages: number; language: string; description: string;
  shelfLocation: string; totalCopies: number; availableCopies: number;
  borrowCount: number; status: BookStatus; coverColor: string;
}
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

/* ───────────────────────── CONSTANTS ───────────────────────── */
const PUR = "#6D28D9";
const TODAY = "2026-07-12";

const COVER_PALETTE = [
  "#6D28D9","#059669","#D97706","#DC2626","#2563EB",
  "#DB2777","#0891B2","#7C3AED","#BE123C","#0D9488",
];
const CATEGORIES = [
  "Computer Science","Biology","Economics","Mathematics",
  "Physics","Chemistry","Medicine","Literature","Philosophy","History",
];
const LANGUAGES  = ["English","French","German","Spanish","Arabic","Mandarin"];
const PUBLISHERS = [
  "MIT Press","Oxford University Press","Cambridge University Press",
  "Wiley","Elsevier","Cengage","Springer","Pearson","Norton","Routledge",
];

/* ──────────────────────── MOCK: BOOKS ──────────────────────── */
const SEED_BOOKS: Book[] = [
  { id:1, isbn:"978-0-262-03384-8", title:"Introduction to Algorithms",
    author:"Thomas H. Cormen, Charles E. Leiserson", category:"Computer Science",
    publisher:"MIT Press", year:2022, edition:"4th Edition", pages:1312, language:"English",
    description:"A comprehensive introduction to modern algorithms presenting a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.",
    shelfLocation:"CS-A1-001", totalCopies:12, availableCopies:7, borrowCount:145, status:"available", coverColor:"#6D28D9" },
  { id:2, isbn:"978-0-393-88443-0", title:"Molecular Biology of the Cell",
    author:"Bruce Alberts, Rebecca Heald", category:"Biology",
    publisher:"Norton", year:2022, edition:"7th Edition", pages:1394, language:"English",
    description:"The leading cell biology textbook that conveys the excitement of modern biology by combining experimental material with a strong emphasis on the ways we know what we know.",
    shelfLocation:"BIO-B2-014", totalCopies:8, availableCopies:2, borrowCount:98, status:"low-stock", coverColor:"#059669" },
  { id:3, isbn:"978-0-357-72210-3", title:"Principles of Economics",
    author:"N. Gregory Mankiw", category:"Economics",
    publisher:"Cengage", year:2021, edition:"9th Edition", pages:896, language:"English",
    description:"Using real-world applications to help students engage with economic concepts, Mankiw builds upon the foundational principles of economic thinking.",
    shelfLocation:"ECO-C1-007", totalCopies:15, availableCopies:0, borrowCount:201, status:"checked-out", coverColor:"#D97706" },
  { id:4, isbn:"978-1-285-74155-0", title:"Calculus: Early Transcendentals",
    author:"James Stewart, Daniel Clegg", category:"Mathematics",
    publisher:"Cengage", year:2020, edition:"9th Edition", pages:1376, language:"English",
    description:"James Stewart's Calculus series is the top-seller worldwide because of its problem-solving focus and outstanding examples.",
    shelfLocation:"MAT-A3-022", totalCopies:20, availableCopies:14, borrowCount:178, status:"available", coverColor:"#2563EB" },
  { id:5, isbn:"978-0-470-92765-0", title:"Organic Chemistry",
    author:"David R. Klein", category:"Chemistry",
    publisher:"Wiley", year:2021, edition:"4th Edition", pages:1344, language:"English",
    description:"Klein's Organic Chemistry offers a student-centered approach featuring more coverage of mechanisms and reactions than other texts.",
    shelfLocation:"CHE-D2-008", totalCopies:10, availableCopies:3, borrowCount:122, status:"low-stock", coverColor:"#0891B2" },
  { id:6, isbn:"978-1-119-46049-7", title:"Fundamentals of Physics",
    author:"David Halliday, Robert Resnick", category:"Physics",
    publisher:"Wiley", year:2021, edition:"11th Edition", pages:1450, language:"English",
    description:"No other book on the market today can match the 30-year success of Halliday, Resnick and Walker's Fundamentals of Physics.",
    shelfLocation:"PHY-B1-003", totalCopies:10, availableCopies:6, borrowCount:87, status:"available", coverColor:"#7C3AED" },
  { id:7, isbn:"978-0-7020-7504-4", title:"Medical Physiology",
    author:"Walter F. Boron, Emile L. Boulpaep", category:"Medicine",
    publisher:"Elsevier", year:2022, edition:"3rd Edition", pages:1272, language:"English",
    description:"The leading physiology textbook used in medical schools worldwide with a clear, consistent presentation.",
    shelfLocation:"MED-E1-019", totalCopies:6, availableCopies:0, borrowCount:64, status:"reserved", coverColor:"#DC2626" },
  { id:8, isbn:"978-0-521-63306-9", title:"A History of Western Philosophy",
    author:"Bertrand Russell", category:"Philosophy",
    publisher:"Routledge", year:2004, edition:"2nd Edition", pages:836, language:"English",
    description:"Hailed as a masterpiece, Bertrand Russell's A History of Western Philosophy is widely regarded as the most comprehensive account of philosophy.",
    shelfLocation:"PHI-F3-002", totalCopies:5, availableCopies:4, borrowCount:43, status:"available", coverColor:"#DB2777" },
  { id:9, isbn:"978-0-521-67444-4", title:"The Cambridge History of the English Language",
    author:"Richard M. Hogg", category:"Literature",
    publisher:"Cambridge University Press", year:2000, edition:"1st Edition", pages:760, language:"English",
    description:"A comprehensive and authoritative multi-volume history of the English language from Anglo-Saxon period to the present day.",
    shelfLocation:"LIT-G2-011", totalCopies:4, availableCopies:4, borrowCount:28, status:"available", coverColor:"#BE123C" },
  { id:10, isbn:"978-0-470-64818-0", title:"Quantitative Chemical Analysis",
    author:"Daniel C. Harris", category:"Chemistry",
    publisher:"Wiley", year:2020, edition:"10th Edition", pages:928, language:"English",
    description:"A premier analytical chemistry textbook providing the most modern, comprehensive, and proven coverage of quantitative analytical chemistry.",
    shelfLocation:"CHE-D1-005", totalCopies:7, availableCopies:0, borrowCount:91, status:"checked-out", coverColor:"#0D9488" },
];

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
function addDays(base: string, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/* ─────────────────────── SHARED UI ─────────────────────────── */
function BookCover({ color, title, size="sm" }: { color:string; title:string; size?:"sm"|"lg" }) {
  const dim = size==="sm" ? {w:36,h:48,fs:16} : {w:120,h:160,fs:48};
  return (
    <div className="rounded flex items-center justify-center font-extrabold text-white shrink-0"
      style={{ width:dim.w, height:dim.h,
        background:`linear-gradient(145deg,${color},${color}cc)`,
        boxShadow: size==="lg" ? `0 8px 32px ${color}55` : `0 2px 8px ${color}44`,
        fontSize:dim.fs }}>
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

function BookStatusBadge({ status }: { status: BookStatus }) {
  const M: Record<BookStatus,{bg:string;color:string;label:string}> = {
    "available":   {bg:"#ECFDF5",color:"#059669",label:"Available"},
    "low-stock":   {bg:"#FFF7ED",color:"#D97706",label:"Low Stock"},
    "checked-out": {bg:"#FEF2F2",color:"#DC2626",label:"Checked Out"},
    "reserved":    {bg:"#EFF6FF",color:"#2563EB",label:"Reserved"},
  };
  const {bg,color,label} = M[status];
  return <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap"}}>{label}</span>;
}

function BorrowBadge({ status }: { status: BorrowStatus }) {
  const M: Record<BorrowStatus,{bg:string;color:string;label:string;icon:React.ReactNode}> = {
    "borrowed":    {bg:"#F5F3FF",color:PUR,           label:"Borrowed",   icon:<BookMarked  size={10}/>},
    "returned":    {bg:"#ECFDF5",color:"#059669",      label:"Returned",   icon:<BadgeCheck  size={10}/>},
    "overdue":     {bg:"#FEF2F2",color:"#DC2626",      label:"Overdue",    icon:<AlertTriangle size={10}/>},
    "reserved":    {bg:"#EFF6FF",color:"#2563EB",      label:"Reserved",   icon:<Clock       size={10}/>},
  };
  const {bg,color,label,icon} = M[status];
  return (
    <span className="flex items-center gap-1 w-fit" style={{background:bg,color,fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:20,whiteSpace:"nowrap"}}>
      {icon}{label}
    </span>
  );
}

function DaysLeftPill({ dueDate, status }: { dueDate:string; status:BorrowStatus }) {
  if (status==="returned" || status==="reserved" || !dueDate) return null;
  const days = getDaysLeft(dueDate);
  let bg: string, color: string, label: string;
  if (days < 0)       { bg="#FEF2F2"; color="#DC2626"; label=`${Math.abs(days)}d overdue`; }
  else if (days===0)  { bg="#FFF7ED"; color="#D97706"; label="Due today"; }
  else if (days<=3)   { bg="#FFF7ED"; color="#D97706"; label=`${days}d left`; }
  else if (days<=7)   { bg="#FEFCE8"; color="#CA8A04"; label=`${days}d left`; }
  else                { bg="#F0FDF4"; color="#16A34A"; label=`${days}d left`; }
  return <span style={{background:bg,color,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:10,whiteSpace:"nowrap"}}>{label}</span>;
}

function CatBadge({ label }: { label:string }) {
  return <span style={{background:"#F5F3FF",color:PUR,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:12,whiteSpace:"nowrap"}}>{label}</span>;
}

function Avatar({ name, size=32 }: { name:string; size?:number }) {
  const i = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
    style={{width:size,height:size,background:PUR,fontSize:size*0.35}}>{i}</div>;
}

function Fld({ label, children, modified }: { label:string; children:React.ReactNode; modified?:boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label style={{fontSize:12,fontWeight:600,color:"#374151"}}>{label}</label>
        {modified && <span style={{fontSize:10,fontWeight:700,color:"#D97706",background:"#FEF3C7",padding:"1px 6px",borderRadius:10}}>Modified</span>}
      </div>
      <div style={modified?{borderLeft:`3px solid #F59E0B`,paddingLeft:8,borderRadius:4}:{}}>
        {children}
      </div>
    </div>
  );
}

const iCls = "w-full text-sm outline-none rounded-lg border border-gray-200 bg-gray-50 focus:border-purple-600 transition-colors";
const iSty: React.CSSProperties = {padding:"9px 12px",color:"#111827"};

function IconBtn({ children, color, title, onClick }: { children:React.ReactNode; color:string; title:string; onClick?:()=>void }) {
  return (
    <button title={title} onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
      style={{background:`${color}18`,color}}>{children}</button>
  );
}
function PageBtn({ children, active, disabled, onClick }: { children:React.ReactNode; active?:boolean; disabled?:boolean; onClick?:()=>void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors"
      style={{background:active?PUR:disabled?"transparent":"#F9FAFB",color:active?"#fff":disabled?"#D1D5DB":"#374151",cursor:disabled?"not-allowed":"pointer"}}>
      {children}
    </button>
  );
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
        {secHdr(<ArrowLeftRight size={15}/>, "Borrowing", borOpen, ()=>setBorOpen(!borOpen))}
        {borOpen && <>
          {subItem("Borrow Books",     active==="borrowing", ()=>onNav("borrowing"))}
          {subItem("Return Books",     false,                ()=>onNav("borrowing"))}
          {subItem("Borrowing History",false,                ()=>onNav("borrowing"))}
          {subItem("Reservations",     false,                ()=>onNav("borrowing"))}
        </>}
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

/* ─────────────────────── BOOKS PAGE ───────────────────────── */
function BooksPage({ onAdd, onEdit, onDetails }:{ onAdd:()=>void; onEdit:(b:Book)=>void; onDetails:(b:Book)=>void }) {
  const [books, setBooks]   = useState<Book[]>(SEED_BOOKS);
  const [search, setSearch] = useState("");
  const [catF,   setCat]    = useState("");
  const [stF,    setSt]     = useState("");
  const [pg,     setPg]     = useState(1);
  const PER = 8;

  const filtered = useMemo(()=>books.filter(b=>{
    const q=search.toLowerCase();
    return (!q||b.title.toLowerCase().includes(q)||b.author.toLowerCase().includes(q)||b.isbn.includes(q))
      && (!catF||b.category===catF) && (!stF||b.status===stF);
  }),[books,search,catF,stF]);

  const totalPg = Math.max(1,Math.ceil(filtered.length/PER));
  const paged   = filtered.slice((pg-1)*PER,pg*PER);

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">All Books</h1>
          <p className="text-xs text-gray-400 mt-0.5">Library Catalog › Catalog › All Books</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
            <Download size={14}/> Export
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90"
            style={{background:PUR,boxShadow:"0 4px 14px rgba(109,40,217,0.3)"}}>
            <Plus size={14}/> Add New Book
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPg(1);}}
            placeholder="Search by title, author, or ISBN…"
            className="w-full text-sm outline-none rounded-xl border border-gray-200 bg-white focus:border-purple-600"
            style={{padding:"9px 12px 9px 34px"}}/>
        </div>
        {[
          {val:catF,set:(v:string)=>{setCat(v);setPg(1);},opts:CATEGORIES,ph:"All Categories"},
          {val:stF, set:(v:string)=>{setSt(v); setPg(1);},opts:["available","low-stock","checked-out","reserved"],ph:"All Status"},
        ].map((f,i)=>(
          <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
            className="text-sm outline-none rounded-xl border border-gray-200 bg-white appearance-none"
            style={{padding:"9px 28px 9px 12px",color:f.val?"#111827":"#9CA3AF",
              backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center"}}>
            <option value="">{f.ph}</option>
            {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {(search||catF||stF)&&<button onClick={()=>{setSearch("");setCat("");setSt("");setPg(1);}}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"><X size={12}/> Clear</button>}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"1px solid rgba(0,0,0,0.05)"}}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{borderCollapse:"collapse",minWidth:900}}>
            <thead>
              <tr style={{background:"#F9FAFB",borderBottom:"1px solid #F3F4F6"}}>
                {["Cover","ISBN","Title & Author","Category","Publisher","Copies","Status","Actions"].map(h=>(
                  <th key={h} className="text-left font-semibold text-gray-500 py-3"
                    style={{fontSize:11,letterSpacing:"0.06em",padding:"12px 16px",whiteSpace:"nowrap"}}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length===0
                ? <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">No books match your search.</td></tr>
                : paged.map((b,i)=>(
                  <tr key={b.id} style={{borderBottom:"1px solid #F9FAFB",background:i%2===0?"#fff":"#FAFAFA"}}
                    className="hover:bg-purple-50 transition-colors">
                    <td style={{padding:"10px 16px"}}><BookCover color={b.coverColor} title={b.title} size="sm"/></td>
                    <td style={{padding:"10px 16px",fontFamily:"monospace",fontSize:11,color:"#6B7280",whiteSpace:"nowrap"}}>{b.isbn}</td>
                    <td style={{padding:"10px 16px",maxWidth:220}}>
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{b.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{b.author}</p>
                    </td>
                    <td style={{padding:"10px 16px"}}><CatBadge label={b.category}/></td>
                    <td style={{padding:"10px 16px",fontSize:12,color:"#6B7280",whiteSpace:"nowrap"}}>{b.publisher}</td>
                    <td style={{padding:"10px 16px",textAlign:"center"}}>
                      <p className="font-bold text-sm" style={{color:b.availableCopies===0?"#DC2626":"#111827"}}>{b.availableCopies}</p>
                      <p className="text-xs text-gray-400">/ {b.totalCopies}</p>
                    </td>
                    <td style={{padding:"10px 16px"}}><BookStatusBadge status={b.status}/></td>
                    <td style={{padding:"10px 16px"}}>
                      <div className="flex items-center gap-1">
                        <IconBtn color="#2563EB" title="View Details" onClick={()=>onDetails(b)}><Eye size={13}/></IconBtn>
                        <IconBtn color="#D97706" title="Edit Book"    onClick={()=>onEdit(b)}><Pencil size={13}/></IconBtn>
                        <IconBtn color="#DC2626" title="Delete Book"  onClick={()=>setBooks(p=>p.filter(x=>x.id!==b.id))}><Trash2 size={13}/></IconBtn>
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
            Showing <strong>{filtered.length===0?0:(pg-1)*PER+1}–{Math.min(pg*PER,filtered.length)}</strong> of <strong>{filtered.length}</strong> books
          </p>
          <div className="flex items-center gap-1">
            <PageBtn disabled={pg===1}       onClick={()=>setPg(p=>p-1)}><ChevronLeft size={14}/></PageBtn>
            {Array.from({length:totalPg},(_,i)=>i+1).map(n=>(
              <PageBtn key={n} active={n===pg} onClick={()=>setPg(n)}>{n}</PageBtn>
            ))}
            <PageBtn disabled={pg===totalPg} onClick={()=>setPg(p=>p+1)}><ChevronRight size={14}/></PageBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── BOOK FORM ─────────────────────────── */
interface BFD { isbn:string;title:string;author:string;category:string;publisher:string;year:string;edition:string;pages:string;language:string;description:string;shelfLocation:string;totalCopies:string;availableCopies:string;coverColor:string; }
const BLANK_BF: BFD = {isbn:"",title:"",author:"",category:"",publisher:"",year:"",edition:"",pages:"",language:"English",description:"",shelfLocation:"",totalCopies:"1",availableCopies:"1",coverColor:COVER_PALETTE[0]};
function toBFD(b:Book): BFD { return {isbn:b.isbn,title:b.title,author:b.author,category:b.category,publisher:b.publisher,year:String(b.year),edition:b.edition,pages:String(b.pages),language:b.language,description:b.description,shelfLocation:b.shelfLocation,totalCopies:String(b.totalCopies),availableCopies:String(b.availableCopies),coverColor:b.coverColor}; }

function BookFormPage({ mode, initial, originalBook, onBack }:{ mode:"add"|"edit"; initial:BFD; originalBook?:BFD; onBack:()=>void }) {
  const [form, setForm] = useState<BFD>(initial);
  const [saved, setSaved] = useState(false);
  const [errs, setErrs]   = useState<Partial<BFD>>({});
  const isMod = (k:keyof BFD) => mode==="edit" && !!originalBook && form[k]!==originalBook[k];
  const set   = (k:keyof BFD) => (v:string) => { setForm(p=>({...p,[k]:v})); setErrs(p=>({...p,[k]:undefined})); };
  const validate = () => { const e:Partial<BFD>={}; if(!form.isbn.trim())e.isbn="Required"; if(!form.title.trim())e.title="Required"; if(!form.author.trim())e.author="Required"; if(!form.category)e.category="Required"; if(!form.publisher.trim())e.publisher="Required"; if(!form.shelfLocation.trim())e.shelfLocation="Required"; if(!form.totalCopies||isNaN(Number(form.totalCopies)))e.totalCopies="Required"; return e; };
  const handleSave = () => { const e=validate(); if(Object.keys(e).length){setErrs(e);return;} setSaved(true); setTimeout(()=>{setSaved(false);onBack();},1200); };
  const inp = (k:keyof BFD,label:string,ph:string,opts?:{type?:string}) => (
    <Fld label={label} modified={isMod(k)}>
      <input value={form[k]} onChange={e=>set(k)(e.target.value)} type={opts?.type||"text"} placeholder={ph}
        className={iCls} style={{...iSty,borderColor:errs[k]?"#DC2626":undefined}}/>
      {errs[k]&&<p className="text-xs mt-1 flex items-center gap-1" style={{color:"#DC2626"}}><AlertCircle size={11}/>{errs[k]}</p>}
    </Fld>
  );
  const sel = (k:keyof BFD,label:string,opts:string[]) => (
    <Fld label={label} modified={isMod(k)}>
      <select value={form[k]} onChange={e=>set(k)(e.target.value)} className={`${iCls} appearance-none`} style={{...iSty,borderColor:errs[k]?"#DC2626":undefined}}>
        <option value="">Select…</option>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      {errs[k]&&<p className="text-xs mt-1 flex items-center gap-1" style={{color:"#DC2626"}}><AlertCircle size={11}/>{errs[k]}</p>}
    </Fld>
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50">
          <ArrowLeft size={15} className="text-gray-600"/>
        </button>
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">{mode==="add"?"Add New Book":"Edit Book"}</h1>
          <p className="text-xs text-gray-400">Library Catalog › Catalog › {mode==="add"?"Add New Book":"Edit Book"}</p>
        </div>
      </div>
      {saved&&<div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{background:"#ECFDF5",border:"1px solid #A7F3D0"}}><CheckCircle2 size={15} style={{color:"#059669"}}/><p className="text-sm font-medium" style={{color:"#065F46"}}>Book {mode==="add"?"added":"updated"} successfully!</p></div>}
      <div className="flex gap-5">
        <div className="shrink-0" style={{width:200}}>
          <div className="rounded-2xl p-4 flex flex-col gap-4" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <p style={{fontSize:12,fontWeight:600,color:"#374151"}}>Book Cover</p>
            <div className="flex flex-col items-center gap-3">
              <BookCover color={form.coverColor} title={form.title||"?"} size="lg"/>
              <p className="text-xs text-gray-500 text-center leading-snug">{form.title||"Book title preview"}</p>
            </div>
            <div>
              <p style={{fontSize:11,fontWeight:600,color:"#9CA3AF",marginBottom:8}}>COVER COLOR</p>
              <div className="grid gap-2" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
                {COVER_PALETTE.map(c=>(
                  <button key={c} onClick={()=>set("coverColor")(c)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    style={{background:c,border:form.coverColor===c?"2px solid #fff":"none",boxShadow:form.coverColor===c?`0 0 0 2px ${c}`:"none"}}>
                    {form.coverColor===c&&<Check size={11} color="#fff" strokeWidth={3}/>}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <p style={{fontSize:12,fontWeight:600,color:"#374151"}}>Inventory</p>
              <Fld label="Total Copies" modified={isMod("totalCopies")}><input value={form.totalCopies} onChange={e=>set("totalCopies")(e.target.value)} type="number" min="1" className={iCls} style={iSty}/></Fld>
              <Fld label="Available"    modified={isMod("availableCopies")}><input value={form.availableCopies} onChange={e=>set("availableCopies")(e.target.value)} type="number" min="0" className={iCls} style={iSty}/></Fld>
            </div>
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-5 flex flex-col gap-4" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
          <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>{inp("isbn","ISBN","e.g. 978-0-262-03384-8")}{inp("year","Publication Year","e.g. 2022")}</div>
          {inp("title","Book Title","Enter the full book title")}
          <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>{inp("author","Author(s)","Full name(s)")}{sel("publisher","Publisher",PUBLISHERS)}</div>
          <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>{sel("category","Category",CATEGORIES)}{inp("edition","Edition","e.g. 4th Edition")}</div>
          <div className="grid gap-4" style={{gridTemplateColumns:"1fr 1fr"}}>{inp("pages","Pages","e.g. 1312",{type:"number"})}{sel("language","Language",LANGUAGES)}</div>
          {inp("shelfLocation","Shelf Location","e.g. CS-A1-001")}
          <Fld label="Description" modified={isMod("description")}><textarea value={form.description} onChange={e=>set("description")(e.target.value)} rows={4} placeholder="Brief description…" className={iCls} style={{...iSty,resize:"vertical"}}/></Fld>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onBack} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{background:PUR,boxShadow:"0 4px 14px rgba(109,40,217,0.3)"}}>
              {mode==="add"?"Add Book":"Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── BOOK DETAILS ──────────────────────── */
const MOCK_BORROWERS  = [{name:"Emily Chen",id:"STU-2024-0042",due:"2026-07-20",bookId:1},{name:"James Wilson",id:"STU-2024-0087",due:"2026-07-18",bookId:1},{name:"Aisha Rahman",id:"STF-2024-0012",due:"2026-07-25",bookId:2}];
const MOCK_RESERVATIONS=[{name:"Michael Torres",id:"STU-2024-0156",reserved:"2026-07-10",bookId:1},{name:"Priya Sharma",id:"STU-2024-0203",reserved:"2026-07-11",bookId:1}];
const MOCK_HISTORY    = [{name:"Daniel Park",id:"STU-2023-0089",date:"2026-06-10",returned:"2026-06-24",bookId:1},{name:"Sophie Martin",id:"STU-2023-0134",date:"2026-05-22",returned:"2026-06-05",bookId:1},{name:"Kevin Liu",id:"STU-2024-0055",date:"2026-04-15",returned:"2026-04-29",bookId:1}];

function BookDetailsPage({ book, onBack, onEdit }:{ book:Book; onBack:()=>void; onEdit:(b:Book)=>void }) {
  const borrowers = MOCK_BORROWERS.filter(b=>b.bookId===book.id);
  const reservs   = MOCK_RESERVATIONS.filter(r=>r.bookId===book.id);
  const history   = MOCK_HISTORY.filter(h=>h.bookId===book.id);
  const related   = SEED_BOOKS.filter(b=>b.category===book.category&&b.id!==book.id).slice(0,3);

  const RCard = ({ title, count, children }:{ title:string; count:number; children:React.ReactNode }) => (
    <div className="rounded-2xl p-4" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
      <div className="flex items-center justify-between mb-3">
        <p style={{fontSize:12,fontWeight:700,color:"#374151"}}>{title}</p>
        <span style={{fontSize:11,fontWeight:700,background:"#F5F3FF",color:PUR,padding:"2px 8px",borderRadius:10}}>{count}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50"><ArrowLeft size={15} className="text-gray-600"/></button>
        <div className="flex-1">
          <h1 className="font-extrabold text-xl text-gray-900">Book Details</h1>
          <p className="text-xs text-gray-400">Library Catalog › Catalog › Book Details</p>
        </div>
        <button onClick={()=>onEdit(book)} className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90"
          style={{background:PUR,boxShadow:"0 4px 14px rgba(109,40,217,0.3)"}}><Pencil size={13}/> Edit Book</button>
      </div>
      <div className="flex gap-5 items-start">
        <div className="flex-1 flex flex-col gap-4">
          <div className="rounded-2xl p-5 flex gap-5" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <BookCover color={book.coverColor} title={book.title} size="lg"/>
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h2 className="font-extrabold text-lg text-gray-900 leading-tight flex-1">{book.title}</h2>
                <BookStatusBadge status={book.status}/>
              </div>
              <p className="text-sm text-gray-500 mb-3">{book.author}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <CatBadge label={book.category}/>
                <span style={{fontSize:11,background:"#F3F4F6",color:"#6B7280",padding:"2px 8px",borderRadius:12,fontWeight:600}}>{book.edition}</span>
              </div>
              <div className="grid gap-3" style={{gridTemplateColumns:"1fr 1fr 1fr"}}>
                {[{icon:<Hash size={13}/>,label:"ISBN",value:book.isbn,mono:true},{icon:<MapPin size={13}/>,label:"Shelf",value:book.shelfLocation},{icon:<BookOpen size={13}/>,label:"Pages",value:String(book.pages)},{icon:<Building2 size={13}/>,label:"Publisher",value:book.publisher},{icon:<Calendar size={13}/>,label:"Year",value:String(book.year)},{icon:<BookMarked size={13}/>,label:"Borrows",value:String(book.borrowCount)}].map(s=>(
                  <div key={s.label} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-gray-400">{s.icon}<span style={{fontSize:11,fontWeight:600}}>{s.label}</span></div>
                    <p style={{fontSize:12,fontWeight:600,color:"#374151",fontFamily:s.mono?"monospace":undefined}}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)"}}>
            <p style={{fontSize:12,fontWeight:700,color:"#9CA3AF",letterSpacing:"0.06em",marginBottom:10}}>DESCRIPTION</p>
            <p className="text-sm leading-relaxed text-gray-600">{book.description}</p>
          </div>
          <div className="rounded-2xl p-5 grid gap-4" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",gridTemplateColumns:"1fr 1fr 1fr"}}>
            {[{label:"Total Copies",v:book.totalCopies,c:PUR},{label:"Available",v:book.availableCopies,c:"#059669"},{label:"On Loan",v:book.totalCopies-book.availableCopies,c:"#D97706"}].map(s=>(
              <div key={s.label} className="flex flex-col items-center gap-1 py-2">
                <p className="text-2xl font-extrabold" style={{color:s.c}}>{s.v}</p>
                <p className="text-xs font-semibold text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 shrink-0" style={{width:290}}>
          <RCard title="Current Borrowers" count={borrowers.length}>
            {borrowers.length===0?<p className="text-xs text-gray-400 py-2">No active borrowers.</p>
              :borrowers.map(b=>(
                <div key={b.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <Avatar name={b.name} size={32}/>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{b.name}</p><p className="text-xs text-gray-400">{b.id}</p></div>
                  <div className="text-right"><p className="text-xs text-gray-400">Due</p><p className="text-xs font-semibold" style={{color:"#D97706"}}>{b.due}</p></div>
                </div>
              ))
            }
          </RCard>
          <RCard title="Reservations" count={reservs.length}>
            {reservs.length===0?<p className="text-xs text-gray-400 py-2">No reservations.</p>
              :reservs.map(r=>(
                <div key={r.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <Avatar name={r.name} size={30}/>
                  <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{r.name}</p><p className="text-xs text-gray-400">{r.id}</p></div>
                  <span style={{fontSize:10,fontWeight:700,background:"#EFF6FF",color:"#2563EB",padding:"2px 7px",borderRadius:10}}>Reserved</span>
                </div>
              ))
            }
          </RCard>
          <RCard title="Borrow History" count={history.length}>
            {history.map(h=>(
              <div key={h.id} className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
                <Avatar name={h.name} size={28}/>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{h.name}</p><p className="text-xs text-gray-400">{h.date} → {h.returned}</p></div>
                <span style={{fontSize:10,fontWeight:700,background:"#ECFDF5",color:"#059669",padding:"2px 7px",borderRadius:10}}>Returned</span>
              </div>
            ))}
          </RCard>
          <RCard title="Related Books" count={related.length}>
            {related.map(r=>(
              <div key={r.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                <BookCover color={r.coverColor} title={r.title} size="sm"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate leading-tight">{r.title}</p><p className="text-xs text-gray-400 truncate">{r.author.split(",")[0]}</p><BookStatusBadge status={r.status}/></div>
              </div>
            ))}
          </RCard>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── BORROWING PAGE ────────────────────────── */
function BorrowingPage({ onIssue }: { onIssue: () => void }) {
  const [records, setRecords] = useState<BorrowRecord[]>(SEED_BORROWS);
  const [tab,     setTab]     = useState<BorrowTab>("active");
  const [search,  setSearch]  = useState("");
  const [pg,      setPg]      = useState(1);
  const [toast,   setToast]   = useState<string | null>(null);
  const PER = 7;

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null),2500); };

  const stats = useMemo(()=>({
    active:   records.filter(r=>r.status==="borrowed").length,
    overdue:  records.filter(r=>r.status==="overdue").length,
    dueWeek:  records.filter(r=>r.status==="borrowed"&&getDaysLeft(r.dueDate)>=0&&getDaysLeft(r.dueDate)<=7).length,
    reserved: records.filter(r=>r.status==="reserved").length,
  }),[records]);

  const filtered = useMemo(()=>{
    const q = search.toLowerCase();
    return records.filter(r=>{
      const matchTab =
        tab==="active"       ? (r.status==="borrowed"||r.status==="overdue") :
        tab==="history"      ? r.status==="returned" :
        r.status==="reserved";
      const matchQ = !q || r.memberName.toLowerCase().includes(q) ||
        r.bookTitle.toLowerCase().includes(q) || r.memberId.toLowerCase().includes(q);
      return matchTab && matchQ;
    });
  },[records,tab,search]);

  const totalPg = Math.max(1,Math.ceil(filtered.length/PER));
  const paged   = filtered.slice((pg-1)*PER,pg*PER);

  const handleReturn = (id:number) => {
    setRecords(p=>p.map(r=>r.id===id?{...r,status:"returned",returnDate:TODAY}:r));
    showToast("Book marked as returned successfully.");
  };
  const handleRenew = (id:number) => {
    setRecords(p=>p.map(r=>r.id===id?{...r,dueDate:addDays(r.dueDate,14),status:"borrowed"}:r));
    showToast("Loan renewed for 14 additional days.");
  };

  const tabDef: {id:BorrowTab; label:string; count:number}[] = [
    {id:"active",       label:"Active Borrowings", count:stats.active+stats.overdue},
    {id:"history",      label:"Borrow History",    count:records.filter(r=>r.status==="returned").length},
    {id:"reservations", label:"Reservations",      count:stats.reserved},
  ];

  const STAT_CARDS = [
    {label:"Active Borrowings", value:stats.active,   icon:<BookMarked size={20}/>,  bg:"#EDE9FE", color:PUR,       trend:"+3 today"},
    {label:"Overdue",           value:stats.overdue,  icon:<AlertTriangle size={20}/>,bg:"#FEF2F2", color:"#DC2626", trend:"Needs attention"},
    {label:"Due This Week",     value:stats.dueWeek,  icon:<Clock size={20}/>,        bg:"#FFF7ED", color:"#D97706", trend:"Within 7 days"},
    {label:"Reservations",      value:stats.reserved, icon:<ClipboardList size={20}/>,bg:"#EFF6FF", color:"#2563EB", trend:"Awaiting pickup"},
  ];

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl"
          style={{background:"#1F2937",color:"#fff",fontSize:13,fontWeight:500,minWidth:280}}>
          <CheckCircle2 size={15} style={{color:"#10B981",flexShrink:0}}/>{toast}
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
            <Download size={14}/> Export
          </button>
          <button onClick={onIssue}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90"
            style={{background:PUR,boxShadow:"0 4px 14px rgba(109,40,217,0.3)"}}>
            <BookPlus size={14}/> Issue a Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        {STAT_CARDS.map(s=>(
          <div key={s.label} className="rounded-xl p-4 flex flex-col justify-between"
            style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",minHeight:115}}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{background:s.bg,color:s.color}}>{s.icon}</div>
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-tight" style={{color:s.color}}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-2xl flex flex-col" style={{background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.07)",border:"1px solid rgba(0,0,0,0.05)"}}>
        {/* Tab bar + search */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-gray-100">
          <div className="flex items-center gap-0">
            {tabDef.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setPg(1);}}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative"
                style={{color:tab===t.id?PUR:"#6B7280"}}>
                {t.label}
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{background:tab===t.id?PUR:"#F3F4F6",color:tab===t.id?"#fff":"#6B7280"}}>
                  {t.count}
                </span>
                {tab===t.id&&<div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{background:PUR}}/>}
              </button>
            ))}
          </div>
          <div className="relative pb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPg(1);}}
              placeholder="Search member or book…"
              className="text-sm outline-none rounded-xl border border-gray-200 bg-gray-50 focus:border-purple-600"
              style={{padding:"8px 12px 8px 30px",width:240}}/>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{borderCollapse:"collapse",minWidth:860}}>
            <thead>
              <tr style={{background:"#FAFAFA",borderBottom:"1px solid #F3F4F6"}}>
                {["Member","Book","Borrow Date", tab==="history"?"Return Date":"Due Date","Days / Status","Status","Actions"].map(h=>(
                  <th key={h} className="text-left font-semibold text-gray-400 py-3"
                    style={{fontSize:11,letterSpacing:"0.05em",padding:"12px 16px",whiteSpace:"nowrap"}}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length===0
                ? <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">No records found.</td></tr>
                : paged.map((r,i)=>{
                  const isOverdue = r.status==="overdue";
                  return (
                    <tr key={r.id}
                      style={{borderBottom:"1px solid #F9FAFB",
                        background: isOverdue ? "#FFFBFB" : i%2===0?"#fff":"#FAFAFA"}}
                      className="hover:bg-purple-50 transition-colors">
                      {/* Member */}
                      <td style={{padding:"10px 16px"}}>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.memberName} size={32}/>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 leading-tight">{r.memberName}</p>
                            <p className="text-xs text-gray-400">{r.memberId}</p>
                            <span style={{fontSize:10,fontWeight:700,
                              background:r.memberType==="staff"?"#FFF7ED":"#F5F3FF",
                              color:r.memberType==="staff"?"#D97706":PUR,
                              padding:"1px 6px",borderRadius:8}}>
                              {r.memberType}
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Book */}
                      <td style={{padding:"10px 16px"}}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-7 rounded flex items-center justify-center text-white font-bold shrink-0"
                            style={{background:r.bookCoverColor,fontSize:10}}>{r.bookTitle.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 leading-tight" style={{maxWidth:160}}>{r.bookTitle}</p>
                            <p className="text-xs text-gray-400" style={{fontFamily:"monospace"}}>{r.isbn}</p>
                          </div>
                        </div>
                      </td>
                      {/* Borrow Date */}
                      <td style={{padding:"10px 16px",fontSize:12,color:"#6B7280",whiteSpace:"nowrap"}}>{fmtDate(r.borrowDate)}</td>
                      {/* Due / Return Date */}
                      <td style={{padding:"10px 16px",fontSize:12,color:"#6B7280",whiteSpace:"nowrap"}}>
                        {tab==="history" ? fmtDate(r.returnDate||"") : fmtDate(r.dueDate)}
                      </td>
                      {/* Days Left */}
                      <td style={{padding:"10px 16px"}}>
                        <DaysLeftPill dueDate={r.dueDate} status={r.status}/>
                        {r.status==="reserved"  && <span style={{fontSize:10,fontWeight:700,background:"#EFF6FF",color:"#2563EB",padding:"2px 7px",borderRadius:10}}>Awaiting</span>}
                        {r.status==="returned"  && <span style={{fontSize:10,fontWeight:700,background:"#ECFDF5",color:"#059669",padding:"2px 7px",borderRadius:10}}>{fmtDate(r.returnDate||"")}</span>}
                      </td>
                      {/* Status */}
                      <td style={{padding:"10px 16px"}}><BorrowBadge status={r.status}/></td>
                      {/* Actions */}
                      <td style={{padding:"10px 16px"}}>
                        <div className="flex items-center gap-1">
                          {(r.status==="borrowed"||r.status==="overdue") && <>
                            <IconBtn color="#059669" title="Return Book" onClick={()=>handleReturn(r.id)}><RotateCcw size={12}/></IconBtn>
                            {r.status==="borrowed" && <IconBtn color="#D97706" title="Renew Loan" onClick={()=>handleRenew(r.id)}><RefreshCw size={12}/></IconBtn>}
                          </>}
                          {r.status==="reserved" && <IconBtn color={PUR} title="Issue Book" onClick={()=>handleReturn(r.id)}><BookPlus size={12}/></IconBtn>}
                          <IconBtn color="#6B7280" title="View Record"><Eye size={12}/></IconBtn>
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
            Showing <strong>{filtered.length===0?0:(pg-1)*PER+1}–{Math.min(pg*PER,filtered.length)}</strong> of <strong>{filtered.length}</strong> records
          </p>
          <div className="flex items-center gap-1">
            <PageBtn disabled={pg===1}       onClick={()=>setPg(p=>p-1)}><ChevronLeft size={14}/></PageBtn>
            {Array.from({length:totalPg},(_,i)=>i+1).map(n=>(
              <PageBtn key={n} active={n===pg} onClick={()=>setPg(n)}>{n}</PageBtn>
            ))}
            <PageBtn disabled={pg===totalPg} onClick={()=>setPg(p=>p+1)}><ChevronRight size={14}/></PageBtn>
          </div>
        </div>
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

  const filteredMembers = MOCK_MEMBERS.filter(m=>{
    const q=memberQ.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
  });
  const filteredBooks = SEED_BOOKS.filter(b=>b.availableCopies>0).filter(b=>{
    const q=bookQ.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.isbn.includes(q) || b.author.toLowerCase().includes(q);
  });

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

  const BookRow = ({ b }: { b: Book }) => (
    <button onClick={()=>{setBook(b);setBookQ("");setErrors(p=>({...p,book:undefined}));}}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0">
      <BookCover color={b.coverColor} title={b.title} size="sm"/>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 leading-tight truncate">{b.title}</p>
        <p className="text-xs text-gray-400 truncate">{b.author.split(",")[0]}</p>
        <p className="text-xs" style={{fontFamily:"monospace",color:"#9CA3AF"}}>{b.isbn}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold" style={{color:"#059669"}}>{b.availableCopies} avail.</p>
        <CatBadge label={b.category}/>
      </div>
    </button>
  );

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
                    : filteredBooks.map(b=><BookRow key={b.id} b={b}/>)
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
const borrowData = [{m:"Jan",b:420,r:365},{m:"Feb",b:510,r:478},{m:"Mar",b:465,r:502},{m:"Apr",b:620,r:585},{m:"May",b:575,r:532},{m:"Jun",b:690,r:641},{m:"Jul",b:718,r:680}];
const catData    = [{n:"CS",v:820},{n:"Bio",v:630},{n:"Eco",v:510},{n:"Math",v:1120},{n:"Phy",v:440},{n:"Chem",v:780},{n:"Med",v:370}];

function DashboardOverview({ onGoBooks, onGoBorrowing }:{ onGoBooks:()=>void; onGoBorrowing:()=>void }) {
  const STATS = [
    {label:"Total Books",      value:"24,856",growth:"+8.3%", up:true, icon:<BookCopy size={20}/>,       bg:"#EDE9FE",color:PUR},
    {label:"Active Borrowers", value:"4,210", growth:"+12.4%",up:true, icon:<GraduationCap size={20}/>,   bg:"#FFF7ED",color:"#D97706"},
    {label:"Books Borrowed",   value:"1,847", growth:"+5.7%", up:true, icon:<BookMarked size={20}/>,      bg:"#ECFDF5",color:"#059669"},
    {label:"Overdue Returns",  value:"124",   growth:"-3.2%", up:false,icon:<AlertCircle size={20}/>,     bg:"#FEF2F2",color:"#DC2626"},
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
        {STATS.map(s=>(
          <div key={s.label} className="rounded-xl p-4 flex flex-col justify-between" style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)",minHeight:130}}>
            <div className="flex items-start justify-between"><p className="text-xs font-medium text-gray-500">{s.label}</p><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:s.bg,color:s.color}}>{s.icon}</div></div>
            <div><p className="text-2xl font-bold text-gray-900 leading-tight">{s.value}</p><div className="flex items-center gap-1 mt-1">{s.up?<TrendingUp size={12} style={{color:"#10B981"}}/>:<TrendingDown size={12} style={{color:"#EF4444"}}/>}<span className="text-xs font-semibold" style={{color:s.up?"#10B981":"#EF4444"}}>{s.growth}</span></div></div>
          </div>
        ))}
      </div>
      <div className="grid gap-4" style={{gridTemplateColumns:"1fr 320px"}}>
        <div className="rounded-xl p-4" style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
          <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-gray-800">Borrowing Activity</p><MoreVertical size={16} className="text-gray-400"/></div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={borrowData} margin={{top:4,right:4,left:-28,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
              <XAxis dataKey="m" tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Line type="monotone" dataKey="b" name="Borrowed" stroke={PUR} strokeWidth={2.5} dot={false}/>
              <Line type="monotone" dataKey="r" name="Returned" stroke="#D1D5DB" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-4" style={{background:"#fff",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
          <p className="text-sm font-semibold text-gray-800 mb-3">By Category</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{top:4,right:4,left:-28,bottom:0}} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
              <XAxis dataKey="n" tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#9CA3AF"}} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Bar dataKey="v" name="Borrowed" fill={PUR} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── APP ROOT ─────────────────────────── */
export default function App() {
  const [user, setUser] = useState<{name:string;role:string;email:string}|null>(null);
  const [view,    setView]   = useState<View>("borrowing");
  const [selBook, setSel]    = useState<Book|null>(null);
  const [editOrig,setOrig]   = useState<BFD|null>(null);

  const handleLogin = (u: {name:string;role:string;email:string}) => {
    setUser(u);
    setView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setView("borrowing");
  };

  const goBooks    = ()              => { setSel(null); setView("books"); };
  const goAdd      = ()              => setView("add");
  const goEdit     = (b:Book)        => { setSel(b); setOrig(toBFD(b)); setView("edit"); };
  const goDetails  = (b:Book)        => { setSel(b); setView("details"); };
  const goBorrowing= ()              => setView("borrowing");
  const goIssue    = ()              => setView("issue");

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
    return <LoginPage onLogin={handleLogin}/>;
  }

  return (
    <Shell active={activeSection} onNav={goNav} user={user} onLogout={handleLogout}>
      {view==="dashboard" && <DashboardOverview onGoBooks={goBooks} onGoBorrowing={goBorrowing}/>}
      {view==="books"     && <BooksPage onAdd={goAdd} onEdit={goEdit} onDetails={goDetails}/>}
      {view==="add"       && <BookFormPage mode="add" initial={BLANK_BF} onBack={goBooks}/>}
      {view==="edit"      && selBook && editOrig && <BookFormPage mode="edit" initial={toBFD(selBook)} originalBook={editOrig} onBack={goBooks}/>}
      {view==="details"   && selBook && <BookDetailsPage book={selBook} onBack={goBooks} onEdit={goEdit}/>}
      {view==="borrowing" && <BorrowingPage onIssue={goIssue}/>}
      {view==="issue"     && <IssueBookPage onBack={goBorrowing}/>}
    </Shell>
  );
}
