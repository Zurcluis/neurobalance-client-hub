import React from 'react';
import { Heart, MapPin, Phone, Mail, Clock, Facebook, Instagram, Linkedin } from 'lucide-react';

const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl">NeuroBalance</h3>
                <p className="text-sm text-slate-400">Neurofeedback Clínico</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ajudamos crianças e adultos a regularem o seu cérebro e a viverem 
              mais calmos, concentrados e felizes através do Neurofeedback.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="p-2 bg-slate-800 hover:bg-teal-600 rounded-lg transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-slate-800 hover:bg-teal-600 rounded-lg transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-slate-800 hover:bg-teal-600 rounded-lg transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Tratamentos</h4>
            <ul className="space-y-3">
              {[
                "PHDA / Défice de Atenção",
                "Autismo",
                "Ansiedade",
                "Dificuldades de Aprendizagem",
                "Problemas de Sono",
                "Falta de Concentração"
              ].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Links Úteis</h4>
            <ul className="space-y-3">
              {[
                { label: "Sobre Neurofeedback", href: "#" },
                { label: "Testemunhos", href: "#" },
                { label: "Perguntas Frequentes", href: "#" },
                { label: "Contactos", href: "#" },
                { label: "Política de Privacidade", href: "#" },
                { label: "Termos e Condições", href: "#" }
              ].map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-6">Contactos</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm">
                  Póvoa de Lanhoso<br />
                  Braga, Portugal
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <a href="tel:+351XXXXXXXXX" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                  +351 XXX XXX XXX
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-400 flex-shrink-0" />
                <a href="mailto:geral@neurobalance.pt" className="text-slate-400 hover:text-teal-400 transition-colors text-sm">
                  geral@neurobalance.pt
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm">
                  Segunda a Sexta<br />
                  9h00 - 19h00
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm text-center md:text-left">
              © {currentYear} NeuroBalance. Todos os direitos reservados.
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1">
              Feito com <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> em Portugal
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

