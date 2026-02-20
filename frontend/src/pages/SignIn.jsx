import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { encryptPassword } from "../utils/crypto";
import { signIn } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);

    setLoading(true);
    setErrors({});
    try {
      // 🔐 Encrypt password before network transmission
      const encryptedPassword = await encryptPassword(form.password);

      const res = await signIn({ email: form.email, encryptedPassword });
      setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.fullName}!`);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.error || "Sign in failed";
      if (msg.toLowerCase().includes("password")) setErrors({ password: msg });
      else if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("account")) setErrors({ email: msg });
      else toast.error(msg);
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
          <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Secure URL Intelligence Platform</p>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-white mb-1">Sign in</h2>
          <p className="text-xs mb-5" style={{ color: "#6b7280" }}>
            Your password is encrypted before sending.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
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
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}
                  onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.password}</p>
              )}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: "1px solid #1e1e1e" }}>
            <span className="text-xs" style={{ color: "#6b7280" }}>
              No account?{" "}
              <Link to="/signup" className="text-white font-medium hover:underline">
                Create one
              </Link>
            </span>
          </div>
        </div>

        {/* Security note */}
        <div className="mt-4 text-center">
          <span className="text-xs" style={{ color: "#3f3f3f" }}>
            🔐 AES-256 encrypted · Token never exposed
          </span>
        </div>
      </div>
    </div>
  );
}
