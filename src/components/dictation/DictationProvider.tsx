import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDictation } from "@/hooks/useDictation";
import { DictationOverlay } from "@/components/dictation/DictationOverlay";

export interface DictationContextValue {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  startDictation: () => void;
  cancelDictation: () => void;
  pendingCommand: string | null;
  clearPendingCommand: () => void;
}

const DictationContext = createContext<DictationContextValue | null>(null);

const CALENDAR_ROUTE = "/calendar";
const UNSUPPORTED_MESSAGE = "O ditado por voz requer Chrome ou Edge.";
const DOUBLE_TAP_MS = 400;

export function useDictationContext(): DictationContextValue {
  const context = useContext(DictationContext);
  if (!context) {
    throw new Error("useDictationContext tem de ser usado dentro de DictationProvider.");
  }
  return context;
}

interface DictationProviderProps {
  children: ReactNode;
}

export function DictationProvider({ children }: DictationProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  const locationRef = useRef(location);
  locationRef.current = location;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const handleFinal = useCallback((text: string) => {
    setPendingCommand(text);
    if (!locationRef.current.pathname.startsWith(CALENDAR_ROUTE)) {
      navigateRef.current(CALENDAR_ROUTE);
    }
  }, []);

  const { isListening, transcript, isSupported, start, stop } = useDictation({
    onFinal: handleFinal,
  });

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  const startDictation = useCallback(() => {
    if (!isSupported) {
      toast.info(UNSUPPORTED_MESSAGE);
      return;
    }
    if (isListeningRef.current) {
      stop(true);
      return;
    }
    start();
  }, [isSupported, start, stop]);

  const cancelDictation = useCallback(() => {
    stop(false);
  }, [stop]);

  const clearPendingCommand = useCallback(() => {
    setPendingCommand(null);
  }, []);

  useEffect(() => {
    let lastCtrlDown = 0;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === "Control" && !event.altKey && !event.shiftKey && !event.metaKey) {
        const now = Date.now();
        if (now - lastCtrlDown <= DOUBLE_TAP_MS) {
          lastCtrlDown = 0;
          event.preventDefault();
          startDictation();
          return;
        }
        lastCtrlDown = now;
        return;
      }
      lastCtrlDown = 0;
      if (event.key === "Escape" && isListeningRef.current) {
        cancelDictation();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startDictation, cancelDictation]);

  const value = useMemo<DictationContextValue>(
    () => ({
      isListening,
      transcript,
      isSupported,
      startDictation,
      cancelDictation,
      pendingCommand,
      clearPendingCommand,
    }),
    [isListening, transcript, isSupported, startDictation, cancelDictation, pendingCommand, clearPendingCommand]
  );

  return (
    <DictationContext.Provider value={value}>
      {children}
      <DictationOverlay
        visible={isListening}
        transcript={transcript}
        onStop={() => stop(true)}
        onCancel={cancelDictation}
      />
    </DictationContext.Provider>
  );
}
