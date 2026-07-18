import { useState } from "react";
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { loginUser } from "./services/api";

const PUR = "#6D28D9";

interface LoginPageProps {
  onLogin: (user: { name: string; role: string; email: string }) => void;
  onGoToRegister: () => void;
}

export default function LoginPage({ onLogin, onGoToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email.trim().toLowerCase(), password);
      // Save token
      localStorage.setItem("unilib_token", data.token);
      onLogin({ name: data.user.fullName, role: data.user.role, email: data.user.email });
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Invalid email or password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          maxWidth: 900,
          width: "100%",
          minHeight: 520,
        }}
      >
        {/* Left panel - branding */}
        <div
          style={{
            flex: 1,
            background: `linear-gradient(145deg, ${PUR}, #4C1D95)`,
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <BookOpen size={28} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            UniLib
          </h1>
          <p style={{ fontSize: 14, opacity: 0.8, marginTop: 8, lineHeight: 1.6 }}>
            University Library Management System. Access the complete library
            catalog, manage borrowings, and track resources.
          </p>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.85 }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: 13 }}>24,856+ books in catalog</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.85 }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: 13 }}>Real-time borrowing management</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.85 }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: 13 }}>Multi-user role support</span>
            </div>
          </div>
        </div>

        {/* Right panel - login form */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6, marginBottom: 28 }}>
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="you@unilib.edu"
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${error ? "#DC2626" : "#E5E7EB"}`,
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "#F9FAFB",
                }}
                onFocus={(e) => (e.target.style.borderColor = PUR)}
                onBlur={(e) =>
                  (e.target.style.borderColor = error ? "#DC2626" : "#E5E7EB")
                }
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter your password"
                  style={{
                    padding: "11px 40px 11px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${error ? "#DC2626" : "#E5E7EB"}`,
                    fontSize: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    background: "#F9FAFB",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = PUR)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = error ? "#DC2626" : "#E5E7EB")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    padding: 4,
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                }}
              >
                <AlertCircle size={15} style={{ color: "#DC2626", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#991B1B", fontWeight: 500 }}>
                  {error}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: loading ? "#A78BFA" : PUR,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: loading ? "none" : `0 4px 14px ${PUR}55`,
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Register link */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button
              onClick={onGoToRegister}
              style={{
                background: "none",
                border: "none",
                color: PUR,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
                padding: 0,
              }}
            >
              Don't have an account? Register here
            </button>
          </div>

          {/* Quick login buttons */}
          <div style={{ marginTop: 24 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9CA3AF",
                letterSpacing: "0.06em",
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              QUICK LOGIN (DEMO)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { name: "Sarah Johnson (Librarian)", email: "librarian@unilib.edu", password: "password123" },
                { name: "Admin User (Admin)", email: "admin@unilib.edu", password: "admin123" },
              ].map((u) => (
                <button
                  key={u.email}
                  onClick={() => quickFill(u.email, u.password)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #F3F4F6",
                    background: "#FAFAFA",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: 12,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = PUR;
                    e.currentTarget.style.background = "#F5F3FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#F3F4F6";
                    e.currentTarget.style.background = "#FAFAFA";
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "#374151" }}>{u.name}</span>
                  </div>
                  <span style={{ fontSize: 10, color: PUR, fontWeight: 600 }}>
                    Fill →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}