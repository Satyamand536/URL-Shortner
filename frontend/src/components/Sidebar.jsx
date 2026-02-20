import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BarChart, Link2, ShieldCheck,
  LogOut, Menu, X, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "./ConfirmationModal";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Link2,           label: "My Links",  to: "/links" },
  { icon: BarChart,        label: "Analytics", to: "/analytics" },
  { icon: ShieldCheck,     label: "Security",  to: "/security" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <>
      {/* ── Hamburger — fixed, only when sidebar closed ── */}
      {!open && (
        <button
          className="fixed top-4 left-4 z-50 lg:hidden btn-ghost"
          style={{ width: 40, height: 40, padding: 0, minHeight: 40 }}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      )}

      {/* ── Overlay (tap outside to close) ── */}
      {open && (
        <div className="overlay lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${open ? "open" : ""} lg:translate-x-0`}>

        {/* Brand row: logo left, X button right (mobile only) */}
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0"
              style={{ borderColor: "#1e1e1e", background: "#0a0a0a" }}
            >
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">LinkSafe</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>URL Intelligence</p>
            </div>
          </div>

          {/* X lives INSIDE sidebar — no overlap with brand icon */}
          <button
            className="lg:hidden btn-ghost flex-shrink-0"
            style={{ width: 36, height: 36, padding: 0, minHeight: 36 }}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              <ChevronRight size={12} style={{ opacity: 0.3 }} />
            </NavLink>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="mt-auto pt-4" style={{ borderTop: "1px solid #1e1e1e" }}>
          {user && (
            <div className="px-2 mb-3">
              <p className="text-xs font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs truncate" style={{ color: "#6b7280" }}>{user.email}</p>
            </div>
          )}
          <button
            className="sidebar-link w-full text-left"
            style={{ color: "#ef4444" }}
            onClick={() => setShowSignOut(true)}
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <ConfirmationModal 
        isOpen={showSignOut}
        onClose={() => setShowSignOut(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to end your current session? You will need to sign in again to access your links."
        confirmText="Sign Out"
        type="warning"
      />
    </>
  );
}
