import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Clock, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingHeroProps {
  onContactClick: () => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({ onContactClick }) => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50" />
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 bg-teal-200 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-cyan-200 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="relative container mx-auto px-4 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-1" />
                100% Natural • Sem Medicação
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-slate-900">Ajudamos crianças com </span>
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                PHDA, autismo
              </span>
              <span className="text-slate-900"> e </span>
              <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                dificuldades de aprendizagem
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              Com o <strong className="text-teal-700">Neurofeedback</strong>, através de um jogo, música ou filme, 
              treinamos o cérebro do teu filho(a) para que ele viva{' '}
              <span className="text-teal-600 font-semibold">calmo, concentrado e feliz</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={onContactClick}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 text-lg px-8 py-6 rounded-xl group transition-all duration-300 hover:scale-105"
              >
                Agendar Consulta Gratuita
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={onContactClick}
                className="border-2 border-teal-600 text-teal-700 hover:bg-teal-50 text-lg px-8 py-6 rounded-xl"
              >
                Saber Mais
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium">Tratamento Seguro</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Resultados em 5-10 sessões</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Heart className="w-5 h-5 text-rose-600" />
                </div>
                <span className="text-sm font-medium">+100 Famílias Ajudadas</span>
              </div>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-3xl blur-2xl" />
            <img 
              src="/imagens/1.png" 
              alt="Bárbara Mello - Especialista em Neurofeedback"
              className="relative z-10 w-full max-w-lg object-contain drop-shadow-2xl animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-teal-100 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                        ★
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">5.0 Excelente</p>
                    <p className="text-sm text-slate-600">Baseado em avaliações reais</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;

