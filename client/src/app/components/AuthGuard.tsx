import React, { useEffect, useState, ReactNode, Suspense, lazy } from "react";
import { fetchMe } from "../services/api";
import { BookOpen } from "lucide-react";

const PUR = "#6D28D9";

interface User {
  name: string;
  role: string;
  email: string;
}

interface AuthGuardProps {
  children: (user: User, setUser: (u: User) => void) => ReactNode;
  onLogout: () => void;
}

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

/**
 * Zero-trust authentication guard.
 * - Blocks ALL rendering until the user's role is confirmed from the server.
 * - Shows a loading spinner during token verification.
 * - On token failure, shows the login view.
 * - On success, renders children with the verified user object.
 */
export default function AuthGuard({ children, onLogout }: AuthGuardProps) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [showRegister, setShowRegister] = useState(false);

  // On mount: verify token against server
  useEffect(() => {
    const token = localStorage.getItem("unilib_token");
    if (!token) {
      setAuthState({ status: "unauthenticated" });
      return;
    }

    fetchMe()
      .then((data) => {
        const user: User = {
          name: data.user.fullName,
          role: data.user.role,
          email: data.user.email,
        };
        setAuthState({ status: "authenticated", user });
      })
      .catch(() => {
        localStorage.removeItem("unilib_token");
        setAuthState({ status: "unauthenticated" });
      });
  }, []);

  const handleLogin = (user: User) => {
    setAuthState({ status: "authenticated", user });
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("unilib_token");
    setAuthState({ status: "unauthenticated" });
    onLogout();
  };

  // ─── Loading State ───
  if (authState.status === "loading") {
    return (
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          background: "#EBEDF2",
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: "#EDE9FE" }}
        >
          <BookOpen size={28} style={{ color: PUR }} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold text-gray-700">UniLib</p>
          <p className="text-xs text-gray-400">Verifying session...</p>
        </div>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${PUR}33`, borderTopColor: PUR }} />
      </div>
    );
  }

  // ─── Unauthenticated State → Show Login/Register ───
  if (authState.status === "unauthenticated") {
    // Dynamically import to avoid circular deps
    const LoginPage = lazy(() => import("../LoginPage"));
    const RegisterPage = lazy(() => import("../RegisterPage"));

    return (
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        }
      >
        {showRegister ? (
          <RegisterPage onBackToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginPage onLogin={handleLogin} onGoToRegister={() => setShowRegister(true)} />
        )}
      </Suspense>
    );
  }

  // ─── Authenticated State ───
  return <>{children(authState.user, (u: User) => setAuthState({ status: "authenticated", user: u }))}</>;
}