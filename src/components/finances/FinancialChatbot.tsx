import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const KNOWLEDGE_BASE = {
  iva: {
    keywords: ['iva', 'imposto valor acrescentado', 'liquidado', 'dedutivel', 'trimestre'],
    responses: [
      'O IVA (Imposto sobre o Valor Acrescentado) em Portugal é de **23%** para a maioria dos serviços.',
      'Funciona assim:',
      '• **IVA Liquidado** = Receitas × 23%',
      '• **IVA Dedutível** = Despesas × 23%',
      '• **IVA a Pagar** = IVA Liquidado - IVA Dedutível',
      '',
      '📅 **Declaração**: Trimestral (até dia 15 do 2º mês após o trimestre)',
      '🗓️ **Prazos**:',
      '- T1 (Jan-Mar): 15 de Maio',
      '- T2 (Abr-Jun): 15 de Agosto',
      '- T3 (Jul-Set): 15 de Novembro',
      '- T4 (Out-Dez): 15 de Fevereiro',
    ],
    suggestions: ['Como calcular IVA?', 'Prazo IVA trimestral', 'IVA dedutível']
  },
  irs: {
    keywords: ['irs', 'imposto rendimento', 'escalao', 'escalão', 'taxa', 'rendimento'],
    responses: [
      'O IRS (Imposto sobre o Rendimento) usa um sistema **progressivo por escalões**.',
      '',
      '📊 **Escalões 2024**:',
      '• Até €7.703: 14,5%',
      '• €7.703 - €11.623: 21%',
      '• €11.623 - €16.472: 26,5%',
      '• €16.472 - €21.321: 28,5%',
      '• €21.321 - €27.146: 35%',
      '• €27.146 - €39.791: 37%',
      '• €39.791 - €51.997: 43,5%',
      '• €51.997 - €81.199: 45%',
      '• Acima de €81.199: 48%',
      '',
      '💡 **Regime Simplificado**: Aplica coeficiente de 75% sobre o lucro',
      '📅 **Declaração**: Até 30 de junho do ano seguinte (Modelo 3)',
      '💰 **Pagamentos por Conta**: 3 prestações (Julho, Setembro, Dezembro)',
    ],
    suggestions: ['Escalões IRS 2024', 'Como calcular IRS?', 'Pagamentos por conta']
  },
  ss: {
    keywords: ['segurança social', 'ss', 'seg social', 'contributivo'],
    responses: [
      'A **Segurança Social** para trabalhadores independentes tem taxa de **21,4%**.',
      '',
      '💶 **Cálculo**:',
      '• Base = MAX(Receita Mensal Média, €871,58)',
      '• Contribuição Mensal = Base × 21,4%',
      '',
      '📅 **Pagamento**: Até dia **20 de cada mês**',
      '💳 **Base mínima**: €871,58 (2024)',
      '',
      '⚠️ **Importante**: A base é calculada com base nos rendimentos declarados no ano anterior.',
    ],
    suggestions: ['Taxa Segurança Social', 'Base mínima SS', 'Como pagar SS?']
  },
  prazos: {
    keywords: ['prazo', 'quando pagar', 'data limite', 'entrega', 'obrigações'],
    responses: [
      '📅 **Calendário Fiscal**:',
      '',
      '**IVA (Trimestral)**:',
      '• 1º T: 15 de Maio',
      '• 2º T: 15 de Agosto',
      '• 3º T: 15 de Novembro',
      '• 4º T: 15 de Fevereiro',
      '',
      '**Segurança Social (Mensal)**:',
      '• Dia 20 de cada mês',
      '',
      '**IRS (Anual)**:',
      '• Declaração: 30 de junho',
      '• 1ª Prestação: 31 de julho',
      '• 2ª Prestação: 30 de setembro',
      '• 3ª Prestação: 31 de dezembro',
    ],
    suggestions: ['Prazo IVA', 'Prazo IRS', 'Prazo SS']
  },
  calculo: {
    keywords: ['como calcular', 'calcular', 'formula', 'fórmula', 'conta'],
    responses: [
      '🧮 **Fórmulas Principais**:',
      '',
      '**IVA**:',
      '```',
      'IVA a Pagar = (Receitas × 23%) - (Despesas × 23%)',
      '```',
      '',
      '**IRS**:',
      '```',
      'Lucro = Receitas - Despesas',
      'Rendimento Tributável = Lucro × 75%',
      'IRS = Rendimento × Taxa do Escalão - Dedução',
      '```',
      '',
      '**Segurança Social**:',
      '```',
      'Base = MAX(Receita Mensal Média, €871,58)',
      'SS Mensal = Base × 21,4%',
      '```',
      '',
      '💡 Use a **Calculadora Fiscal** na aba ao lado para cálculos automáticos!',
    ],
    suggestions: ['Usar calculadora', 'Exemplo de cálculo']
  },
  despesas: {
    keywords: ['despesa', 'dedução', 'deduzir', 'deduções', 'custos'],
    responses: [
      '💰 **Despesas Dedutíveis**:',
      '',
      'Pode deduzir despesas relacionadas com a atividade:',
      '• Material de escritório',
      '• Equipamento médico/terapêutico',
      '• Formação profissional',
      '• Deslocações',
      '• Rendas e utilidades',
      '• Seguros',
      '• Contabilidade',
      '',
      '⚠️ **Importante**: Guarde sempre as faturas e justificativos!',
      '📋 Despesas devem estar em nome do profissional/empresa',
    ],
    suggestions: ['Despesas dedutíveis', 'Como guardar faturas?']
  },
  regime: {
    keywords: ['regime', 'simplificado', 'contabilidade organizada', 'tipo regime'],
    responses: [
      '📊 **Regimes Fiscais**:',
      '',
      '**Regime Simplificado**:',
      '• Coeficiente: 75% sobre o lucro',
      '• Mais simples',
      '• Ideal para início de atividade',
      '• Limite: €200.000/ano',
      '',
      '**Contabilidade Organizada**:',
      '• Coeficiente: 35% (ou despesas reais)',
      '• Mais complexo',
      '• Requer contabilista',
      '• Sem limite de faturação',
      '',
      '💡 **Dica**: Até €200k/ano, simplificado é geralmente vantajoso',
    ],
    suggestions: ['Qual regime escolher?', 'Vantagens simplificado']
  },
  contabilista: {
    keywords: ['contabilista', 'toc', 'contador', 'ajuda profissional'],
    responses: [
      '👨‍💼 **Quando Contratar um Contabilista?**',
      '',
      '✅ **Recomendado se**:',
      '• Faturação > €50.000/ano',
      '• Muitas despesas a gerir',
      '• Dúvidas sobre regime fiscal',
      '• Quer otimizar impostos',
      '• Pouco tempo para burocracia',
      '',
      '💰 **Custo médio**: €50-150/mês',
      '',
      '🎯 **Vantagens**:',
      '• Garante conformidade fiscal',
      '• Otimiza carga tributária',
      '• Poupa tempo',
      '• Evita multas',
    ],
    suggestions: ['Quanto custa contabilista?', 'Como escolher contabilista?']
  },
  atualizacoes: {
    keywords: ['atualização', 'atualizado', 'mudanças', 'novidade', '2024', '2025'],
    responses: [
      '📢 **Atualizações Fiscais 2024**:',
      '',
      '🆕 **IRS**:',
      '• Escalões atualizados',
      '• Mínimo de existência: €10.640',
      '',
      '🆕 **Segurança Social**:',
      '• Base mínima: €871,58',
      '• Taxa mantém-se: 21,4%',
      '',
      '🆕 **IVA**:',
      '• Taxa normal: 23% (mantém-se)',
      '• Faturação eletrónica obrigatória',
      '',
      '⚠️ **Importante**: Consulte o Portal das Finanças para atualizações mais recentes.',
    ],
    suggestions: ['Portal das Finanças', 'Onde ver atualizações?']
  },
  exemplo: {
    keywords: ['exemplo', 'prático', 'simulação', 'caso'],
    responses: [
      '💡 **Exemplo Prático**:',
      '',
      '**Situação**: Clínica com receita de €40.000/ano e despesas de €12.000/ano',
      '',
      '**IVA (anual)**:',
      '• Liquidado: €40.000 × 23% = €9.200',
      '• Dedutível: €12.000 × 23% = €2.760',
      '• **A Pagar: €6.440** (€1.610 por trimestre)',
      '',
      '**IRS**:',
      '• Lucro: €28.000',
      '• Tributável (75%): €21.000',
      '• **IRS: ~€4.515**',
      '',
      '**Segurança Social**:',
      '• Base: €3.333/mês',
      '• **SS: ~€8.560/ano** (€713/mês)',
      '',
      '📊 **Total Impostos**: ~€19.515',
      '💰 **Lucro Líquido**: ~€8.485',
    ],
    suggestions: ['Usar calculadora', 'Outro exemplo']
  },
  documentacao: {
    keywords: ['documento', 'documentação', 'fatura', 'recibo', 'guardar', 'organizar', 'arquivo', 'papel', 'digital'],
    responses: [
      '📋 **Documentação Contabilística Essencial**:',
      '',
      '**RECEITAS** (obrigatório guardar):',
      '• ✅ Faturas emitidas (numeradas sequencialmente)',
      '• ✅ Recibos de pagamento',
      '• ✅ Extratos bancários (receitas)',
      '• ✅ Livro de receitas atualizado',
      '',
      '**DESPESAS** (obrigatório guardar):',
      '• ✅ Faturas recebidas **COM SEU NIF**',
      '• ✅ Recibos de despesas',
      '• ✅ Extratos bancários (pagamentos)',
      '• ✅ Livro de despesas atualizado',
      '',
      '**FISCAIS** (obrigatório guardar):',
      '• ✅ Declarações de IVA (trimestrais)',
      '• ✅ Declaração de IRS (anual)',
      '• ✅ Comprovativos de pagamentos',
      '• ✅ Comprovativos de Segurança Social',
      '',
      '**BANCÁRIOS** (obrigatório guardar):',
      '• ✅ Extratos mensais',
      '• ✅ Comprovativos de transferências',
      '• ✅ Livro de caixa (se receber dinheiro)',
      '',
      '⏰ **Prazo de Guarda**: 10 anos (mínimo)',
      '💾 **Recomendado**: Versão digital de tudo',
      '',
      '⚠️ **CRÍTICO**: Faturas SEM seu NIF não podem ser deduzidas!',
    ],
    suggestions: ['Como organizar documentos?', 'Prazo de guarda', 'Faturas sem NIF']
  },
  organizacao: {
    keywords: ['organizar', 'organização', 'arquivo', 'pasta', 'sistema', 'estrutura'],
    responses: [
      '📁 **Sistema de Organização Recomendado**:',
      '',
      '**Por Ano e Mês**:',
      '```',
      '2024/',
      '├── Receitas/',
      '│   ├── 01-Janeiro/',
      '│   ├── 02-Fevereiro/',
      '│   └── ...',
      '├── Despesas/',
      '│   ├── 01-Janeiro/',
      '│   └── ...',
      '├── Fiscais/',
      '└── Bancários/',
      '```',
      '',
      '**Nomenclatura Digital**:',
      '• 2024-11-15_FAT_001_Cliente_Silva.pdf',
      '• 2024-11-15_DESP_Fornecedor_Energia.pdf',
      '',
      '**Ferramentas**:',
      '• Google Drive / OneDrive (nuvem)',
      '• Scanner de documentos (app)',
      '• Software contabilístico',
      '',
      '💡 **Dica**: Organize mensalmente, não deixe acumular!',
    ],
    suggestions: ['Apps para scanner', 'Backup de documentos']
  }
};

const GREETING_MESSAGES = [
  'Olá! 👋 Sou o assistente financeiro da NeuroBalance. Como posso ajudar com as suas dúvidas fiscais?',
  'Bem-vindo! Posso ajudar com questões sobre IVA, IRS, Segurança Social e muito mais. Em que posso ajudar?',
  'Oi! Estou aqui para responder dúvidas sobre impostos e finanças. O que gostaria de saber?'
];

const QUICK_QUESTIONS = [
  'Como calcular o IVA?',
  'Quais são os escalões de IRS?',
  'Quando pagar Segurança Social?',
  'Prazos fiscais 2024',
  'Despesas dedutíveis',
  'Que documentos guardar?',
  'Como organizar faturas?',
  'Exemplo de cálculo completo'
];

export const FinancialChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const greeting: Message = {
        id: '0',
        type: 'bot',
        content: GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)],
        timestamp: new Date(),
        suggestions: QUICK_QUESTIONS.slice(0, 4)
      };
      setMessages([greeting]);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const findBestResponse = (query: string): { responses: string[]; suggestions: string[] } | null => {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, data] of Object.entries(KNOWLEDGE_BASE)) {
      if (data.keywords.some(keyword => lowerQuery.includes(keyword))) {
        return { responses: data.responses, suggestions: data.suggestions };
      }
    }
    
    return null;
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = findBestResponse(text);
      
      let botResponse: Message;
      
      if (response) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.responses.join('\n'),
          timestamp: new Date(),
          suggestions: response.suggestions
        };
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: [
            'Desculpe, não encontrei uma resposta específica para essa pergunta. 🤔',
            '',
            'Mas posso ajudar com:',
            '• Cálculos de IVA, IRS e Segurança Social',
            '• Prazos e obrigações fiscais',
            '• Despesas dedutíveis',
            '• Regimes fiscais',
            '',
            'Ou use a **Calculadora Fiscal** para cálculos automáticos!'
          ].join('\n'),
          suggestions: QUICK_QUESTIONS.slice(0, 3)
        };
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleReset = () => {
    setMessages([{
      id: '0',
      type: 'bot',
      content: 'Conversa reiniciada! Como posso ajudar?',
      timestamp: new Date(),
      suggestions: QUICK_QUESTIONS.slice(0, 4)
    }]);
    toast.success('Conversa reiniciada!');
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Abrir assistente financeiro</span>
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-6 right-6 w-80 shadow-2xl z-50 bg-gradient-to-br from-blue-600 to-indigo-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-base">Assistente Financeiro</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Assistente Financeiro</CardTitle>
              <p className="text-xs text-blue-100">Sempre atualizado • 2024</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2',
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] rounded-lg p-3',
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                )}>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs opacity-70">Perguntas sugeridas:</p>
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickQuestion(suggestion)}
                          className="w-full justify-start text-xs h-auto py-2"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua dúvida..."
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Reiniciar
            </Button>
            <div className="flex-1"></div>
            <span className="text-[10px] text-gray-500">
              Atualizado • Nov 2024
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialChatbot;

