import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingNavbarProps {
  onContactClick: () => void;
}

const LandingNavbar: React.FC<LandingNavbarProps> = ({ onContactClick }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: "Início", href: "#inicio" },
    { label: "Benefícios", href: "#beneficios" },
    { label: "Testemunhos", href: "#testemunhos" },
    { label: "Sobre", href: "#sobre" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-white/95 backdrop-blur-md shadow-lg py-3" 
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <a href="#inicio" className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              isScrolled 
                ? "bg-gradient-to-br from-teal-500 to-cyan-600" 
                : "bg-white/20 backdrop-blur-sm"
            )}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <span className={cn(
              "font-bold text-xl transition-colors",
              isScrolled ? "text-slate-900" : "text-slate-900"
            )}>
              NeuroBalance
            </span>
          </a>
          
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={cn(
                  "font-medium transition-colors hover:text-teal-600",
                  isScrolled ? "text-slate-700" : "text-slate-700"
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <a 
              href="tel:+351XXXXXXXXX" 
              className={cn(
                "flex items-center gap-2 font-medium transition-colors",
                isScrolled ? "text-slate-700" : "text-slate-700"
              )}
            >
              <Phone className="w-4 h-4" />
              <span>+351 XXX XXX XXX</span>
            </a>
            <Button 
              onClick={onContactClick}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 rounded-xl"
            >
              Agendar Consulta
            </Button>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-900" />
            ) : (
              <Menu className="w-6 h-6 text-slate-900" />
            )}
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 animate-fade-in">
            <div className="container mx-auto px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-slate-700 font-medium hover:text-teal-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <a 
                  href="tel:+351XXXXXXXXX" 
                  className="flex items-center gap-2 text-slate-700 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  <span>+351 XXX XXX XXX</span>
                </a>
                <Button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onContactClick();
                  }}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                >
                  Agendar Consulta Gratuita
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;

