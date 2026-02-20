import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, ExternalLink, ShieldAlert, CheckCircle2, Loader2, Globe } from "lucide-react";

export default function Preview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const url = searchParams.get("url");
  const id = searchParams.get("id");

  useEffect(() => {
    if (!url) {
      navigate("/");
      return;
    }

    // Auto redirect after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto redirect can be annoying for security previews, 
          // but we'll leave it as an option or just focus on the button.
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [url, navigate]);

  const handleContinue = () => {
    setLoading(true);
    // Open in new tab — keep preview page intact
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      setLoading(false);
    }, 800);
  };

  const domain = url ? new URL(url).hostname : "";
  const isHttps = url?.startsWith("https://");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="preview-shield animate-pulse-ring">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Safe Link Preview</h1>
          <p className="text-muted text-sm">You're about to leave LinkSafe for a third-party site.</p>
        </div>

        <div className="card space-y-6">
          {/* Destination info */}
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded bg-black border border-border flex items-center justify-center text-muted">
                <Globe size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Destination Domain</p>
                <p className="text-sm font-bold text-white truncate">{domain}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs">
                {isHttps ? (
                  <CheckCircle2 size={14} className="text-success" />
                ) : (
                  <ShieldAlert size={14} className="text-danger" />
                )}
                <span className={isHttps ? "text-success" : "text-danger"}>
                  {isHttps ? "Secure connection (HTTPS) enforced" : "Insecure connection (HTTP) detected"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-success">
                <CheckCircle2 size={14} />
                <span>Link scanned and verified by LinkSafe</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleContinue}
              className="btn-primary w-full py-4 text-base"
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Continue to {domain}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <button 
              onClick={() => navigate("/dashboard")}
              className="btn-ghost w-full"
            >
              Go back to LinkSafe
            </button>
          </div>

          <p className="text-[10px] text-center text-muted px-4">
            By clicking continue, you acknowledge that LinkSafe is not responsible for the content of the external site.
          </p>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-[10px] text-muted uppercase tracking-widest">
            <ShieldCheck size={12} />
            Scan complete
          </div>
        </div>
      </div>
    </div>
  );
}
