import React, { useCallback, useEffect, useRef, useState, ReactNode, Suspense, lazy } from "react";
import {
  fetchMe,
  logoutUser,
  getAuthToken,
  clearAuthToken,
  AUTH_UNAUTHORIZED_EVENT,
} from "../services/api";
import { queryClient } from "../services/queryClient";
import { BookOpen } from "lucide-react";

const PUR = "#6D28D9";

interface User {
  name: string;
  role: string;
  email: string;
}

/**
 * Ends the session: wipes the stored token + every cached API response, then
 * hands control back to the login screen. Exposed to children so any screen
 * (sidebar button, session expiry, …) can sign the user out.
 */
export type LogoutFn = (options?: { notifyServer?: boolean }) => void;

interface AuthGuardProps {
  children: (user: User, setUser: (u: User) => void, logout: LogoutFn) => ReactNode;
  /** Optional hook for the owner of <AuthGuard>; called once the session ends. */
  onLogout?: () => void;
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

  // Keep the owner callback in a ref so `logout` stays referentially stable.
  const onLogoutRef = useRef(onLogout);
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  /**
   * Sign out. Order matters: the local session is destroyed first (token +
   * cached per-user data + auth state) so the user always lands on the login
   * screen immediately, even if the API is slow, offline or already rejects
   * the token. Telling the server is a best-effort follow-up.
   */
  const logout = useCallback<LogoutFn>((options) => {
    const token = getAuthToken();

    clearAuthToken();
    queryClient.clear(); // never leak the previous session's cached data
    setShowRegister(false);
    setAuthState({ status: "unauthenticated" });
    onLogoutRef.current?.();

    if (options?.notifyServer !== false && token) {
      // Token is passed explicitly because storage has just been cleared.
      logoutUser(token).catch(() => {
        /* server unreachable or token already invalid — nothing left to do */
      });
    }
  }, []);

  // On mount: verify token against server
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthState({ status: "unauthenticated" });
      return;
    }

    let cancelled = false;

    fetchMe()
      .then((data) => {
        if (cancelled) return;
        const user: User = {
          name: data.user.fullName,
          role: data.user.role,
          email: data.user.email,
        };
        setAuthState({ status: "authenticated", user });
      })
      .catch(() => {
        if (cancelled) return;
        clearAuthToken();
        setAuthState({ status: "unauthenticated" });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Session expiry: any protected call answering 401 ends the session and
  // returns the user to the login screen. No server call needed — the token is
  // already dead.
  useEffect(() => {
    const handleUnauthorized = () => logout({ notifyServer: false });
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [logout]);

  const handleLogin = (user: User) => {
    setAuthState({ status: "authenticated", user });
    setShowRegister(false);
  };

  // ─── Loading State ───
  if (authState.status === "loading") {
    return (
      <div
        className="app-shell"
        style={{
          fontFamily: "'Inter', sans-serif",
          background: "#EBEDF2",
          width: "100%",
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
          <div className="app-shell w-full flex items-center justify-center text-gray-400 text-sm">
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
  return (
    <>
      {children(
        authState.user,
        (u: User) => setAuthState({ status: "authenticated", user: u }),
        logout
      )}
    </>
  );
}