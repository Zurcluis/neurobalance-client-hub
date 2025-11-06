import { ButtonHTMLAttributes, ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  showSuccess?: boolean;
  loadingText?: string;
  successText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export const AnimatedButton = ({
  children,
  isLoading: externalLoading,
  showSuccess: externalSuccess,
  loadingText = 'Carregando...',
  successText,
  onClick,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalSuccess, setInternalSuccess] = useState(false);

  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
  const showSuccess = externalSuccess !== undefined ? externalSuccess : internalSuccess;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || isLoading || showSuccess) return;

    const result = onClick(e);

    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        setInternalSuccess(true);
        setTimeout(() => setInternalSuccess(false), 2000);
      } catch (error) {
        // Error handling será feito pelo componente pai
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading || showSuccess}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <motion.div
        initial={false}
        animate={{
          opacity: isLoading || showSuccess ? 0 : 1,
          scale: isLoading || showSuccess ? 0.8 : 1
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingText && <span>{loadingText}</span>}
        </motion.div>
      )}

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute inset-0 flex items-center justify-center bg-green-500"
        >
          <Check className="h-5 w-5 text-white mr-2" />
          {successText && <span className="text-white">{successText}</span>}
        </motion.div>
      )}
    </Button>
  );
};

export const PulseButton = ({ 
  children, 
  className,
  ...props 
}: ButtonProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button className={className} {...props}>
        {children}
      </Button>
    </motion.div>
  );
};

export const RippleButton = ({ 
  children, 
  className,
  onClick,
  ...props 
}: ButtonProps & { onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <Button
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }}
        />
      ))}
    </Button>
  );
};

