import { Check, Mic } from "lucide-react";

interface DictationOverlayProps {
  visible: boolean;
  transcript: string;
  onStop: () => void;
  onCancel: () => void;
}

export function DictationOverlay({ visible, transcript, onStop, onCancel }: DictationOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2">
      <div
        className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 text-zinc-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
        role="status"
        aria-label="Ditado por voz"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neurobalance-teal text-white">
          <Mic className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex h-6 shrink-0 items-center gap-[3px]" aria-hidden="true">
          <span className="dictation-bar" style={{ animationDelay: "0ms" }} />
          <span className="dictation-bar" style={{ animationDelay: "150ms" }} />
          <span className="dictation-bar" style={{ animationDelay: "300ms" }} />
          <span className="dictation-bar" style={{ animationDelay: "450ms" }} />
        </div>
        <p
          className={`min-w-0 flex-1 line-clamp-2 text-sm leading-snug ${
            transcript ? "text-zinc-100" : "text-zinc-400"
          }`}
          aria-live="polite"
        >
          {transcript || "A ouvir..."}
        </p>
        <button
          type="button"
          onClick={onStop}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-neurobalance-teal px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neurobalance-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-neurobalance-teal focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Usar texto
        </button>
        <button
          type="button"
          onClick={onCancel}
          title="Cancelar ditado (Esc)"
          className="shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <kbd className="rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300">
            Esc
          </kbd>
        </button>
      </div>
    </div>
  );
}
