import React from 'react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Award, Heart, Brain, CheckCircle2 } from 'lucide-react';

const credentials = [
  { icon: GraduationCap, text: "Licenciada em Neurofisiologia" },
  { icon: Brain, text: "Especialista em Neurofeedback" },
  { icon: Heart, text: "Experiência em Autismo e PHDA" },
  { icon: Award, text: "Formação em Saúde Integrativa" },
];

const benefits = [
  "Acompanhamento personalizado",
  "Planos de tratamento adaptados",
  "Ambiente acolhedor e profissional",
  "Monitorização em tempo real",
  "Relatórios de progresso detalhados",
  "Suporte contínuo durante o tratamento"
];

const LandingAbout: React.FC = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-3xl rotate-3 scale-105" />
              <img 
                src="/imagens/3.png" 
                alt="Bárbara Mello no escritório da NeuroBalance"
                className="relative rounded-3xl shadow-2xl w-full object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-teal-100 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">+100</p>
                    <p className="text-sm text-slate-600">Famílias Ajudadas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8 order-1 lg:order-2 animate-fade-in">
            <div>
              <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 mb-4">
                Quem me acompanha
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                Conheça a{' '}
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Bárbara Mello
                </span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Fundadora da NeuroBalance, a Bárbara é uma profissional dedicada e apaixonada 
                por ajudar crianças e adultos a alcançarem o seu potencial máximo através do Neurofeedback.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {credentials.map((cred, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg text-white">
                    <cred.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{cred.text}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg">O que oferecemos:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingAbout;

