import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { encryptPassword } from "../utils/crypto";
import { signUp } from "../utils/api";
import { useAuth } from "../context/AuthContext";

const strengthLevels = [
  { label: "Weak", color: "#ef4444", width: "25%" },
  { label: "Fair", color: "#f59e0b", width: "50%" },
  { label: "Good", color: "#3b82f6", width: "75%" },
  { label: "Strong", color: "#22c55e", width: "100%" },
];

function getStrength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[@$!%*?&]/.test(p)) s++;
  return s - 1; // 0-3
}

const rules = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Number", test: (p) => /\d/.test(p) },
  { label: "Special char (@$!%*?&)", test: (p) => /[@$!%*?&]/.test(p) },
];

export default function SignUp() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = form.password ? getStrength(form.password) : -1;
  const sl = strength >= 0 ? strengthLevels[strength] : null;

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 3)
      e.fullName = "Name must be at least 3 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email required";
    if (!form.password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(form.password))
      e.password = "Password doesn't meet requirements";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);

    setLoading(true);
    setErrors({});
    try {
      // 🔐 Encrypt before sending
      const encryptedPassword = await encryptPassword(form.password);
      await signUp({ fullName: form.fullName.trim(), email: form.email, encryptedPassword });
      toast.success("Account created! Sign in to continue.");
      navigate("/signin");
    } catch (err) {
      const msg = err.response?.data?.error || "Sign up failed";
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("exist")) {
        setErrors({ email: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#000" }}>
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-4"
            style={{ borderColor: "#1e1e1e", background: "#0a0a0a" }}>
            <ShieldCheck size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">LinkSafe</h1>
          <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Create your secure account</p>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-white mb-1">Create account</h2>
          <p className="text-xs mb-5" style={{ color: "#6b7280" }}>
            Passwords are AES-256 encrypted end-to-end.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Full Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b7280" }} />
                <input
                  type="text"
                  className={`input pl-9 ${errors.fullName ? "error" : ""}`}
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  disabled={loading}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b7280" }} />
                <input
                  type="email"
                  className={`input pl-9 ${errors.email ? "error" : ""}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b7280" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input pl-9 pr-10 ${errors.password ? "error" : ""}`}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <>
                  <div className="strength-bar mt-2">
                    <div className="strength-bar-fill"
                      style={{ width: sl.width, background: sl.color }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: sl.color }}>{sl.label} password</p>
                </>
              )}

              {/* Rules */}
              {form.password && (
                <ul className="mt-2 space-y-1">
                  {rules.map((r) => (
                    <li key={r.label} className="flex items-center gap-1.5 text-xs"
                      style={{ color: r.test(form.password) ? "#22c55e" : "#6b7280" }}>
                      <CheckCircle2 size={11} />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}

              {errors.password && !form.password && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.password}</p>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: "1px solid #1e1e1e" }}>
            <span className="text-xs" style={{ color: "#6b7280" }}>
              Already have an account?{" "}
              <Link to="/signin" className="text-white font-medium hover:underline">
                Sign in
              </Link>
            </span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-xs" style={{ color: "#3f3f3f" }}>
            🔐 AES-256 encrypted · Token never exposed
          </span>
        </div>
      </div>
    </div>
  );
}
