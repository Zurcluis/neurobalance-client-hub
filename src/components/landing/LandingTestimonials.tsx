import React from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

const testimonials = [
  {
    name: "Tatiana Xavier",
    content: "Eu e a minha mãe que tem 89 anos começamos a fazer Neurofeedback com Bárbara e temos notado melhorias. No meu caso, melhorei a qualidade do meu sono, agora adormeço com mais facilidade e durmo a noite toda. A minha mãe, dorme melhor, está mais focada nas conversas e a memória tem vindo a melhorar.",
    avatar: "TX"
  },
  {
    name: "Dorinda Henriques",
    content: "Comecei o tratamento de neurofeedback na Neurobalance com a Bárbara, em Janeiro. Já fiz 16 sessões e sinto-me mais calma, concentrada, noto a memória a melhorar e também melhorei bastante o meu sono, já não sabia o que era dormir bem há anos. Obrigada por tudo Bárbara. Grande profissional. 😀",
    avatar: "DH"
  },
  {
    name: "Inês Matos",
    content: "Quero agradecer à Barbara Mello por toda a sua disponibilidade, pelas explicações claras e pelo acompanhamento ao longo deste processo. Ao longo das sessões, tenho sentido melhorias significativas na minha ansiedade e na capacidade de relaxamento. Até o meu sono melhorou!",
    avatar: "IM"
  },
  {
    name: "Tiago Vieira",
    content: "Desde que iniciei as sessões de neurofeedback com a Bárbara, tenho notado melhorias significativas no meu dia a dia. Sinto-me mais proativo, com maior capacidade de tomar iniciativas. A minha capacidade de concentração também melhorou consideravelmente.",
    avatar: "TV"
  },
  {
    name: "Luis Cruz",
    content: "Devido a minha ansiedade e a falta de foco, resolvi procurar ajuda a NeuroBalance. Ao fim de cerca de 30 sessões reduzi substancialmente a minha ansiedade e melhorei o meu foco. E melhor de tudo sem medicação! Recomendo a todos!",
    avatar: "LC"
  }
];

const LandingTestimonials: React.FC = () => {
  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
            O que dizem os nossos pacientes
          </h2>
          <p className="text-slate-600">
            Histórias reais de transformação e recuperação através do nosso tratamento especializado.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex flex-col items-center gap-1 px-6 py-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <span className="text-lg font-bold text-slate-900">EXCELENTE</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#00b67a] text-[#00b67a]" />
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Com base em <strong>5 avaliações</strong>
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <a
              key={index}
              href="https://maps.app.goo.gl/JsCsGXavB5LJMssy9"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#00b67a] text-[#00b67a]" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">Google</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Trustindex verifica
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">
                {testimonial.content}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <div className="w-6 h-6 bg-[#00b67a] rounded flex items-center justify-center">
              <Star className="w-4 h-4 fill-white text-white" />
            </div>
            <span className="text-xs text-slate-500">Certificado: <strong>Trustindex</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;
