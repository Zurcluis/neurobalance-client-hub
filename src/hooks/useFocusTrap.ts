import { useEffect, RefObject } from 'react';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

export const useFocusTrap = (
  containerRef: RefObject<HTMLElement>,
  isActive: boolean = true
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      FOCUSABLE_ELEMENTS.join(',')
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const previousActiveElement = document.activeElement as HTMLElement;
    firstElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
    };
  }, [containerRef, isActive]);
};

export const useFocusOnMount = (ref: RefObject<HTMLElement>) => {
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref]);
};

export const useReturnFocus = (shouldReturn: boolean) => {
  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement;

    return () => {
      if (shouldReturn && previousActiveElement) {
        setTimeout(() => previousActiveElement.focus(), 0);
      }
    };
  }, [shouldReturn]);
};

