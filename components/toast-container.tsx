"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { subscribe, getToasts, removeToast, type Toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(getToasts());

  useEffect(() => {
    const unsubscribe = subscribe(setToasts);
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-2",
            toast.type === "success" && "bg-green-500/10 border-green-500/20 text-green-400",
            toast.type === "error" && "bg-red-500/10 border-red-500/20 text-red-400",
            toast.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-400"
          )}
        >
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
          {toast.type === "info" && <Info className="h-5 w-5 flex-shrink-0" />}
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

