import { ReactNode } from 'react';

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export const VisuallyHidden = ({ 
  children, 
  as: Component = 'span' 
}: VisuallyHiddenProps) => {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
};

export const srOnlyStyles = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
} as const;

