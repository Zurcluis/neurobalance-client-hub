import React from 'react';
import { 
  Brain, 
  Gamepad2, 
  TrendingUp, 
  Shield, 
  Users, 
  Sparkles,
  Zap,
  Heart
} from 'lucide-react';

const benefits = [
  {
    icon: Brain,
    title: "Treino Cerebral Avançado",
    description: "O Neurofeedback treina o cérebro a autorregular-se, melhorando padrões de atividade cerebral de forma natural.",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: Gamepad2,
    title: "Através de Jogos e Filmes",
    description: "As sessões são divertidas! O treino é feito através de jogos, música ou filmes que a criança escolhe.",
    color: "from-teal-500 to-cyan-600"
  },
  {
    icon: Shield,
    title: "100% Seguro e Natural",
    description: "Sem medicação, sem efeitos secundários. Um tratamento não invasivo e cientificamente comprovado.",
    color: "from-emerald-500 to-green-600"
  },
  {
    icon: TrendingUp,
    title: "Resultados Duradouros",
    description: "Os benefícios mantêm-se a longo prazo, pois o cérebro aprende novos padrões de funcionamento.",
    color: "from-amber-500 to-orange-600"
  },
  {
    icon: Users,
    title: "Para Todas as Idades",
    description: "Eficaz em crianças, adolescentes e adultos. Programas adaptados a cada faixa etária e necessidade.",
    color: "from-rose-500 to-pink-600"
  },
  {
    icon: Zap,
    title: "Resultados Rápidos",
    description: "A maioria dos pacientes nota melhorias entre a 5ª e 10ª sessão. Alguns já nas primeiras sessões!",
    color: "from-blue-500 to-indigo-600"
  }
];

const LandingBenefits: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,178,172,0.08),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Como Funciona
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Por que escolher o{' '}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Neurofeedback?
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Uma abordagem científica e não invasiva para treinar o cérebro a funcionar de forma mais equilibrada
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:-translate-y-2 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              
              <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${benefit.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                {benefit.title}
              </h3>
              
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-20 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative">
            <Heart className="w-12 h-12 mx-auto mb-6 animate-pulse" />
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Mais de 100 famílias já transformaram as suas vidas
            </h3>
            <p className="text-teal-100 text-lg max-w-2xl mx-auto">
              Junte-se às centenas de famílias que já descobriram o poder do Neurofeedback 
              para ajudar os seus filhos a viverem mais calmos, focados e felizes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingBenefits;

