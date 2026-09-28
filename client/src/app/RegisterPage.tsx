import { useState } from "react";
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { registerUser } from "./services/api";

const PUR = "#6D28D9";

interface RegisterPageProps {
  onBackToLogin: () => void;
}

export default function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters.";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await registerUser(fullName.trim(), email.trim().toLowerCase(), password);
      setSuccess(true);
      setTimeout(() => onBackToLogin(), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
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
            Join UniLib
          </h1>
          <p className="text-xs sm:text-sm opacity-80 mt-2 leading-relaxed">
            Create your account to access the university library system. Browse
            books, borrow resources, and track your reading history.
          </p>
          <div className="hidden md:flex flex-col gap-3 mt-8">
            <div className="flex items-center gap-2.5 opacity-85">
              <CheckCircle2 size={16} />
              <span className="text-xs sm:text-sm">Free registration for students & staff</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-85">
              <CheckCircle2 size={16} />
              <span className="text-xs sm:text-sm">Access 24,856+ books</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-85">
              <CheckCircle2 size={16} />
              <span className="text-xs sm:text-sm">Manage your borrowings online</span>
            </div>
          </div>
        </div>

        {/* Right panel - register form */}
        <div
          className="bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-center"
          style={{
            flex: "1 1 0%",
          }}
        >
          <button
            onClick={onBackToLogin}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              color: PUR,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>
            Create Account
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280", marginTop: 6, marginBottom: 24 }}>
            Register as a library member
          </p>

          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={15} style={{ color: "#059669", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#065F46", fontWeight: 500 }}>
                Registration successful! Redirecting to login...
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({...p, fullName: ""})); }}
                placeholder="John Doe"
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${fieldErrors.fullName ? "#DC2626" : "#E5E7EB"}`,
                  fontSize: 16,
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "#F9FAFB",
                }}
                onFocus={(e) => (e.target.style.borderColor = PUR)}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.fullName ? "#DC2626" : "#E5E7EB")
                }
              />
              {fieldErrors.fullName && (
                <span style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                  {fieldErrors.fullName}
                </span>
              )}
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: ""})); }}
                placeholder="you@unilib.edu"
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${fieldErrors.email ? "#DC2626" : "#E5E7EB"}`,
                  fontSize: 16,
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "#F9FAFB",
                }}
                onFocus={(e) => (e.target.style.borderColor = PUR)}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.email ? "#DC2626" : "#E5E7EB")
                }
              />
              {fieldErrors.email && (
                <span style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                  {fieldErrors.email}
                </span>
              )}
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
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: ""})); }}
                  placeholder="At least 6 characters"
                  style={{
                    padding: "11px 40px 11px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${fieldErrors.password ? "#DC2626" : "#E5E7EB"}`,
                    fontSize: 16,
                    outline: "none",
                    transition: "border-color 0.2s",
                    background: "#F9FAFB",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = PUR)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = fieldErrors.password ? "#DC2626" : "#E5E7EB")
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
              {fieldErrors.password && (
                <span style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p, confirmPassword: ""})); }}
                placeholder="Repeat your password"
                style={{
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${fieldErrors.confirmPassword ? "#DC2626" : "#E5E7EB"}`,
                  fontSize: 16,
                  outline: "none",
                  transition: "border-color 0.2s",
                  background: "#F9FAFB",
                }}
                onFocus={(e) => (e.target.style.borderColor = PUR)}
                onBlur={(e) =>
                  (e.target.style.borderColor = fieldErrors.confirmPassword ? "#DC2626" : "#E5E7EB")
                }
              />
              {fieldErrors.confirmPassword && (
                <span style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}
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
              disabled={loading || success}
              style={{
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: loading || success ? "#A78BFA" : PUR,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || success ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: loading ? "none" : `0 4px 14px ${PUR}55`,
              }}
            >
              {loading ? "Creating account…" : success ? "Redirecting…" : "Create Account"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 20 }}>
            Already have an account?{" "}
            <button
              onClick={onBackToLogin}
              style={{
                background: "none",
                border: "none",
                color: PUR,
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 12,
                padding: 0,
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}