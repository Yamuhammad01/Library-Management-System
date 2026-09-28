import { useState } from "react";
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { loginUser, setAuthToken } from "./services/api";

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
      setAuthToken(data.token);
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
      className="app-screen flex items-center justify-center p-3 sm:p-6"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="flex flex-col md:flex-row rounded-2xl sm:rounded-3xl overflow-hidden w-full max-w-4xl"
        style={{
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Left panel - branding */}
        <div
          className="p-6 sm:p-8 md:p-12 flex flex-col justify-center text-white"
          style={{
            flex: "1 1 0%",
            background: `linear-gradient(145deg, ${PUR}, #4C1D95)`,
          }}
        >
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-4 md:mb-6"
            style={{
              background: "rgba(255,255,255,0.15)",
            }}
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
            <div className="flex items-center gap-2.5 opacity-85">
              <CheckCircle2 size={16} />
              <span className="text-xs sm:text-sm">24,856+ books in catalog</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-85">
              <CheckCircle2 size={16} />
              <span className="text-xs sm:text-sm">Real-time borrowing management</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-85">
              <CheckCircle2 size={16} />
              <span className="text-xs sm:text-sm">Multi-user role support</span>
            </div>
          </div>
        </div>

        {/* Right panel - login form */}
        <div
          className="bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-center"
          style={{
            flex: "1 1 0%",
          }}
        >
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 m-0">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-6">
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
                  fontSize: 16,
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
                    fontSize: 16,
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

          
        </div>
      </div>
    </div>
  );
}