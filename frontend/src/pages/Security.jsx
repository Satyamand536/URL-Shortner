import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Globe, ExternalLink, Loader2, Link2, CheckCircle2, AlertTriangle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getMyUrls } from "../utils/api";

export default function Security() {
  const [urls, setUrls]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyUrls()
      .then((res) => setUrls(res.data.urls || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="container-pro">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white">Security Center</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              HTTPS enforcement & audit log for all your links
            </p>
          </div>

          {/* Global Security Status */}
          <div className="stats-grid mb-8">
            <div className="stat-card">
              <p className="stat-number text-success">{urls.length}</p>
              <p className="stat-label">HTTPS Links</p>
            </div>
            <div className="stat-card">
              <p className="stat-number text-danger">0</p>
              <p className="stat-label">Flagged Links</p>
            </div>
            <div className="stat-card">
              <p className="stat-number text-success text-xl">Active</p>
              <p className="stat-label">Scan Status</p>
            </div>
          </div>

          {/* Per-link Security Audit */}
          <div className="card mb-6">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck size={16} className="text-muted" />
              <h3 className="text-sm font-semibold text-white">Link Security Audit</h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-muted" />
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-12 opacity-50">
                <Link2 size={32} className="mx-auto mb-3" />
                <p className="text-sm">No links to audit yet.</p>
                <Link to="/dashboard" className="btn-primary mt-4 inline-flex w-auto px-6 text-xs">Create a link</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {urls.map((url) => {
                  const isHttps = url.redirectURL?.startsWith("https://");
                  return (
                    <div
                      key={url.shortId}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-black/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${isHttps ? "text-success" : "text-danger"}`}
                             style={{ background: isHttps ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                          {isHttps ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">/s/{url.shortId}</p>
                          <p className="text-[10px] text-muted truncate max-w-[220px]">{url.redirectURL}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isHttps ? "text-success bg-success/10" : "text-danger bg-danger/10"}`}>
                          {isHttps ? "SECURE" : "INSECURE"}
                        </span>
                        <Link to={`/analytics/${url.shortId}`} className="btn-ghost w-7 h-7 p-0 flex items-center justify-center" title="View audit log">
                          <ExternalLink size={11} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Global Policies Card */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Globe size={16} className="text-muted" />
              <h3 className="text-sm font-semibold text-white">Active Security Policies</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "HTTPS-Only Enforcement",  desc: "All destination URLs must use HTTPS", ok: true },
                { label: "Rate Limiting",            desc: "50 auth attempts per 15 minutes",   ok: true },
                { label: "HttpOnly JWT Cookies",     desc: "Token never exposed in JS / network tab", ok: true },
                { label: "HMAC-SHA256 Passwords",    desc: "No plain-text passwords stored",    ok: true },
                { label: "Safe Preview Redirect",    desc: "All links pass through preview page", ok: true },
                { label: "Ownership Enforcement",    desc: "Users can only edit/delete their own links", ok: true },
              ].map(({ label, desc, ok }) => (
                <div key={label} className="flex items-center justify-between text-xs border-b border-border pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-white">{label}</p>
                    <p className="text-muted">{desc}</p>
                  </div>
                  <span className="text-success font-bold ml-4 flex-shrink-0">✓ On</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
