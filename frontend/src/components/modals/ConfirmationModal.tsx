import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger"
}: ConfirmationModalProps) {
  const variantColors = {
    danger: "text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-white",
    warning: "text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500 hover:text-white",
    info: "text-primary bg-primary/10 border-primary/20 hover:bg-primary hover:text-white"
  };

  const buttonColors = {
    danger: "bg-red-500 shadow-red-500/20 hover:bg-red-600",
    warning: "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600",
    info: "bg-primary shadow-primary/20 hover:bg-primary/90"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[110] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="glass-card border border-border/50 p-6 shadow-2xl w-full max-w-sm pointer-events-auto rounded-[2rem]">
              <div className="flex flex-col items-center text-center">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : variant === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                  <AlertTriangle className="h-8 w-8" />
                </div>
                
                <h2 className="heading-tight text-xl font-bold text-foreground mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground mb-8">{message}</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={onClose}
                    className="py-3.5 rounded-2xl border border-border/50 bg-secondary/30 text-xs font-black uppercase tracking-widest text-foreground hover:bg-secondary transition-all"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`py-3.5 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${buttonColors[variant]}`}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
