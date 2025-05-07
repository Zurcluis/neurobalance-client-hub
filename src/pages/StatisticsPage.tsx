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
import { differenceInYears } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import { Database } from '@/integrations/supabase/types';

// Cores para os gráficos
const COLORS = ['#3A726D', '#5DA399', '#8AC1BB', '#B1D4CF', '#D8E6E3', '#265255'];

type Client = Database['public']['Tables']['clientes']['Row'];

interface ClientStats {
  id: number;
  name: string;
  status: string;
  data_nascimento: string | null;
  genero: string;
  tipo_contato: 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook';
  como_conheceu: 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação';
  notas?: string;
}

const StatisticsPage = () => {
  const { clients } = useClients();
  const [clientStats, setClientStats] = useState<ClientStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactTypeData, setContactTypeData] = useState<any[]>([]);
  const [referralSourceData, setReferralSourceData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageGroupData, setAgeGroupData] = useState<any[]>([]);
  const [problemKeywords, setProblemKeywords] = useState<{text: string, value: number}[]>([]);

  useEffect(() => {
    if (clients) {
      const stats = clients.map(client => ({
        id: client.id,
        name: client.nome,
        status: client.estado || 'ongoing',
        data_nascimento: client.data_nascimento,
        genero: client.genero,
        tipo_contato: (client.tipo_contato || 'Lead') as 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook',
        como_conheceu: (client.como_conheceu || 'Anúncio') as 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação',
        notas: client.notas
      }));
      setClientStats(stats);
      setIsLoading(false);
    }
  }, [clients]);

  useEffect(() => {
    if (clientStats.length > 0) {
      processStatistics();
    }
  }, [clientStats]);

  const processStatistics = () => {
    // 1. Contagem por tipo de contato
    const contactTypes: Record<string, number> = {};
    clientStats.forEach(client => {
      const type = client.tipo_contato || 'Não especificado';
      contactTypes[type] = (contactTypes[type] || 0) + 1;
    });
    
    const contactTypeArr = Object.entries(contactTypes).map(([name, value]) => ({ name, value }));
    setContactTypeData(contactTypeArr);

    // 2. Contagem por fonte de referência
    const referralSources: Record<string, number> = {};
    clientStats.forEach(client => {
      const source = client.como_conheceu || 'Não especificado';
      referralSources[source] = (referralSources[source] || 0) + 1;
    });
    
    const referralSourceArr = Object.entries(referralSources).map(([name, value]) => ({ name, value }));
    setReferralSourceData(referralSourceArr);
    
    // 3. Contagem por género
    const genders: Record<string, number> = {};
    clientStats.forEach(client => {
      const gender = client.genero || 'Não especificado';
      genders[gender] = (genders[gender] || 0) + 1;
    });
    
    const genderArr = Object.entries(genders).map(([name, value]) => ({ name, value }));
    setGenderData(genderArr);
    
    // 4. Contagem por faixa etária
    const ageGroups: Record<string, number> = {
      "0-18": 0,
      "19-30": 0,
      "31-40": 0,
      "41-50": 0,
      "51-60": 0,
      "61+": 0,
      "Não especificado": 0
    };
    
    clientStats.forEach(client => {
      if (!client.data_nascimento) {
        ageGroups["Não especificado"]++;
        return;
      }
      
      try {
        const age = differenceInYears(new Date(), new Date(client.data_nascimento));
        if (age <= 18) ageGroups["0-18"]++;
        else if (age <= 30) ageGroups["19-30"]++;
        else if (age <= 40) ageGroups["31-40"]++;
        else if (age <= 50) ageGroups["41-50"]++;
        else if (age <= 60) ageGroups["51-60"]++;
        else ageGroups["61+"]++;
      } catch (e) {
        ageGroups["Não especificado"]++;
      }
    });
    
    const ageGroupArr = Object.entries(ageGroups)
      .filter(([_, value]) => value > 0) // Remover faixas etárias vazias
      .map(([name, value]) => ({ name, value }));
    setAgeGroupData(ageGroupArr);

    // 5. Análise de palavras-chave nas problemáticas
    const problems = clientStats.map(client => client.notas || '').join(' ').toLowerCase();
    const words = problems.split(/\s+/);
    const stopWords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam'];
    
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const ageDistribution = calculateAgeDistribution();
  const genderDistribution = calculateGenderDistribution();
  const contactTypeDistribution = calculateContactTypeDistribution();
  const sourceDistribution = calculateSourceDistribution();
  const statusDistribution = calculateStatusDistribution();

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-heading">Estatísticas</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Análise de dados dos clientes</p>
      </div>

      <Tabs defaultValue="age" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="age">Idade</TabsTrigger>
          <TabsTrigger value="gender">Género</TabsTrigger>
          <TabsTrigger value="contact">Tipo de Contacto</TabsTrigger>
          <TabsTrigger value="source">Origem</TabsTrigger>
          <TabsTrigger value="status">Estado</TabsTrigger>
        </TabsList>

        <TabsContent value="age">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Idade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(ageDistribution).map(([ageGroup, count]) => (
                  <div key={ageGroup} className="flex items-center justify-between">
                    <span>{ageGroup} anos</span>
                    <span>{count as number} clientes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gender">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Género</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="flex items-center justify-between">
                    <span>{gender}</span>
                    <span>{count as number} clientes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(contactTypeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span>{type}</span>
                    <span>{count as number} clientes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Origem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(sourceDistribution).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span>{source}</span>
                    <span>{count as number} clientes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span>{status}</span>
                    <span>{count as number} clientes</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de pizza: Distribuição por Género */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-xl">Distribuição por Género</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {genderData.length > 0 ? (
              <ChartContainer className="h-full" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
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

        {/* Gráfico de barras: Distribuição por Idade */}
        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-xl">Distribuição por Faixa Etária</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {ageGroupData.length > 0 ? (
              <ChartContainer className="h-full" config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroupData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="value" fill={chartConfig.primary.color} name="Clientes">
                      {ageGroupData.map((entry, index) => (
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
    </PageLayout>
  );
};

export default StatisticsPage;
