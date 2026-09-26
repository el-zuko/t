import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners: ToastListener[] = [];

export const toast = {
  success: (message: string) => {
    const t: ToastMessage = { id: Math.random().toString(), type: "success", message };
    listeners.forEach((l) => l(t));
  },
  error: (message: string) => {
    const t: ToastMessage = { id: Math.random().toString(), type: "error", message };
    listeners.forEach((l) => l(t));
  },
  info: (message: string) => {
    const t: ToastMessage = { id: Math.random().toString(), type: "info", message };
    listeners.forEach((l) => l(t));
  },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };
    listeners.push(handleToast);
    return () => {
      const idx = listeners.indexOf(handleToast);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3 rounded-lg border shadow-xl flex items-center gap-2.5 text-xs font-mono animate-in slide-in-from-bottom-2 duration-200 ${
            t.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
              : t.type === "error"
              ? "bg-red-950/90 border-red-500/50 text-red-200"
              : "bg-slate-900/90 border-slate-700 text-slate-200"
          }`}
        >
          {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
          {t.type === "error" && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
          {t.type === "info" && <Info className="h-4 w-4 text-sky-400 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
