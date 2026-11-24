import React from 'react';
import { X, Bell, CheckCircle2, Sparkles } from 'lucide-react';

interface ToastProps {
  toast: { id: string; title: string; message: string } | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#1B332C] text-[#FAF9F6] p-4 rounded-2xl shadow-elevation border border-[#2D5A4C] flex items-start gap-3 animate-bounce-in">
      <div className="p-1.5 rounded-lg bg-[#DC653A] text-white shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-xs text-white leading-tight">{toast.title}</h5>
        <p className="text-[11px] text-[#C4DFD3] mt-0.5 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded text-[#9BC6B5] hover:text-white hover:bg-[#26483E] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

