import { useCallback, useEffect, useRef, useState } from "react";

export interface UseDictationOptions {
  lang?: string;
  silenceMs?: number;
  onFinal?: (text: string) => void;
  onError?: (message: string) => void;
}

export let activeRecognitionStop: (() => void) | null = null;

const speechRecognitionSupported =
  typeof window !== "undefined" &&
  Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

function combineText(base: string, spoken: string): string {
  const trimmedBase = base.trim();
  const trimmedSpoken = spoken.trim();
  if (!trimmedBase) return trimmedSpoken;
  if (!trimmedSpoken) return trimmedBase;
  return `${trimmedBase} ${trimmedSpoken}`;
}

function describeSpeechError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permissão de microfone negada. Autorize o microfone nas definições do navegador.";
    case "audio-capture":
      return "Nenhum microfone detetado. Verifique a ligação do microfone.";
    case "network":
      return "Erro de rede durante o reconhecimento de voz. Verifique a ligação.";
    case "language-not-supported":
      return "O idioma selecionado não é suportado para reconhecimento de voz.";
    default:
      return "Erro no reconhecimento de voz. Tente novamente.";
  }
}

export function useDictation(options?: UseDictationOptions) {
  const optionsRef = useRef<UseDictationOptions>(options ?? {});
  optionsRef.current = options ?? {};

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef("");
  const spokenTextRef = useRef("");
  const pendingSubmitRef = useRef(false);
  const submittedRef = useRef(false);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const stopWrapperRef = useRef<(() => void) | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const teardownSession = useCallback(() => {
    clearSilenceTimer();
    if (stopWrapperRef.current && activeRecognitionStop === stopWrapperRef.current) {
      activeRecognitionStop = null;
    }
    stopWrapperRef.current = null;
    recognitionRef.current = null;
    isListeningRef.current = false;
    setIsListening(false);
  }, [clearSilenceTimer]);

  const finishSession = useCallback(() => {
    if (!isListeningRef.current) return;
    teardownSession();
    const submit = pendingSubmitRef.current;
    pendingSubmitRef.current = false;
    const text = combineText(baseTextRef.current, spokenTextRef.current);
    if (submit && !submittedRef.current && text) {
      submittedRef.current = true;
      optionsRef.current.onFinal?.(text);
    }
  }, [teardownSession]);

  const endSession = useCallback(
    (submit: boolean) => {
      pendingSubmitRef.current = submit;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.stop();
      } else {
        finishSession();
      }
    },
    [finishSession]
  );

  const restartSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    const silenceMs = optionsRef.current.silenceMs ?? 2500;
    silenceTimerRef.current = window.setTimeout(() => {
      silenceTimerRef.current = null;
      endSession(true);
    }, silenceMs);
  }, [clearSilenceTimer, endSession]);

  const stop = useCallback(
    (submit?: boolean) => {
      endSession(Boolean(submit));
    },
    [endSession]
  );

  const start = useCallback(
    (baseText?: string) => {
      const SpeechRecognitionCtor =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : undefined;
      if (!SpeechRecognitionCtor) {
        optionsRef.current.onError?.("O ditado por voz não é suportado neste navegador.");
        return;
      }

      if (recognitionRef.current) {
        const previous = recognitionRef.current;
        previous.onresult = () => undefined;
        previous.onerror = () => undefined;
        previous.onend = () => undefined;
        previous.stop();
        teardownSession();
      }

      if (activeRecognitionStop) {
        activeRecognitionStop();
      }

      const base = (baseText ?? "").trim();
      baseTextRef.current = base;
      spokenTextRef.current = "";
      submittedRef.current = false;
      pendingSubmitRef.current = false;
      setTranscript(base);

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = optionsRef.current.lang ?? "pt-PT";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let spoken = "";
        for (let i = 0; i < event.results.length; i += 1) {
          spoken += event.results[i][0].transcript;
        }
        spokenTextRef.current = spoken;
        setTranscript(combineText(baseTextRef.current, spoken));
        restartSilenceTimer();
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") return;
        optionsRef.current.onError?.(describeSpeechError(event.error));
        endSession(false);
      };

      recognition.onend = () => {
        finishSession();
      };

      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);

      const stopWrapper = () => endSession(false);
      stopWrapperRef.current = stopWrapper;
      activeRecognitionStop = stopWrapper;

      restartSilenceTimer();

      try {
        recognition.start();
      } catch {
        teardownSession();
      }
    },
    [endSession, finishSession, restartSilenceTimer, teardownSession]
  );

  useEffect(() => {
    return () => {
      pendingSubmitRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = () => undefined;
        recognition.onerror = () => undefined;
        recognition.onend = () => undefined;
        recognition.stop();
      }
      teardownSession();
    };
  }, [teardownSession]);

  return {
    isListening,
    transcript,
    isSupported: speechRecognitionSupported,
    start,
    stop,
  };
}
