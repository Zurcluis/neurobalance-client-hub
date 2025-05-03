
import React, { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ClientData } from '@/components/clients/ClientCard';
import { 
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

// Cores para os gráficos
const COLORS = ['#3A726D', '#5DA399', '#8AC1BB', '#B1D4CF', '#D8E6E3', '#265255'];

const StatisticsPage = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [contactTypeData, setContactTypeData] = useState<any[]>([]);
  const [referralSourceData, setReferralSourceData] = useState<any[]>([]);
  const [problemKeywords, setProblemKeywords] = useState<{text: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para carregar clientes (Local Storage ou Supabase)
  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Tentar buscar do Supabase primeiro
        const { data, error } = await supabase
          .from('clientes')
          .select('*');
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Mapear dados do Supabase para o formato do cliente
          const supabaseClients = data.map((client: any) => ({
            id: client.id,
            name: client.nome,
            email: client.email || '',
            phone: client.telefone || '',
            sessionCount: 0, // Precisaria fazer outra consulta para contar sessões
            nextSession: null,
            totalPaid: 0, // Precisaria fazer outra consulta para somar pagamentos
            status: client.estado || 'ongoing',
            birthday: client.data_nascimento,
            problemática: client.notas || '',
            tipoContato: 'Lead',
            comoConheceu: 'Anúncio'
          }));
          setClients(supabaseClients);
        } else {
          // Fallback para localStorage se não houver dados no Supabase
          const storedClients = localStorage.getItem('clients');
          if (storedClients) {
            setClients(JSON.parse(storedClients));
          }
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        // Fallback para localStorage em caso de erro
        const storedClients = localStorage.getItem('clients');
        if (storedClients) {
          setClients(JSON.parse(storedClients));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Processar dados quando a lista de clientes mudar
  useEffect(() => {
    if (clients.length > 0) {
      processStatistics();
    }
  }, [clients]);

  // Processar estatísticas a partir dos dados dos clientes
  const processStatistics = () => {
    // 1. Contagem por tipo de contato
    const contactTypes: Record<string, number> = {};
    clients.forEach(client => {
      const type = client.tipoContato || 'Não especificado';
      contactTypes[type] = (contactTypes[type] || 0) + 1;
    });
    
    const contactTypeArr = Object.entries(contactTypes).map(([name, value]) => ({ name, value }));
    setContactTypeData(contactTypeArr);

    // 2. Contagem por fonte de referência
    const referralSources: Record<string, number> = {};
    clients.forEach(client => {
      const source = client.comoConheceu || 'Não especificado';
      referralSources[source] = (referralSources[source] || 0) + 1;
    });
    
    const referralSourceArr = Object.entries(referralSources).map(([name, value]) => ({ name, value }));
    setReferralSourceData(referralSourceArr);

    // 3. Análise de palavras-chave nas problemáticas
    const problems = clients.map(client => client.problemática || '').join(' ').toLowerCase();
    const words = problems.split(/\s+/);
    const stopWords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam'];
    
    // Contagem de palavras (excluindo stop words e palavras muito curtas)
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      word = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (word && word.length > 3 && !stopWords.includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Converter para o formato adequado para a nuvem de palavras
    const keywordData = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([text, value]) => ({ text, value }));
    
    setProblemKeywords(keywordData);
  };

  // Criar configurações para os gráficos
  const chartConfig = {
    primary: { color: '#3A726D' },
    secondary: { color: '#5DA399' },
    terciary: { color: '#8AC1BB' },
    quaternary: { color: '#B1D4CF' },
    quinary: { color: '#D8E6E3' },
    senary: { color: '#265255' },
  };

  const renderNoData = () => (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-500">Dados insuficientes para análise</p>
    </div>
  );

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Estatísticas</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Análise de dados dos clientes</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
            </CardHeader>
            <CardContent className="h-72 flex items-center justify-center">
              <div className="animate-pulse h-full w-full bg-gray-200 dark:bg-gray-800 rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de barras: Tipos de Contato */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-xl">Clientes por Tipo de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {contactTypeData.length > 0 ? (
                  <ChartContainer className="h-full" config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={contactTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                        <Bar dataKey="value" fill={chartConfig.primary.color} name="Clientes">
                          {contactTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  renderNoData()
                )}
              </CardContent>
            </Card>

            {/* Gráfico de pizza: Como Conheceu */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="text-xl">Como teve conhecimento da clínica</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {referralSourceData.length > 0 ? (
                  <ChartContainer className="h-full" config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={referralSourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {referralSourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  renderNoData()
                )}
              </CardContent>
            </Card>
          </div>

          {/* Palavras frequentes */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-xl">Termos Frequentes na Problemática</CardTitle>
            </CardHeader>
            <CardContent>
              {problemKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 py-4">
                  {problemKeywords.map((keyword, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "px-3 py-1.5 rounded-full text-white", 
                        index % 6 === 0 && "bg-[#3A726D]",
                        index % 6 === 1 && "bg-[#5DA399]",
                        index % 6 === 2 && "bg-[#8AC1BB]",
                        index % 6 === 3 && "bg-[#B1D4CF] text-gray-800",
                        index % 6 === 4 && "bg-[#D8E6E3] text-gray-800",
                        index % 6 === 5 && "bg-[#265255]",
                      )}
                      style={{ 
                        fontSize: `${Math.max(0.8, Math.min(2, 0.8 + keyword.value / 5))}rem`,
                      }}
                    >
                      {keyword.text}
                      <span className="ml-1 text-xs opacity-80">({keyword.value})</span>
                    </div>
                  ))}
                </div>
              ) : (
                renderNoData()
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageLayout>
  );
};

export default StatisticsPage;
