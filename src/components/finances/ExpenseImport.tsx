import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  FileSpreadsheet, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  readExcelFile, 
  readCSVFile, 
  readTextFile, 
  readPDFText, 
  extractTextFromImage 
} from '@/lib/file-parsers-expense';

// Tipo de despesa para o formulário
export interface ExpenseImportData {
  tipo: string;
  categoria: string;
  data: string;
  valor: number;
  notas?: string;
}

interface ExpenseImportProps {
  onImportComplete: (expenses: ExpenseImportData[]) => void;
  availableTypes: string[];
  categoryMapping: Record<string, string[]>;
}

const ALLOWED_FILE_TYPES = {
  'image/png': { icon: <ImageIcon className="h-8 w-8 text-purple-500" />, label: 'Imagem PNG' },
  'image/jpeg': { icon: <ImageIcon className="h-8 w-8 text-purple-500" />, label: 'Imagem JPEG' },
  'application/pdf': { icon: <File className="h-8 w-8 text-red-500" />, label: 'Documento PDF' },
  'text/plain': { icon: <FileText className="h-8 w-8 text-blue-500" />, label: 'Arquivo de Texto' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    icon: <FileSpreadsheet className="h-8 w-8 text-green-500" />, 
    label: 'Planilha Excel' 
  },
  'text/csv': { icon: <FileSpreadsheet className="h-8 w-8 text-green-500" />, label: 'Arquivo CSV' },
};

type FileType = keyof typeof ALLOWED_FILE_TYPES;

const ExpenseImport: React.FC<ExpenseImportProps> = ({ 
  onImportComplete, 
  availableTypes, 
  categoryMapping 
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<ExpenseImportData[]>([]);
  const [currentTab, setCurrentTab] = useState('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapeamento de campos para extração
  const fieldMappings = {
    tipo: ['tipo', 'type', 'tipo de despesa', 'tipo despesa', 'categoria principal', 'grupo'],
    categoria: ['categoria', 'category', 'subcategoria', 'descrição', 'descrição de despesa', 'descrição da despesa', 'description'],
    data: ['data', 'date', 'dia', 'data de emissão', 'data emissão', 'data de pagamento', 'date of payment'],
    valor: ['valor', 'value', 'amount', 'total', 'preço', 'price', 'custo', 'cost', 'montante', 'quantia'],
    notas: ['notas', 'notes', 'observações', 'comentários', 'comments', 'observacao', 'detalhes', 'details'],
  };

  // Tenta mapear valor encontrado para as categorias suportadas
  const mapToValidType = (value: string): string => {
    const lowerValue = value.toLowerCase().trim();
    
    // Tenta encontrar um tipo existente por correspondência direta
    const directMatch = availableTypes.find(type => 
      type.toLowerCase() === lowerValue
    );
    
    if (directMatch) return directMatch;
    
    // Tenta encontrar correspondência parcial
    for (const type of availableTypes) {
      if (lowerValue.includes(type.toLowerCase())) {
        return type;
      }
    }
    
    // Mapeamento de termos comuns para os tipos disponíveis
    const commonMappings: Record<string, string> = {
      'fixo': 'Fixas',
      'fixos': 'Fixas',
      'fixa': 'Fixas',
      'fixas': 'Fixas',
      'mensal': 'Fixas',
      'mensais': 'Fixas',
      'material': 'Materiais',
      'materiais': 'Materiais',
      'consumivel': 'Materiais',
      'consumiveis': 'Materiais',
      'outras': 'Outras',
      'outra': 'Outras',
      'outro': 'Outras',
      'outros': 'Outras',
      'diversa': 'Outras',
      'diversas': 'Outras'
    };
    
    for (const [key, mappedType] of Object.entries(commonMappings)) {
      if (lowerValue.includes(key)) {
        return mappedType;
      }
    }
    
    // Se nenhuma correspondência for encontrada, retorna o primeiro tipo disponível
    return availableTypes[0] || 'Outras';
  };

  // Mapeia uma categoria com base no tipo e valor encontrado
  const mapToValidCategory = (type: string, value: string): string => {
    const lowerValue = value.toLowerCase().trim();
    const availableCategories = categoryMapping[type] || [];
    
    // Tenta encontrar uma categoria existente por correspondência direta
    const directMatch = availableCategories.find(category => 
      category.toLowerCase() === lowerValue
    );
    
    if (directMatch) return directMatch;
    
    // Tenta encontrar correspondência parcial
    for (const category of availableCategories) {
      if (lowerValue.includes(category.toLowerCase())) {
        return category;
      }
    }
    
    // Se nenhuma correspondência for encontrada, retorna a primeira categoria do tipo
    return availableCategories[0] || '';
  };

  // Tenta extrair uma data de vários formatos possíveis
  const parseDate = (value: string): string | null => {
    const today = new Date();
    
    // Tenta diversos formatos de data
    const formats = [
      // DD/MM/YYYY
      /(\d{1,2})[\/\-.\\](\d{1,2})[\/\-.\\](\d{4})/,
      // DD/MM/YY
      /(\d{1,2})[\/\-.\\](\d{1,2})[\/\-.\\](\d{2})/,
      // YYYY/MM/DD
      /(\d{4})[\/\-.\\](\d{1,2})[\/\-.\\](\d{1,2})/,
      // MM/DD/YYYY
      /(\d{1,2})[\/\-.\\](\d{1,2})[\/\-.\\](\d{4})/,
    ];
    
    for (const regex of formats) {
      const match = value.match(regex);
      if (match) {
        let day, month, year;
        
        if (regex === formats[0] || regex === formats[1]) {
          // DD/MM/YYYY ou DD/MM/YY
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1; // Mês em JavaScript é 0-indexed
          year = parseInt(match[3], 10);
          
          // Ajustar ano de 2 dígitos
          if (year < 100) {
            year += year < 50 ? 2000 : 1900;
          }
        } else if (regex === formats[2]) {
          // YYYY/MM/DD
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1;
          day = parseInt(match[3], 10);
        } else {
          // MM/DD/YYYY
          month = parseInt(match[1], 10) - 1;
          day = parseInt(match[2], 10);
          year = parseInt(match[3], 10);
        }
        
        // Validar se a data é possível (dia 1-31, mês 0-11, ano razoável)
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= today.getFullYear() + 1) {
          const date = new Date(year, month, day);
          return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        }
      }
    }
    
    // Tenta buscar palavras que podem indicar datas
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'
    ];
    
    const lowerValue = value.toLowerCase();
    
    // Procura por padrões como "15 de janeiro de 2022" ou "janeiro de 2022"
    for (let i = 0; i < monthNames.length; i++) {
      const monthIndex = i % 12; // Mapeamento para o índice do mês correto
      
      if (lowerValue.includes(monthNames[i])) {
        // Tenta extrair o dia (1-31)
        const dayMatch = lowerValue.match(/\b(\d{1,2})\b/);
        // Tenta extrair o ano (4 dígitos)
        const yearMatch = lowerValue.match(/\b(19\d{2}|20\d{2})\b/);
        
        const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
        const year = yearMatch ? parseInt(yearMatch[1], 10) : today.getFullYear();
        
        const date = new Date(year, monthIndex, day);
        return date.toISOString().split('T')[0];
      }
    }
    
    // Se não conseguir extrair, retorna a data atual
    return today.toISOString().split('T')[0];
  };

  // Analisa o texto extraído para encontrar dados de despesa
  const parseExpenseData = (text: string): Partial<ExpenseImportData>[] => {
    const result: Partial<ExpenseImportData>[] = [];
    let currentExpense: Partial<ExpenseImportData> = {};
    const lines = text.split(/\r?\n/);
    
    // Primeiro tenta encontrar pares chave-valor (Chave: Valor ou Chave = Valor)
    lines.forEach(line => {
      // Ignora linhas vazias
      if (!line.trim()) return;
      
      // Tenta extrair pares chave-valor
      const keyValueMatch = line.match(/([^:=]+)[:|=]\s*(.+)/);
      if (keyValueMatch) {
        const key = keyValueMatch[1].trim().toLowerCase();
        const value = keyValueMatch[2].trim();
        
        // Procura a chave em todos os mapeamentos de campo
        Object.entries(fieldMappings).forEach(([fieldName, aliases]) => {
          if (aliases.includes(key)) {
            // Converte o valor para o tipo apropriado com base no campo
            switch (fieldName) {
              case 'tipo':
                currentExpense.tipo = mapToValidType(value);
                break;
              case 'categoria':
                if (currentExpense.tipo) {
                  currentExpense.categoria = mapToValidCategory(currentExpense.tipo, value);
                } else {
                  // Se o tipo ainda não foi identificado, armazena temporariamente
                  (currentExpense as any)._rawCategoria = value;
                }
                break;
              case 'data':
                const date = parseDate(value);
                if (date) {
                  currentExpense.data = date;
                }
                break;
              case 'valor':
                // Remove caracteres não numéricos, mas mantém pontos e vírgulas
                const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
                const num = parseFloat(cleanValue);
                if (!isNaN(num)) {
                  currentExpense.valor = num;
                }
                break;
              case 'notas':
                currentExpense.notas = value;
                break;
            }
          }
        });
      } else {
        // Se não é um par chave-valor, processa como uma linha de informação
        // Verifica se é um valor monetário
        const valueMatch = line.match(/\b[€$]?\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)(?:\s?[€$])?\b/);
        if (valueMatch) {
          const cleanValue = valueMatch[1].replace(/[^\d.,]/g, '').replace(',', '.');
          const num = parseFloat(cleanValue);
          if (!isNaN(num) && num > 0) {
            currentExpense.valor = num;
          }
        }
        
        // Verifica se é uma data
        const dateMatch = parseDate(line);
        if (dateMatch) {
          currentExpense.data = dateMatch;
        }
      }
    });
    
    // Se ainda não tem tipo definido, mas tem uma categoria raw, tenta inferir o tipo
    if (!currentExpense.tipo && (currentExpense as any)._rawCategoria) {
      currentExpense.tipo = mapToValidType((currentExpense as any)._rawCategoria);
      currentExpense.categoria = mapToValidCategory(
        currentExpense.tipo, 
        (currentExpense as any)._rawCategoria
      );
      delete (currentExpense as any)._rawCategoria;
    }
    
    // Se não encontrou tipo, usa o padrão
    if (!currentExpense.tipo) {
      currentExpense.tipo = availableTypes[0] || 'Outras';
    }
    
    // Se não encontrou categoria, usa a primeira do tipo
    if (!currentExpense.categoria && currentExpense.tipo) {
      currentExpense.categoria = categoryMapping[currentExpense.tipo]?.[0] || '';
    }
    
    // Se não encontrou data, usa a data atual
    if (!currentExpense.data) {
      currentExpense.data = new Date().toISOString().split('T')[0];
    }
    
    // Se temos pelo menos o valor, considera uma despesa válida
    if (currentExpense.valor) {
      result.push(currentExpense);
    }
    
    return result;
  };

  // Manipulador de upload de arquivos
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      newFiles.forEach(file => {
        if (file.type in ALLOWED_FILE_TYPES) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });
      
      if (invalidFiles.length > 0) {
        toast.error(`Arquivo(s) não suportado(s): ${invalidFiles.join(', ')}`);
      }
      
      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        toast.success(`${validFiles.length} arquivo(s) adicionado(s)`);
      }
    }
  }, []);

  // Remover arquivo da lista
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Processa os arquivos
  const processFiles = async () => {
    setIsUploading(true);
    setProgress(0);
    setErrors([]);
    const newErrors: string[] = [];
    
    try {
      const extractedExpenses: ExpenseImportData[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(Math.round((i / files.length) * 50)); // Primeira metade da barra de progresso
        
        try {
          let text = '';
          let parsedData: Partial<ExpenseImportData>[] = [];
          
          // Extrair dados com base no tipo de arquivo
          if (file.type === 'image/png' || file.type === 'image/jpeg') {
            text = await extractTextFromImage(file);
            parsedData = parseExpenseData(text);
          } else if (file.type === 'application/pdf') {
            text = await readPDFText(file);
            parsedData = parseExpenseData(text);
          } else if (file.type === 'text/plain') {
            text = await readTextFile(file);
            parsedData = parseExpenseData(text);
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            const excelData = await readExcelFile(file, fieldMappings);
            parsedData = excelData.map(row => {
              const expense: Partial<ExpenseImportData> = {};
              
              // Processa cada campo
              if (row.tipo) expense.tipo = mapToValidType(row.tipo as string);
              if (row.data) expense.data = typeof row.data === 'string' ? 
                parseDate(row.data) || new Date().toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0];
              
              // Processa categoria após o tipo
              if (expense.tipo && row.categoria) {
                expense.categoria = mapToValidCategory(expense.tipo, row.categoria as string);
              } else if (expense.tipo) {
                expense.categoria = categoryMapping[expense.tipo]?.[0] || '';
              }
              
              if (row.valor !== undefined) {
                const val = typeof row.valor === 'number' ? 
                  row.valor : 
                  parseFloat(String(row.valor).replace(/[^\d.,]/g, '').replace(',', '.'));
                
                if (!isNaN(val)) expense.valor = val;
              }
              
              if (row.notas) expense.notas = row.notas as string;
              
              return expense;
            });
          } else if (file.type === 'text/csv') {
            const csvData = await readCSVFile(file, fieldMappings);
            parsedData = csvData.map(row => {
              const expense: Partial<ExpenseImportData> = {};
              
              if (row.tipo) expense.tipo = mapToValidType(row.tipo as string);
              if (row.data) expense.data = typeof row.data === 'string' ? 
                parseDate(row.data) || new Date().toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0];
              
              if (expense.tipo && row.categoria) {
                expense.categoria = mapToValidCategory(expense.tipo, row.categoria as string);
              } else if (expense.tipo) {
                expense.categoria = categoryMapping[expense.tipo]?.[0] || '';
              }
              
              if (row.valor !== undefined) {
                const val = typeof row.valor === 'number' ? 
                  row.valor : 
                  parseFloat(String(row.valor).replace(/[^\d.,]/g, '').replace(',', '.'));
                
                if (!isNaN(val)) expense.valor = val;
              }
              
              if (row.notas) expense.notas = row.notas as string;
              
              return expense;
            });
          }
          
          // Validação básica e adição à lista de despesas extraídas
          for (const data of parsedData) {
            // Completar campos ausentes com valores padrão
            const expense: ExpenseImportData = {
              tipo: data.tipo || availableTypes[0] || 'Outras',
              categoria: data.categoria || '',
              data: data.data || new Date().toISOString().split('T')[0],
              valor: data.valor || 0,
              notas: data.notas || ''
            };
            
            // Assegurar que temos uma categoria válida
            if (!expense.categoria && expense.tipo) {
              expense.categoria = categoryMapping[expense.tipo]?.[0] || '';
            }
            
            // Validar campos obrigatórios
            if (expense.tipo && expense.categoria && expense.data && expense.valor > 0) {
              extractedExpenses.push(expense);
            } else {
              const missingFields = [];
              if (!expense.tipo) missingFields.push('Tipo');
              if (!expense.categoria) missingFields.push('Categoria');
              if (!expense.data) missingFields.push('Data');
              if (!expense.valor || expense.valor <= 0) missingFields.push('Valor');
              
              if (missingFields.length > 0) {
                newErrors.push(`Arquivo ${file.name}: Campos obrigatórios faltando: ${missingFields.join(', ')}`);
              }
            }
          }
        } catch (err) {
          console.error(`Erro ao processar o arquivo ${file.name}:`, err);
          newErrors.push(`Erro ao processar ${file.name}: ${(err as Error).message}`);
        }
        
        // Atualiza o progresso
        setProgress(Math.round(50 + (i / files.length) * 50)); // Segunda metade da barra de progresso
      }
      
      setExtractedData(extractedExpenses);
      setErrors(newErrors);
      
      if (extractedExpenses.length > 0) {
        setCurrentTab('preview');
        toast.success(`${extractedExpenses.length} despesa(s) extraída(s) com sucesso!`);
      } else {
        toast.error('Não foi possível extrair dados de despesas dos arquivos.');
      }
    } catch (err) {
      console.error('Erro ao processar arquivos:', err);
      toast.error(`Erro: ${(err as Error).message}`);
    } finally {
      setIsUploading(false);
      setProgress(100);
    }
  };

  // Importa os dados extraídos
  const importExpenses = () => {
    if (extractedData.length > 0) {
      onImportComplete(extractedData);
      toast.success(`${extractedData.length} despesa(s) importada(s) com sucesso!`);
      setFiles([]);
      setExtractedData([]);
      setCurrentTab('upload');
    } else {
      toast.error('Não há dados de despesas para importar.');
    }
  };

  // Limpar tudo
  const resetAll = () => {
    setFiles([]);
    setExtractedData([]);
    setErrors([]);
    setCurrentTab('upload');
  };

  // Acionador do input de arquivo
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab}>
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="preview" disabled={extractedData.length === 0}>
          Pré-visualização ({extractedData.length})
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Upload de Arquivos</CardTitle>
            <CardDescription>
              Carregue recibos ou planilhas com despesas para extrair automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="expense-file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Clique para carregar</span> ou arraste aqui
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Suportados: TXT, PDF, XLS, XLSX, PNG, JPG
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="expense-file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.xlsx,.xls,.png,.jpg,.jpeg,.csv"
                />
              </label>
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <p className="text-sm mb-2">Processando arquivos...</p>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Arquivos ({files.length})</h3>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        {(file.type as FileType) in ALLOWED_FILE_TYPES && ALLOWED_FILE_TYPES[file.type as FileType].icon}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {ALLOWED_FILE_TYPES[file.type as FileType]?.label || file.type}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {errors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erros</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetAll}
              disabled={files.length === 0}
            >
              Limpar
            </Button>
            <Button 
              className="bg-[#3f9094] hover:bg-[#265255]"
              onClick={processFiles}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? 'Processando...' : 'Processar Arquivos'}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="preview" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Dados Extraídos</CardTitle>
            <CardDescription>
              Revise as despesas extraídas antes de importar. {extractedData.length} despesa(s) encontrada(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {extractedData.map((expense, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between mb-3">
                    <h3 className="font-medium">Despesa {index + 1}</h3>
                    <Badge variant={expense.valor > 0 ? "default" : "destructive"}>
                      {expense.valor > 0 ? "Completa" : "Incompleta"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Tipo</p>
                      <p className="font-medium">{expense.tipo}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Categoria</p>
                      <p className="font-medium">{expense.categoria}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Data</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(expense.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Valor</p>
                      <p className="font-medium text-[#3f9094]">
                        {`€${expense.valor.toLocaleString('pt-PT', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}`}
                      </p>
                    </div>
                  </div>
                  {expense.notas && (
                    <div className="mt-2">
                      <p className="text-gray-500 text-sm">Notas</p>
                      <p className="text-sm">{expense.notas}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentTab('upload')}
            >
              Voltar
            </Button>
            <Button 
              className="bg-[#3f9094] hover:bg-[#265255]"
              onClick={importExpenses}
              disabled={extractedData.length === 0}
            >
              Importar {extractedData.length} Despesa(s)
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ExpenseImport; 