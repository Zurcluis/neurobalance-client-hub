import React from 'react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 py-8 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>
            NeuroBalance - Copyright @ 2024 - Todos os Direitos Reservados
          </p>
          <a
            href="https://neurobalance.pt/politica-de-privacidade/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-teal-400 transition-colors"
          >
            Política de Privacidade
          </a>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
