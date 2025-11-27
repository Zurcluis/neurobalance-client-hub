import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Tatiana Xavier",
    content: "Eu e a minha mãe que tem 89 anos começamos a fazer Neurofeedback com Bárbara e temos notado melhorias. No meu caso, melhorei a qualidade do meu sono, agora adormeço com mais facilidade e durmo a noite toda. Antes era difícil ver uma série ou filme do início ao fim, agora já não acontece, consigo ver o filme e concentro-me melhor.",
    rating: 5,
    highlight: "Melhorei a qualidade do sono",
    avatar: "TX"
  },
  {
    name: "Dorinda Henriques",
    content: "Comecei o tratamento de neurofeedback na Neurobalance com a Bárbara, em Janeiro. Já fiz 16 sessões e sinto-me mais calma, concentrada, noto a memória a melhorar e também melhorei bastante o meu sono, já não sabia o que era dormir bem há anos.",
    rating: 5,
    highlight: "Mais calma e concentrada",
    avatar: "DH"
  },
  {
    name: "Inês Matos",
    content: "Para quem procura fortalecer a mente, aprender novas técnicas de concentração e gerir a ansiedade de forma eficaz, o Neurofeedback é uma abordagem não invasiva e indolor que pode fazer toda a diferença. Ao longo das sessões, tenho sentido melhorias significativas na minha ansiedade e na capacidade de relaxamento.",
    rating: 5,
    highlight: "Gestão da ansiedade eficaz",
    avatar: "IM"
  },
  {
    name: "Tiago Vieira",
    content: "Desde que iniciei as sessões de neurofeedback com a Bárbara, tenho notado melhorias significativas no meu dia a dia. Sinto-me mais proativo, com maior capacidade de tomar iniciativas e agir de forma mais assertiva nas minhas tarefas. A minha capacidade de concentração também melhorou consideravelmente.",
    rating: 5,
    highlight: "Mais proativo e focado",
    avatar: "TV"
  },
  {
    name: "Luis Cruz",
    content: "Devido à minha ansiedade e falta de foco, resolvi procurar ajuda na NeuroBalance. Ao fim de cerca de 30 sessões reduzi substancialmente a minha ansiedade e melhorei o meu foco, e por consequência o meu sono também melhorou. E melhor de tudo sem medicação!",
    rating: 5,
    highlight: "Sem medicação!",
    avatar: "LC"
  }
];

const LandingTestimonials: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
            Testemunhos Reais
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            O que dizem os nossos{' '}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              pacientes
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Histórias reais de transformação e recuperação através do nosso tratamento especializado
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:-translate-y-2 animate-fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 relative">
                <Quote className="absolute top-4 right-4 w-8 h-8 text-teal-100 group-hover:text-teal-200 transition-colors" />
                
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <div className="inline-block px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold rounded-full mb-4">
                  {testimonial.highlight}
                </div>
                
                <p className="text-slate-600 mb-6 leading-relaxed line-clamp-4">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                      Avaliação verificada no Google
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg border border-slate-200">
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5"
            />
            <span className="font-semibold text-slate-900">5.0</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-slate-600">baseado em 5 avaliações</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;

