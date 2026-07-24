import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
} from "../services/api";
import {
  Avatar, iCls, iSty, PUR,
} from "../components/BookUI";
import {
  User, Mail, Phone, Building2, GraduationCap, Calendar,
  Save, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Camera,
  RefreshCw, ArrowLeft,
} from "lucide-react";
import { ImageUpload } from "../components/ImageUpload";

/* ─────────────────── HELPERS ─────────────────── */
function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/* ─────────────────── PROFILE PAGE ─────────────────── */
export default function ProfilePage() {
  const queryClient = useQueryClient();

  // ── Profile query ──
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 30000,
    retry: 2,
  });

  const user = data?.user;

  // ── Form state ──
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [memberType, setMemberType] = useState<"student" | "staff">("student");

  // ── Password state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // ── Feedback state ──
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ── Populate form when data loads ──
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhoneNumber(user.phoneNumber || "");
      setDepartment(user.department || "");
      setMemberType(user.memberType || "student");
    }
  }, [user]);

  // ── Update profile mutation ──
  const updateMutation = useMutation({
    mutationFn: (profileData: Record<string, any>) => updateProfile(profileData),
    onSuccess: (res) => {
      setSuccessMsg("Profile updated successfully.");
      setErrorMsg(null);
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Update the user in App.tsx via the cached data
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors);
      }
      setErrorMsg(resp?.error || "Failed to update profile.");
      setSuccessMsg(null);
    },
  });

  // ── Upload avatar mutation ──
  const avatarMutation = useMutation({
    mutationFn: (base64: string) => uploadAvatar(base64),
    onSuccess: () => {
      setSuccessMsg("Profile picture updated successfully.");
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      setErrorMsg(resp?.error || "Failed to upload profile picture.");
      setSuccessMsg(null);
    },
  });

  // ── Change password mutation ──
  const passwordMutation = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setSuccessMsg("Password changed successfully.");
      setErrorMsg(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      if (resp?.errors) {
        setFieldErrors(resp.errors);
      }
      setErrorMsg(resp?.error || "Failed to change password.");
      setSuccessMsg(null);
    },
  });

  // ── Handlers ──
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});
    updateMutation.mutate({ fullName, email, phoneNumber, department, memberType });
  };

  const handleUploadAvatar = async (base64: string) => {
    await avatarMutation.mutateAsync(base64);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Current password is required.";
    if (!newPassword) errors.newPassword = "New password is required.";
    else if (newPassword.length < 6) errors.newPassword = "New password must be at least 6 characters.";
    if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    passwordMutation.mutate();
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="rounded-xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl p-6 flex flex-col items-center gap-3" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-red-500">Failed to load profile.</p>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-extrabold text-xl text-gray-900">My Profile</h1>
          <p className="text-xs text-gray-400 mt-0.5">Profile › Manage your account</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          <CheckCircle2 size={15} style={{ color: "#059669" }} />
          <p className="text-sm font-medium" style={{ color: "#065F46" }}>{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <AlertCircle size={15} style={{ color: "#DC2626" }} />
          <p className="text-sm font-medium" style={{ color: "#991B1B" }}>{errorMsg}</p>
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* ─── LEFT: Profile Info ─── */}
        <div className="rounded-xl p-5 flex flex-col gap-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          {/* Avatar + basic info */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-50">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Avatar name={user.fullName || ""} size={56} />
                )}
              </div>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">{user.fullName}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
              {user.memberId && <p className="text-xs text-gray-400 mt-0.5">ID: {user.memberId}</p>}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className={iCls} style={{ ...iSty, paddingLeft: 32 }} />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={email} onChange={e => setEmail(e.target.value)}
                  className={iCls} style={{ ...iSty, paddingLeft: 32, borderColor: fieldErrors.email ? "#DC2626" : undefined }} />
              </div>
              {fieldErrors.email && <p className="flex items-center gap-1 text-xs" style={{ color: "#DC2626" }}><AlertCircle size={11} />{fieldErrors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={iCls} style={{ ...iSty, paddingLeft: 32 }} />
              </div>
            </div>

            {/* Member Type - hidden for Librarian/Admin */}
            {user.role === "LibraryMember" && (
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Member Type</label>
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={memberType} onChange={e => setMemberType(e.target.value as "student" | "staff")}
                    className={iCls} style={{ ...iSty, paddingLeft: 32, appearance: "auto" }}>
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
            )}

            {/* Department - hidden for Librarian/Admin */}
            {user.role === "LibraryMember" && (
              <div className="flex flex-col gap-1.5">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Department</label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={department} onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className={iCls} style={{ ...iSty, paddingLeft: 32 }} />
                </div>
              </div>
            )}

            {/* Registration Date (read-only) */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Registration Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={fmtDate(user.createdAt)} readOnly
                  className={iCls} style={{ ...iSty, paddingLeft: 32, background: "#F9FAFB", cursor: "not-allowed" }} />
              </div>
            </div>

            {/* Save button */}
            <button type="submit" disabled={updateMutation.isPending}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: PUR, boxShadow: "0 4px 14px rgba(109,40,217,0.3)" }}>
              {updateMutation.isPending ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* ─── RIGHT: Avatar Upload + Change Password ─── */}
        <div className="flex flex-col gap-4">
          {/* Avatar Upload Card */}
          <div className="rounded-xl p-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ECFDF5", color: "#059669" }}>
                <Camera size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Profile Photo</p>
                <p className="text-[10px] text-gray-400">Upload or update your profile picture</p>
              </div>
            </div>
            <div className="pt-3">
              <ImageUpload
                currentAvatar={user.profilePicture || null}
                onUpload={handleUploadAvatar}
                saving={avatarMutation.isPending}
              />
            </div>
          </div>

          {/* Change Password Card */}
          <div className="rounded-xl p-5 flex flex-col gap-5" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                <Lock size={15} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Change Password</p>
                <p className="text-xs text-gray-400">Update your account password</p>
              </div>
            </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Current Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? "text" : "password"} value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className={iCls} style={{ ...iSty, paddingLeft: 32, borderColor: fieldErrors.currentPassword ? "#DC2626" : undefined }} />
              </div>
              {fieldErrors.currentPassword && <p className="flex items-center gap-1 text-xs" style={{ color: "#DC2626" }}><AlertCircle size={11} />{fieldErrors.currentPassword}</p>}
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? "text" : "password"} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={iCls} style={{ ...iSty, paddingLeft: 32, borderColor: fieldErrors.newPassword ? "#DC2626" : undefined }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.newPassword && <p className="flex items-center gap-1 text-xs" style={{ color: "#DC2626" }}><AlertCircle size={11} />{fieldErrors.newPassword}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Confirm New Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? "text" : "password"} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={iCls} style={{ ...iSty, paddingLeft: 32, borderColor: fieldErrors.confirmPassword ? "#DC2626" : undefined }} />
              </div>
              {fieldErrors.confirmPassword && <p className="flex items-center gap-1 text-xs" style={{ color: "#DC2626" }}><AlertCircle size={11} />{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={passwordMutation.isPending}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "#DC2626", boxShadow: "0 4px 14px rgba(220,38,38,0.3)" }}>
              {passwordMutation.isPending ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Lock size={15} />
              )}
              {passwordMutation.isPending ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}
