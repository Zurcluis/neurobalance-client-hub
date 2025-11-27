import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Phone, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingCTAProps {
  onContactClick: () => void;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ onContactClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
      setShowScrollTop(window.scrollY > 1000);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end">
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-lg animate-fade-in"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
      
      {isExpanded && (
        <div className="bg-white rounded-2xl shadow-2xl p-4 w-64 animate-fade-in border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-semibold text-slate-900">Precisa de ajuda?</h4>
              <p className="text-sm text-slate-600">Estamos aqui para si!</p>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => {
                setIsExpanded(false);
                onContactClick();
              }}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white justify-start"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Pedir Contacto
            </Button>
            <a href="tel:+351XXXXXXXXX" className="block">
              <Button 
                variant="outline"
                className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 justify-start"
              >
                <Phone className="w-4 h-4 mr-2" />
                Ligar Agora
              </Button>
            </a>
          </div>
        </div>
      )}
      
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
          isExpanded 
            ? "bg-slate-800 hover:bg-slate-700" 
            : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 hover:scale-110"
        )}
      >
        {isExpanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  );
};

export default FloatingCTA;

