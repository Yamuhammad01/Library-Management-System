import React from "react";
import { BookMarked, BadgeCheck, AlertTriangle, Clock, ChevronDown, Eye, Pencil, Trash2, BookOpen, MapPin, Hash, Calendar, Building2, Check, AlertCircle, ArrowLeft } from "lucide-react";

/* ─────────────────────── TYPES ─────────────────────────── */
export type BookStatus    = "available" | "low-stock" | "checked-out" | "reserved";
export type BorrowStatus  = "borrowed"  | "returned"  | "overdue"     | "reserved";

export interface Book {
  _id: string; id?: number; isbn: string; title: string; author: string;
  category: string; publisher: string; year: number; edition: string;
  pages: number; language: string; description: string;
  shelfLocation: string; totalCopies: number; availableCopies: number;
  borrowCount: number; status: BookStatus; coverColor: string;
}

/* ─────────────────────── CONSTANTS ───────────────────────── */
export const PUR = "#6D28D9";
export const TODAY = "2026-07-12";

export const COVER_PALETTE = [
  "#6D28D9","#059669","#D97706","#DC2626","#2563EB",
  "#DB2777","#0891B2","#7C3AED","#BE123C","#0D9488",
];
export const CATEGORIES = [
  "Computer Science","Biology","Economics","Mathematics",
  "Physics","Chemistry","Medicine","Literature","Philosophy","History",
];
export const LANGUAGES  = ["English","French","German","Spanish","Arabic","Mandarin"];
export const PUBLISHERS = [
  "MIT Press","Oxford University Press","Cambridge University Press",
  "Wiley","Elsevier","Cengage","Springer","Pearson","Norton","Routledge",
];

/* ─────────────────────── HELPERS ─────────────────────────── */
export function addDays(base: string, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/* ─────────────────────── SHARED UI ─────────────────────────── */
export function BookCover({ color, title, size="sm" }: { color:string; title:string; size?:"sm"|"lg" }) {
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

export function BookStatusBadge({ status }: { status: BookStatus }) {
  const M: Record<BookStatus,{bg:string;color:string;label:string}> = {
    "available":   {bg:"#ECFDF5",color:"#059669",label:"Available"},
    "low-stock":   {bg:"#FFF7ED",color:"#D97706",label:"Low Stock"},
    "checked-out": {bg:"#FEF2F2",color:"#DC2626",label:"Checked Out"},
    "reserved":    {bg:"#EFF6FF",color:"#2563EB",label:"Reserved"},
  };
  const {bg,color,label} = M[status];
  return <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap"}}>{label}</span>;
}

export function BorrowBadge({ status }: { status: BorrowStatus }) {
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

export function DaysLeftPill({ dueDate, status }: { dueDate:string; status:BorrowStatus }) {
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

function getDaysLeft(dueDate: string): number {
  if (!dueDate) return 0;
  const due   = new Date(dueDate);
  const today = new Date(TODAY);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

export function CatBadge({ label }: { label:string }) {
  return <span style={{background:"#F5F3FF",color:PUR,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:12,whiteSpace:"nowrap"}}>{label}</span>;
}

export function Avatar({ name, size=32 }: { name:string; size?:number }) {
  const i = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
    style={{width:size,height:size,background:PUR,fontSize:size*0.35}}>{i}</div>;
}

export function Fld({ label, children, modified }: { label:string; children:React.ReactNode; modified?:boolean }) {
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

export const iCls = "w-full text-sm outline-none rounded-lg border border-gray-200 bg-gray-50 focus:border-purple-600 transition-colors";
export const iSty: React.CSSProperties = {padding:"9px 12px",color:"#111827"};

export function IconBtn({ children, color, title, onClick }: { children:React.ReactNode; color:string; title:string; onClick?:()=>void }) {
  return (
    <button title={title} onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-105"
      style={{background:`${color}18`,color}}>{children}</button>
  );
}

export function PageBtn({ children, active, disabled, onClick }: { children:React.ReactNode; active?:boolean; disabled?:boolean; onClick?:()=>void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors"
      style={{background:active?PUR:disabled?"transparent":"#F9FAFB",color:active?"#fff":disabled?"#D1D5DB":"#374151",cursor:disabled?"not-allowed":"pointer"}}>
      {children}
    </button>
  );
}