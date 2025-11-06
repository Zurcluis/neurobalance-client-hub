import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
  id: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'main-content', label: 'Ir para o conteúdo principal' },
  { id: 'navigation', label: 'Ir para a navegação' },
  { id: 'footer', label: 'Ir para o rodapé' },
];

interface SkipLinksProps {
  links?: SkipLink[];
}

export const SkipLinks = ({ links = defaultSkipLinks }: SkipLinksProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleSkipLink = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="Skip links"
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-4 focus-within:left-4 focus-within:z-[9999]"
    >
      <ul className="flex flex-col gap-2 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.id}`}
              onClick={(e) => handleSkipLink(e, link.id)}
              className="block px-4 py-2 rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export const MainContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn("focus:outline-none", className)}
      role="main"
      aria-label="Conteúdo principal"
    >
      {children}
    </main>
  );
};

