import React, { useState } from "react";
import { BookOpen, ArrowRight, BookMarked, GraduationCap } from "lucide-react";
import { loginUser, setAuthToken } from "../services/api";

const PUR = "#6D28D9";

interface WelcomePageProps {
  onNavigate: (page: "login" | "register") => void;
  onLogin: (user: { name: string; role: string; email: string }) => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigate, onLogin }) => {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (role: "librarian" | "member") => {
    const credentials = {
      librarian: { email: "librarian@unilib.edu", password: "Library123" },
      member:    { email: "as@unilib.edu",     password: "Library123" },
    };

    setLoadingRole(role);
    setError(null);

    try {
      const cred = credentials[role];
      const data = await loginUser(cred.email, cred.password);
      setAuthToken(data.token);
      onLogin({ name: data.user.fullName, role: data.user.role, email: data.user.email });
    } catch (e: any) {
      console.error("Demo login error:", e);
      setError("Demo login failed. Make sure the server is running and seeded.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Small top logo for small screens */}
      <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: PUR }}
        >
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">UniLib</span>
      </div>

      {/* Main content header */}
      <div className="text-center lg:text-left mb-8">
        {/* Custom Logo Icon */}
        <div className="hidden lg:flex justify-center lg:justify-start mb-6">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 0C34.1503 0 44 9.84974 44 22C44 34.1503 34.1503 44 22 44C9.84974 44 0 34.1503 0 22C0 9.84974 9.84974 0 22 0Z" fill={PUR} fillOpacity="0.08"/>
            <rect x="13" y="14" width="18" height="16" rx="2" stroke={PUR} strokeWidth="2"/>
            <path d="M22 14V30" stroke={PUR} strokeWidth="2"/>
            <path d="M13 18H22" stroke={PUR} strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M22 18H31" stroke={PUR} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#111827] mb-2">
          Library Management System
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Access the secure portal to manage books, borrowings, and library resources.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3.5 mb-8">
        <button
          onClick={() => onNavigate("login")}
          className="w-full text-white text-[13.5px] font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-2 group hover:translate-y-[-1px]"
          style={{
            background: PUR,
            boxShadow: `0 4px 14px ${PUR}55`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#5B21B6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = PUR)}
        >
          Sign In to Your Account
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => onNavigate("register")}
          className="w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[#374151] text-[13.5px] font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
        >
          Create New Account
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Quick Demo Access Divider */}
      <div className="flex items-center gap-3 my-2 mb-6">
        <div className="h-[1px] flex-1 bg-gray-100"></div>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Quick Demo Access</span>
        <div className="h-[1px] flex-1 bg-gray-100"></div>
      </div>

      {/* Demo Selector Panel */}
      <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-[10.5px] text-gray-500 font-medium text-center mb-1">
          Select a role to bypass sign-in and explore the interface:
        </p>
        
        <div className="grid grid-cols-1 gap-2.5">
          {/* Librarian Option */}
          <button
            onClick={() => handleDemoLogin("librarian")}
            disabled={loadingRole !== null}
            className="flex items-center justify-between p-2.5 bg-white border border-gray-200/60 rounded-xl hover:border-purple-500 hover:bg-purple-50/20 text-left transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#EDE9FE", color: PUR }}
              >
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  {loadingRole === "librarian" ? "Signing in…" : "Librarian"}
                </p>
                <p className="text-[9.5px] text-gray-400">Manage catalog, borrowings & returns</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-500 transition-colors" />
          </button>

          {/* Library Member Option */}
          <button
            onClick={() => handleDemoLogin("member")}
            disabled={loadingRole !== null}
            className="flex items-center justify-between p-2.5 bg-white border border-gray-200/60 rounded-xl hover:border-purple-500 hover:bg-purple-50/20 text-left transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  {loadingRole === "member" ? "Signing in…" : "Library Member"}
                </p>
                <p className="text-[9.5px] text-gray-400">Browse catalog, borrow & reserve books</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
