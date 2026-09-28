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

type UnauthPage = "welcome" | "login" | "register";

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
  const [unauthPage, setUnauthPage] = useState<UnauthPage>("welcome");

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
    setUnauthPage("welcome");
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
    setUnauthPage("welcome");
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

  // ─── Unauthenticated State → Show Welcome/Login/Register ───
  if (authState.status === "unauthenticated") {
    // Dynamically import to avoid circular deps
    const LoginPage = lazy(() => import("../LoginPage"));
    const RegisterPage = lazy(() => import("../RegisterPage"));
    const WelcomePageModule = lazy(() =>
      import("../pages/WelcomePage").then((m) => ({ default: m.WelcomePage as React.ComponentType<any> }))
    );

    return (
      <Suspense
        fallback={
          <div className="app-shell w-full flex items-center justify-center text-gray-400 text-sm">
            Loading...
          </div>
        }
      >
        {unauthPage === "register" ? (
          <RegisterPage onBackToLogin={() => setUnauthPage("welcome")} />
        ) : unauthPage === "login" ? (
          <LoginPage
            onLogin={handleLogin}
            onGoToRegister={() => setUnauthPage("register")}
            onGoToWelcome={() => setUnauthPage("welcome")}
          />
        ) : (
          /* Welcome Page — wrapped in the same branded split layout as Login */
          <div
            className="app-screen flex items-center justify-center p-3 sm:p-6"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div
              className="flex flex-col md:flex-row rounded-2xl sm:rounded-3xl overflow-hidden w-full max-w-4xl"
              style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}
            >
              {/* Left panel – branding */}
              <div
                className="p-6 sm:p-8 md:p-12 flex flex-col justify-center text-white"
                style={{ flex: "1 1 0%", background: `linear-gradient(145deg, ${PUR}, #4C1D95)` }}
              >
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 md:mb-6"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  <BookOpen size={26} color="#fff" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold m-0 leading-tight">
                  UniLib
                </h1>
                <p className="text-xs sm:text-sm opacity-80 mt-2 leading-relaxed">
                  University Library Management System. Access the complete library
                  catalog, manage borrowings, and track resources.
                </p>
                <div className="hidden md:flex flex-col gap-3 mt-8">
                  {[
                    "24,856+ books in catalog",
                    "Real-time borrowing management",
                    "Multi-user role support",
                  ].map((text) => (
                    <div key={text} className="flex items-center gap-2.5 opacity-85">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3 4.7L6.3 11.7L2.7 8.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-xs sm:text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel – WelcomePage content */}
              <div
                className="bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-center"
                style={{ flex: "1 1 0%" }}
              >
                <WelcomePageModule
                  onNavigate={(page: "login" | "register") => setUnauthPage(page)}
                  onLogin={handleLogin}
                />
              </div>
            </div>
          </div>
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