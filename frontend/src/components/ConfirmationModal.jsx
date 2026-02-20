import { X, AlertTriangle } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger | warning | info
}) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: "text-danger border-danger/20 bg-danger/5",
    warning: "text-warning border-warning/20 bg-warning/5",
    info: "text-accent border-accent/20 bg-accent/5"
  };

  const btnConfig = {
    danger: "bg-danger text-white hover:bg-danger/90 shadow-lg shadow-danger/20",
    warning: "bg-[#f59e0b] text-white hover:bg-[#d97706] shadow-lg shadow-warning/20",
    info: "bg-white text-black hover:bg-white/90 shadow-lg"
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="card w-full max-w-sm relative z-[110] animate-fade-in shadow-2xl border-border">
        <button 
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors" 
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center p-2">
          <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-4 ${typeConfig[type]}`}>
            <AlertTriangle size={24} />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-muted mb-8 leading-relaxed">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              className="btn-ghost flex-1 h-11"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button 
              className={`flex-1 h-11 rounded-lg font-semibold text-sm transition-all active:scale-95 ${btnConfig[type]}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
