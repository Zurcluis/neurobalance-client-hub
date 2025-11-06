import { toast } from 'sonner';
import { ExternalToast } from 'sonner';

interface ToastWithActionOptions extends ExternalToast {
  actionLabel?: string;
  onAction?: () => void;
}

export const toastHelpers = {
  success: (message: string, options?: ToastWithActionOptions) => {
    const { actionLabel, onAction, ...restOptions } = options || {};
    
    return toast.success(message, {
      ...restOptions,
      action: actionLabel && onAction ? {
        label: actionLabel,
        onClick: onAction
      } : undefined,
      duration: 4000,
    });
  },

  error: (message: string, options?: ToastWithActionOptions) => {
    const { actionLabel, onAction, ...restOptions } = options || {};
    
    return toast.error(message, {
      ...restOptions,
      action: actionLabel && onAction ? {
        label: actionLabel,
        onClick: onAction
      } : undefined,
      duration: 5000,
    });
  },

  info: (message: string, options?: ToastWithActionOptions) => {
    const { actionLabel, onAction, ...restOptions } = options || {};
    
    return toast.info(message, {
      ...restOptions,
      action: actionLabel && onAction ? {
        label: actionLabel,
        onClick: onAction
      } : undefined,
      duration: 4000,
    });
  },

  warning: (message: string, options?: ToastWithActionOptions) => {
    const { actionLabel, onAction, ...restOptions } = options || {};
    
    return toast.warning(message, {
      ...restOptions,
      action: actionLabel && onAction ? {
        label: actionLabel,
        onClick: onAction
      } : undefined,
      duration: 4000,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  undo: (
    message: string,
    onUndo: () => void,
    options?: ExternalToast
  ) => {
    return toast.success(message, {
      ...options,
      action: {
        label: 'Desfazer',
        onClick: onUndo
      },
      duration: 5000,
    });
  },

  loading: (message: string, options?: ExternalToast) => {
    return toast.loading(message, {
      ...options,
      duration: Infinity,
    });
  },

  dismiss: (id?: string | number) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },
};

