import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Clock, Pill, Users, MapPin, User, Hash, CreditCard, AlertCircle } from 'lucide-react';

const faqs = [
  {
    question: "Quanto tempo demora até sentir melhorias?",
    answer: "A maioria dos nossos pacientes nota resultados significativos entre a 5ª e a 10ª sessão. No entanto, algumas pessoas podem sentir melhorias já nas primeiras sessões, enquanto outras podem precisar de mais tempo. Cada caso é único e o tempo de resposta varia conforme a condição tratada e a resposta individual.",
    icon: Clock
  },
  {
    question: "Preciso de tomar medicação?",
    answer: "Não. O neurofeedback é um tratamento 100% natural que não requer medicação. Atua diretamente no cérebro através da captação da atividade cerebral de forma natural, para depois regular os padrões dessa atividade cerebral. Se já estiver a tomar medicação, recomendamos que consulte o seu médico antes de fazer alterações.",
    icon: Pill
  },
  {
    question: "Funciona com crianças ou adolescentes?",
    answer: "Sim, o neurofeedback é eficaz em crianças e adolescentes. Temos programas específicos para tratar PHDA, autismo, dificuldades de aprendizagem e problemas comportamentais. O cérebro jovem responde muito bem a este tipo de tratamento, muitas vezes com resultados mais rápidos que em adultos.",
    icon: Users
  },
  {
    question: "As sessões são presenciais?",
    answer: "Todas as sessões são realizadas presencialmente na nossa clínica. O neurofeedback requer equipamento especializado e monitorização em tempo real, que só é possível num ambiente clínico controlado. A nossa clínica está localizada na Póvoa de Lanhoso, num ambiente acolhedor e profissional para o seu conforto.",
    icon: MapPin
  },
  {
    question: "Quem me acompanha?",
    answer: "A fundadora Bárbara Mello Carvalho, licenciada em Neurofisiologia, com experiência em autismo, PHDA e saúde integrativa. A Bárbara acompanha pessoalmente cada paciente, garantindo um tratamento personalizado e de alta qualidade.",
    icon: User
  },
  {
    question: "Quantas sessões são recomendadas?",
    answer: "Normalmente recomendamos entre 20 a 30 sessões, mas o número exato varia conforme a sua condição específica e resposta ao tratamento. Após a avaliação inicial, elaboramos um plano personalizado com objetivos claros e marcos de progresso. O tratamento é sempre ajustado conforme a sua evolução.",
    icon: Hash
  },
  {
    question: "Qual o custo do tratamento?",
    answer: "O valor varia conforme o número de sessões necessárias e o plano de tratamento personalizado. Oferecemos diferentes opções de pagamento e pacotes adaptados às suas necessidades. Durante a consulta gratuita, fornecemos um orçamento detalhado e transparente.",
    icon: CreditCard
  },
  {
    question: "O tratamento tem efeitos colaterais?",
    answer: "O neurofeedback é considerado um tratamento muito seguro com efeitos colaterais mínimos. Alguns pacientes podem sentir ligeira fadiga após as primeiras sessões, mas isso é temporário e indica que o cérebro está a responder ao tratamento. Não há riscos conhecidos associados ao neurofeedback.",
    icon: AlertCircle
  }
];

const LandingFAQ: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,178,172,0.05),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">
            <HelpCircle className="w-4 h-4" />
            Perguntas Frequentes
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Tire todas as suas{' '}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              dúvidas
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Respondemos às perguntas mais comuns sobre o Neurofeedback
          </p>
        </div>
        
        {/* Grid layout: FAQ à esquerda, Imagem à direita */}
        <div className="flex flex-col lg:flex-row gap-12 items-start max-w-7xl mx-auto">
          {/* FAQ Column */}
          <div className="w-full lg:w-1/2 order-2 lg:order-1">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in px-2"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                        <faq.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-900 text-lg group-hover:text-teal-700 transition-colors">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="pl-16 text-slate-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          {/* Image Column - visível apenas em desktop */}
          <div className="hidden lg:block lg:w-1/2 order-1 lg:order-2 relative lg:sticky lg:top-24">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-teal-500/10">
              {/* Imagem principal */}
              <img 
                src="/imagens/612 NEUROBALANCE 114.jpg" 
                alt="Bárbara Mello Carvalho - Fundadora NeuroBalance"
                className="w-full h-auto max-h-[800px] object-cover object-top"
              />
              
              {/* Gradiente overlay esquerdo para suavizar transição */}
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-slate-50/95 via-slate-50/50 to-transparent" />
              
              {/* Gradiente overlay inferior */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white via-white/70 to-transparent" />
              
              {/* Gradiente overlay superior suave */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-50/60 to-transparent" />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-teal-500/15 to-cyan-500/15 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;

