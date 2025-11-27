import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Send, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Shield,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface LandingContactProps {
  id?: string;
}

const LandingContact: React.FC<LandingContactProps> = ({ id }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Mensagem enviada com sucesso! Entraremos em contacto em breve.');
    setFormData({ name: '', email: '', phone: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    { icon: MapPin, label: "Morada", value: "Póvoa de Lanhoso, Braga" },
    { icon: Phone, label: "Telefone", value: "+351 XXX XXX XXX" },
    { icon: Mail, label: "Email", value: "geral@neurobalance.pt" },
    { icon: Clock, label: "Horário", value: "Seg-Sex: 9h-19h" },
  ];

  return (
    <section id={id} className="py-24 bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16 animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Consulta Gratuita
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Pronto para transformar a{' '}
            <span className="text-cyan-300">vida do seu filho?</span>
          </h2>
          <p className="text-xl text-teal-100 max-w-2xl mx-auto">
            Deixe o seu contacto e entraremos em contacto para agendar uma consulta gratuita, 
            sem qualquer compromisso.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-5 gap-12 items-start max-w-6xl mx-auto">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 text-white animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <info.icon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <p className="text-sm text-teal-200">{info.label}</p>
                    <p className="font-semibold">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-cyan-300" />
                <h3 className="font-semibold text-white">Garantimos</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Primeira consulta totalmente gratuita",
                  "Sem compromisso ou obrigação",
                  "Avaliação personalizada",
                  "Resposta em até 24 horas"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-teal-100 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <Card className="lg:col-span-3 border-0 shadow-2xl bg-white/95 backdrop-blur-sm animate-fade-in">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="O seu nome"
                      required
                      className="h-12 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+351 XXX XXX XXX"
                      required
                      className="h-12 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="o-seu@email.com"
                    className="h-12 border-slate-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-700 font-medium">
                    Mensagem (opcional)
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Conte-nos brevemente a sua situação ou dúvidas..."
                    rows={4}
                    className="border-slate-200 focus:border-teal-500 focus:ring-teal-500 resize-none"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25 h-14 text-lg rounded-xl group"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      A enviar...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Quero Ser Contactado
                      <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
                
                <p className="text-xs text-center text-slate-500">
                  Ao submeter, concorda com a nossa{' '}
                  <a href="#" className="text-teal-600 hover:underline">Política de Privacidade</a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LandingContact;

