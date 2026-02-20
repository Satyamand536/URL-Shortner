import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Link2, Copy, Trash2, ExternalLink, Check,
  Loader2, QrCode, Download, X, BarChart as BarChartIcon, Pencil
} from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { getMyUrls, deleteUrl, editUrl, getQRCode } from "../utils/api";
import ConfirmationModal from "../components/ConfirmationModal";

export default function Links() {
  const [urls, setUrls]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editAlias, setEditAlias] = useState("");
  const [copied, setCopied]   = useState(null);
  const [qrModal, setQrModal] = useState(null); // { shortId, dataUrl }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

    if (!editAlias.trim())
      return toast.error("Alias cannot be empty");

    try {
      await editUrl(shortId, { newUrl: editValue, newAlias: editAlias });
      toast.success("Link updated successfully!");
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const shortBase = `${window.location.protocol}//${window.location.host}/s/`;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">My Links</h1>
            <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
              All your shortened URLs — {urls.length} total
            </p>
          </div>
          <Link to="/dashboard" className="btn-primary w-auto px-6 h-10 min-h-[40px]">
            + New Link
          </Link>
        </div>

        {/* Links list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted" />
            </div>
          ) : urls.length === 0 ? (
            <div className="card text-center py-16 opacity-50">
              <Link2 size={32} className="mx-auto mb-4" />
              <p className="text-sm font-medium">No links yet</p>
              <Link to="/dashboard" className="btn-primary mt-4 inline-flex w-auto px-6 text-xs">
                Create your first link
              </Link>
            </div>
          ) : (
            urls.map((url) => {
              const short    = `${shortBase}${url.shortId}`;
              const isEditing = editingId === url.shortId;
              return (
                <div key={url.shortId} className="url-row bg-surface border-border">

                  {/* ── EDIT MODE — full-width input bar ── */}
                  {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted uppercase tracking-widest">
                          Editing Destination for: <span className="text-white font-bold">/s/{url.shortId}</span>
                        </p>
                        <span className="text-[10px] text-warning">Updates where this link redirects</span>
                      </div>
                      
                      <div>
                        <div className="flex gap-4 mb-3">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-muted mb-1 ml-1">DESTINATION URL</p>
                                <input
                                className="input w-full"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="https://example.com"
                                autoFocus
                                />
                            </div>
                            <div className="w-1/3">
                                <p className="text-[10px] font-bold text-muted mb-1 ml-1">CUSTOM ALIAS</p>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm select-none">/s/</span>
                                    <input
                                    className="input w-full pl-8"
                                    value={editAlias}
                                    onChange={(e) => setEditAlias(e.target.value)}
                                    placeholder="alias"
                                    />
                                </div>
                            </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <button className="btn-primary px-5 py-2 text-sm" onClick={() => handleEdit(url.shortId)}>
                          Save Changes
                        </button>
                        <button className="btn-ghost px-5 py-2 text-sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (

                  /* ── NORMAL MODE ── */
                  <div className="flex flex-col sm:flex-row sm:items-center w-full">
                    <div className="flex items-center gap-4 flex-1 min-w-0 mb-3 sm:mb-0">
                      <div className="w-10 h-10 rounded border border-border flex items-center justify-center flex-shrink-0 bg-black">
                        <Link2 size={16} className="text-muted" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <a
                          href={short}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-white hover:text-accent flex items-center gap-1.5 truncate"
                        >
                          {url.shortId} <ExternalLink size={12} className="opacity-30" />
                        </a>
                        <p className="text-[10px] text-muted truncate uppercase tracking-widest">{url.redirectURL}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                      <div className="flex items-center gap-3 mr-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-white">{url.visitHistory?.length || 0}</p>
                          <p className="text-[9px] text-muted uppercase">Clicks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button className="btn-ghost w-9 h-9 p-0" title="Copy" onClick={() => handleCopy(short)}>
                          {copied === short ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                        </button>
                        <button className="btn-ghost w-9 h-9 p-0" title="QR Code" onClick={() => handleShowQr(url.shortId)}>
                          <QrCode size={14} />
                        </button>
                        <Link to={`/analytics/${url.shortId}`} className="btn-ghost w-9 h-9 p-0 flex items-center justify-center" title="Analytics">
                          <BarChartIcon size={14} />
                        </Link>
                        <button
                          className="btn-ghost w-9 h-9 p-0"
                          title="Edit link"
                          onClick={() => { 
                              setEditingId(url.shortId); 
                              setEditValue(url.redirectURL);
                              setEditAlias(url.shortId);
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-ghost w-9 h-9 p-0 text-danger hover:border-danger hover:bg-danger/10"
                          title="Delete"
                          onClick={() => handleDelete(url.shortId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  )}
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
              <h3 className="text-sm font-bold text-white mb-6">QR Code — {qrModal.shortId}</h3>
              <div className="rounded-xl mb-6 mx-auto w-fit overflow-hidden border border-border">
                <img src={qrModal.dataUrl} alt="QR Code" className="w-44 h-44 block" />
              </div>
              <p className="text-[10px] text-muted mb-4">Scan to visit → tracked click ✓</p>
              <a href={qrModal.dataUrl} download={`qr-${qrModal.shortId}.png`} className="btn-primary">
                <Download size={16} /> Download PNG
              </a>
            </div>
          </div>
        )}
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
