import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Link2, Copy, Trash2, Pencil, ExternalLink,
         Check, Plus, Loader2, ChevronDown, ChevronUp, QrCode, Download, X, BarChart as BarChartIcon } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { createUrl, getMyUrls, deleteUrl, editUrl, getQRCode } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import ConfirmationModal from "../components/ConfirmationModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ url: "", alias: "" });
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [qrModal, setQrModal] = useState(null); // { shortId, dataUrl }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // shortId of link to delete

  const load = async () => {
    try {
      const res = await getMyUrls();
      setUrls(res.data.urls || []);
    } catch {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.url) return setFormError("URL is required");
    if (!form.url.startsWith("https://")) return setFormError("Only HTTPS URLs are allowed");

    setCreating(true);
    try {
      await createUrl({ url: form.url, customAlias: form.alias || undefined });
      toast.success("Short link created!");
      setForm({ url: "", alias: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create URL");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (shortUrl) => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(shortUrl);
    toast.success("Copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleShowQr = async (shortId) => {
    try {
        const res = await getQRCode(shortId);
        setQrModal({ shortId, dataUrl: res.data.qrCode });
    } catch {
        toast.error("Failed to generate QR code");
    }
  };

  const handleDelete = (shortId) => {
    setDeleteConfirm(shortId);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUrl(deleteConfirm);
      toast.success("Link deleted successfully");
      setUrls((u) => u.filter((x) => x.shortId !== deleteConfirm));
    } catch {
      toast.error("Failed to delete link");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = async (shortId) => {
    if (!editValue.startsWith("https://"))
      return toast.error("Only HTTPS URLs allowed");
    try {
      await editUrl(shortId, editValue);
      toast.success("Updated!");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const totalClicks = urls.reduce((s, u) => s + (u.visitHistory?.length || 0), 0);
  const shortBase = `${window.location.protocol}//${window.location.host}/s/`;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="container-pro">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">LinkSafe - Url Shortener</h1>
              <p className="text-xs mt-1 font-medium" style={{ color: "#9ca3af" }}>
                  Active sessions protected by LinkSafe AES-GCM
              </p>
            </div>
            <button
              className="btn-action-orange w-auto px-6 h-11 min-h-[44px]"
              onClick={() => setShowForm((s) => !s)}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Close Manifest" : "Create Short Link"}
            </button>
          </div>

          {/* Hero Section */}
          <div className="card border-accent/20 bg-accent/5 mb-8 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-accent/20 transition-all duration-500"></div>
              <div className="relative z-10">
                  <h2 className="text-lg font-bold text-white mb-3">Empower Your Digital Presence</h2>
                  <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "#9ca3af" }}>
                      Welcome to your command center. LinkSafe isn't just a shortener—it's a security-first intelligence layer for your links. 
                      Transform long URLs into <span className="text-white font-semibold">Branded Aliases</span>, monitor real-world traffic with 
                      <span className="text-white font-semibold"> Device Breakdowns</span>, and bridge the physical-digital gap with 
                      <span className="text-white font-semibold"> Instant QR Integration</span>. Click 
                      <span className="text-accent font-bold"> "Create Short Link"</span> to manifest your first secure pathway.
                  </p>
              </div>
          </div>

          {/* Stats */}
          <div className="stats-grid mb-8">
              <div className="stat-card">
                  <p className="stat-number">{urls.length}</p>
                  <p className="stat-label">Total Links</p>
              </div>
              <div className="stat-card">
                  <p className="stat-number">{totalClicks}</p>
                  <p className="stat-label">Global Clicks</p>
              </div>
              <div className="stat-card">
                  <p className="stat-number text-success">Active</p>
                  <p className="stat-label">Realtime Scan</p>
              </div>
          </div>

          {/* Create form */}
          {showForm && (
            <div className="card mb-8 animate-fade-in">
              <h3 className="text-sm font-semibold text-white mb-4">Manifest New Short Link</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="label">Destination (HTTPS Required)</label>
                      <input
                      type="url"
                      className={`input ${formError && !form.url ? "error" : ""}`}
                      placeholder="https://example.com/..."
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      />
                  </div>
                  <div>
                      <label className="label">Custom Branding (Alias)</label>
                      <input
                      type="text"
                      className="input"
                      placeholder="my-personal-link"
                      value={form.alias}
                      onChange={(e) => setForm({ ...form, alias: e.target.value.replace(/\s+/g, "-") })}
                      />
                  </div>
                </div>
                {formError && <p className="text-xs text-danger">{formError}</p>}
                <button type="submit" className="btn-action-orange w-auto px-8" disabled={creating}>
                  {creating ? <Loader2 size={14} className="animate-spin" /> : "Generate Secure Link"}
                </button>
              </form>
            </div>
          )}

          {/* URLs list */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-muted" />
              </div>
            ) : urls.length === 0 ? (
              <div className="card text-center py-16 opacity-50">
                  <Link2 size={32} className="mx-auto mb-4" />
                  <p className="text-sm font-medium">No links manifested yet</p>
              </div>
            ) : (
              urls.map((url) => {
                const short = `${shortBase}${url.shortId}`;
                return (
                  <div key={url.shortId} className="url-row bg-surface border-border flex flex-col sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4 flex-1 min-w-0 w-full mb-3 sm:mb-0">
                          <div className="w-10 h-10 rounded border border-border flex items-center justify-center flex-shrink-0 bg-black">
                              <Link2 size={16} className="text-muted" />
                          </div>
                          <div className="min-w-0 pr-4">
                              <a href={`/preview?url=${encodeURIComponent(url.redirectURL)}&id=${url.shortId}`}
                                 className="text-sm font-bold text-white hover:text-accent flex items-center gap-1.5 truncate">
                                  {url.shortId} <ExternalLink size={12} className="opacity-30" />
                              </a>
                              <p className="text-[10px] text-muted truncate uppercase tracking-widest">{url.redirectURL}</p>
                          </div>
                      </div>

                      <div className="flex items-center gap-2 justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                          <div className="flex items-center gap-3 mr-4">
                              <div className="text-center">
                                  <p className="text-xs font-bold text-white">{url.visitHistory?.length || 0}</p>
                                  <p className="text-[9px] text-muted uppercase">Clicks</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                              <button className="btn-ghost w-9 h-9 p-0" onClick={() => handleCopy(short)}>
                                  {copied === short ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                              </button>
                              <button className="btn-ghost w-9 h-9 p-0" onClick={() => handleShowQr(url.shortId)}>
                                  <QrCode size={14} />
                              </button>
                              <Link to={`/analytics/${url.shortId}`} className="btn-ghost w-9 h-9 p-0 flex items-center justify-center">
                                  <BarChartIcon size={14} />
                              </Link>
                              <button className="btn-ghost w-9 h-9 p-0 text-danger hover:border-danger hover:bg-danger/10" onClick={() => handleDelete(url.shortId)}>
                                  <Trash2 size={14} />
                              </button>
                          </div>
                      </div>
                  </div>
                );
              })
            )}
          </div>

          {/* QR Modal */}
          {qrModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  <div className="overlay" onClick={() => setQrModal(null)} />
                  <div className="card w-full max-w-xs relative z-[70] animate-fade-in text-center">
                      <button className="absolute top-4 right-4 text-muted hover:text-white" onClick={() => setQrModal(null)}>
                          <X size={18} />
                      </button>
                      <h3 className="text-sm font-bold text-white mb-6">Link QR Code</h3>
                      <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
                          <img src={qrModal.dataUrl} alt="QR Code" className="w-40 h-40" />
                      </div>
                      <a href={qrModal.dataUrl} download={`qr-${qrModal.shortId}.png`} className="btn-primary">
                          <Download size={16} /> Download PNG
                      </a>
                  </div>
              </div>
          )}
        </div>
      </main>

      <ConfirmationModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
        title="Delete Link"
        message="Are you sure you want to permanently delete this link? This action cannot be undone and all analytics for this link will be lost."
        confirmText="Delete Link"
        type="danger"
      />
    </div>
  );
}
