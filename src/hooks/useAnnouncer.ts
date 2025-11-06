import { useEffect, useRef, useCallback } from 'react';

type Priority = 'polite' | 'assertive';

export const useAnnouncer = () => {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!politeRef.current) {
      const politeDiv = document.createElement('div');
      politeDiv.setAttribute('role', 'status');
      politeDiv.setAttribute('aria-live', 'polite');
      politeDiv.setAttribute('aria-atomic', 'true');
      politeDiv.className = 'sr-only';
      document.body.appendChild(politeDiv);
      politeRef.current = politeDiv;
    }

    if (!assertiveRef.current) {
      const assertiveDiv = document.createElement('div');
      assertiveDiv.setAttribute('role', 'alert');
      assertiveDiv.setAttribute('aria-live', 'assertive');
      assertiveDiv.setAttribute('aria-atomic', 'true');
      assertiveDiv.className = 'sr-only';
      document.body.appendChild(assertiveDiv);
      assertiveRef.current = assertiveDiv;
    }

    return () => {
      if (politeRef.current) {
        document.body.removeChild(politeRef.current);
        politeRef.current = null;
      }
      if (assertiveRef.current) {
        document.body.removeChild(assertiveRef.current);
        assertiveRef.current = null;
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: Priority = 'polite') => {
    const ref = priority === 'assertive' ? assertiveRef : politeRef;
    if (ref.current) {
      ref.current.textContent = '';
      setTimeout(() => {
        if (ref.current) {
          ref.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return { announce };
};

