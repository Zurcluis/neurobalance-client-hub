import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clientes',
  '/calendar': 'Calendário',
  '/finances': 'Finanças',
  '/investments': 'Investimentos',
  '/statistics': 'Estatísticas',
  '/marketing-reports': 'Marketing',
  '/admin-management': 'Administrativas',
  '/lead-compra': 'Lead Compra',
};

export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbItems: BreadcrumbItem[] = items || [
    { label: 'Dashboard', href: '/' },
    ...pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = routeLabels[to] || value.charAt(0).toUpperCase() + value.slice(1);
      return {
        label,
        href: index === pathnames.length - 1 ? undefined : to,
      };
    }),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.href || item.label} className="flex items-center">
              {index === 0 && (
                <Home className="h-4 w-4 mr-1" aria-hidden="true" />
              )}
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    to={item.href || '#'}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

