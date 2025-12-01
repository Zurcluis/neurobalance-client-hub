import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const LandingHero: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Salvar lead no Supabase
      const { error: dbError } = await supabase
        .from('landing_leads')
        .insert([{
          nome: formData.name,
          email: formData.email,
          telefone: formData.phone,
          status: 'Novo',
          origem: 'Landing Page',
          created_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('Erro ao salvar no Supabase:', dbError);
        // Continua mesmo com erro no DB para não bloquear o utilizador
      }

      // 2. Enviar notificação por email
      const response = await fetch("https://formsubmit.co/ajax/geral.neurobalance@gmail.com", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          _subject: "Novo Contacto - NeuroBalance Landing Page",
          _template: "table"
        })
      });

      if (!response.ok) {
        throw new Error('Falha no envio');
      }

      toast.success('Pedido recebido! Entraremos em contacto brevemente.');

      // 3. Track Lead event no Facebook Pixel
      if ((window as any).fbq) {
        (window as any).fbq('track', 'Lead');
      }

      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast.error('Ocorreu um erro ao enviar o pedido. Por favor, tente novamente ou contacte-nos diretamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl" />

      {/* ==================== MOBILE/TABLET LAYOUT (até lg) ==================== */}
      <div className="lg:hidden relative w-full pt-0 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Image (mobile/tablet) */}
          <div className="relative -mx-4 sm:mx-0">
            <div className="relative w-full sm:max-w-3xl sm:mx-auto">
              <img src="/imagens/7.png" alt="NeuroBalance - Especialista em Neurofeedback" className="w-full h-auto object-contain sm:rounded-2xl" />
            </div>
          </div>

          {/* Text overlay (mobile only) */}
          <div className="sm:hidden space-y-3 -mt-24 px-4 relative z-10">
            <h1 className="text-sm font-bold leading-tight text-center">
              <span className="text-teal-700">Ajudamos</span>{' '}
              <span className="text-slate-900">crianças com</span>{' '}
              <span className="text-teal-600">PHDA, autismo, dificuldades de aprendizagem ou falta de foco</span>{' '}
              <span className="text-slate-900">a regularem o seu cérebro e a viverem mais</span>{' '}
              <span className="text-teal-600">calmas, concentradas e felizes.</span>
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed text-center">
              Com o <strong className="text-teal-700">Neurofeedback</strong>, através de um jogo, música ou filme treinamos o cérebro do teu filho(a) para que ele viva{' '}
              <strong className="text-teal-600">calmo e concentrado</strong>, sem recorrer a medicação.
            </p>
            <p className="text-xs text-slate-600 text-center">
              Deixa o teu contacto abaixo se quiseres saber como funciona o nosso serviço e tirar todas as tuas dúvidas, sem qualquer compromisso.
            </p>
          </div>

          {/* Text (tablet sm até lg) */}
          <div className="hidden sm:block lg:hidden space-y-6 mt-2">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight text-center">
              <span className="text-teal-700">Ajudamos</span>{' '}
              <span className="text-slate-900">crianças com</span>{' '}
              <span className="text-teal-600">PHDA, autismo, dificuldades de aprendizagem ou falta de foco</span>{' '}
              <span className="text-slate-900">a regularem o seu cérebro e a viverem mais</span>{' '}
              <span className="text-teal-600">calmas, concentradas e felizes.</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed text-center">
              Com o <strong className="text-teal-700">Neurofeedback</strong>, através de um jogo, música ou filme treinamos o cérebro do teu filho(a) para que ele viva{' '}
              <strong className="text-teal-600">calmo e concentrado</strong>, sem recorrer a medicação.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 text-center">
              Deixa o teu contacto abaixo se quiseres saber como funciona o nosso serviço e tirar todas as tuas dúvidas, sem qualquer compromisso.
            </p>
          </div>

          {/* Form (mobile/tablet) */}
          <div className="max-w-md mx-auto mt-4 sm:-mt-4">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="Primeiro nome" required className="h-11 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm" />
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="h-11 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm" />
                <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Contacto" required className="h-11 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-sm" />
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#F27036] hover:bg-[#e66630] text-white text-sm sm:text-base font-bold py-4 rounded-lg transition-all duration-300">
                  {isSubmitting ? 'A enviar...' : 'SIM QUERO SABER MAIS!'}
                </Button>
                <p className="text-xs sm:text-sm text-center text-slate-500 pt-2">
                  Ao clicar no botão acima, aceito as políticas de privacidade e ser contactado/a pela equipa da NeuroBalance.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP LAYOUT (lg e acima) ==================== */}
      <div className="hidden lg:flex relative w-full min-h-screen">
        {/* Left Column - Text + Form (50% width) */}
        <div className="w-1/2 flex items-center justify-center px-8 xl:px-16 py-16 relative z-20">
          <div className="max-w-xl space-y-6 xl:space-y-8">
            {/* Text (desktop) */}
            <div className="space-y-4 xl:space-y-6">
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold leading-tight text-left">
                <span className="text-teal-700">Ajudamos</span>{' '}
                <span className="text-slate-900">crianças com</span>{' '}
                <span className="text-teal-600">PHDA, autismo, dificuldades de aprendizagem ou falta de foco</span>{' '}
                <span className="text-slate-900">a regularem o seu cérebro e a viverem mais</span>{' '}
                <span className="text-teal-600">calmas, concentradas e felizes.</span>
              </h1>
              <p className="text-base xl:text-lg text-slate-700 leading-relaxed text-left">
                Com o <strong className="text-teal-700">Neurofeedback</strong>, através de um jogo, música ou filme treinamos o cérebro do teu filho(a) para que ele viva{' '}
                <strong className="text-teal-600">calmo e concentrado</strong>, sem recorrer a medicação.
              </p>
              <p className="text-sm xl:text-base text-slate-600 text-left">
                Deixa o teu contacto abaixo se quiseres saber como funciona o nosso serviço e tirar todas as tuas dúvidas, sem qualquer compromisso.
              </p>
            </div>

            {/* Form (desktop) */}
            <div className="max-w-md">
              <div className="bg-white rounded-2xl p-6 xl:p-8 shadow-xl border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Primeiro nome" required className="h-12 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-base" />
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="h-12 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-base" />
                  <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Contacto" required className="h-12 bg-slate-50 border-slate-200 focus:border-teal-500 focus:ring-teal-500 text-base" />
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-[#F27036] hover:bg-[#e66630] text-white text-base font-bold py-5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                    {isSubmitting ? 'A enviar...' : 'SIM QUERO SABER MAIS!'}
                  </Button>
                  <p className="text-center text-teal-600 font-semibold">Vagas limitadas!</p>
                  <p className="text-xs text-center text-slate-500">
                    Ao clicar no botão acima, aceito as políticas de privacidade e ser contactado/a pela equipa da NeuroBalance.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Image (50% width) */}
        <div className="w-1/2 relative z-10">
          <img 
            src="/imagens/6.png" 
            alt="NeuroBalance - Especialista em Neurofeedback" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
