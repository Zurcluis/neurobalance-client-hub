import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ClientFormData } from './ClientForm';
import { readExcelFile, readCSVFile, readTextFile, readPDFText, extractTextFromImage } from '@/lib/file-parsers';

interface ClientImportProps {
  onImportComplete: (clients: ClientFormData[]) => void;
}

const ALLOWED_FILE_TYPES = {
  'image/png': { icon: <ImageIcon className="h-8 w-8 text-purple-500" />, label: 'Imagem PNG' },
  'application/pdf': { icon: <File className="h-8 w-8 text-red-500" />, label: 'Documento PDF' },
  'text/plain': { icon: <FileText className="h-8 w-8 text-blue-500" />, label: 'Arquivo de Texto' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    icon: <FileSpreadsheet className="h-8 w-8 text-green-500" />, 
    label: 'Planilha Excel' 
  },
  'text/csv': { icon: <FileSpreadsheet className="h-8 w-8 text-green-500" />, label: 'Arquivo CSV' },
};

type FileType = keyof typeof ALLOWED_FILE_TYPES;

const ClientImport: React.FC<ClientImportProps> = ({ onImportComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ClientFormData[]>([]);
  const [currentTab, setCurrentTab] = useState<'upload' | 'preview'>('upload');
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/pdf', 'image/png', 'image/jpeg'];

  // Mapear campos dos arquivos para os campos do formulário
  const fieldMappings = {
    // Mapeamentos para nomes comuns em português
    'nome': ['nome', 'name', 'full name', 'nome completo', 'cliente'],
    'email': ['email', 'e-mail', 'correio eletrônico', 'correio eletronico'],
    'telefone': ['telefone', 'phone', 'tel', 'celular', 'mobile', 'contato'],
    'data_nascimento': ['data_nascimento', 'birth date', 'date of birth', 'data de nascimento', 'nascimento'],
    'genero': ['genero', 'género', 'gender', 'sexo', 'sex'],
    'morada': ['morada', 'endereço', 'endereco', 'address', 'residencia'],
    'notas': ['notas', 'notes', 'observações', 'observacoes', 'obs'],
    'estado': ['estado', 'status', 'situação', 'situacao'],
    'tipo_contato': ['tipo_contato', 'contact type', 'tipo de contato', 'origem'],
    'como_conheceu': ['como_conheceu', 'how heard', 'como conheceu', 'referência', 'referencia'],
    'numero_sessoes': ['numero_sessoes', 'sessions', 'sessões', 'sessoes', 'qtd sessoes'],
    'total_pago': ['total_pago', 'payment', 'pagamento', 'valor pago'],
    'max_sessoes': ['max_sessoes', 'max sessions', 'sessões máximas', 'sessoes maximas']
  };

  // Efeito para lidar com eventos de arrastar e soltar
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.add('bg-primary/5', 'border-primary');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove('bg-primary/5', 'border-primary');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropArea.classList.remove('bg-primary/5', 'border-primary');
      
      if (e.dataTransfer?.files) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };

    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    return () => {
      dropArea.removeEventListener('dragover', handleDragOver);
      dropArea.removeEventListener('dragleave', handleDragLeave);
      dropArea.removeEventListener('drop', handleDrop);
    };
  }, []);

  const handleFiles = (fileList: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    Array.from(fileList).forEach(file => {
      if (Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(
        `Tipos de arquivo não suportados: ${invalidFiles.join(', ')}. 
        Formatos aceitos: PNG, PDF, TXT, XLSX e CSV.`
      );
    }

    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Tipo de arquivo não permitido: ${file.name}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Arquivo muito grande: ${file.name}`);
        return false;
      }
      return true;
    });
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Mapeia valores para estados válidos
  const mapToValidStatus = (value: string): ClientFormData['estado'] => {
    const statusMap: Record<string, ClientFormData['estado']> = {
      'ongoing': 'ongoing',
      'on going': 'ongoing',
      'em andamento': 'ongoing',
      'progress': 'ongoing',
      'thinking': 'thinking',
      'pensando': 'thinking',
      'no need': 'no-need',
      'no-need': 'no-need',
      'sem necessidade': 'no-need',
      'finished': 'finished',
      'concluído': 'finished',
      'realizado': 'finished',
      'finalizado': 'finished',
      'call': 'call',
      'ligar': 'call',
      'contatar': 'call'
    };
    
    const normalized = value.toLowerCase().trim();
    return statusMap[normalized] || 'ongoing';
  };

  // Mapeia valores para gêneros válidos
  const mapToValidGender = (value: string): ClientFormData['genero'] => {
    const genderMap: Record<string, ClientFormData['genero']> = {
      'homem': 'Homem',
      'masculino': 'Homem',
      'male': 'Homem',
      'm': 'Homem',
      'mulher': 'Mulher',
      'feminino': 'Mulher',
      'female': 'Mulher',
      'f': 'Mulher'
    };
    
    const normalized = value.toLowerCase().trim();
    return genderMap[normalized] || 'Outro';
  };

  // Mapeia valores para tipos de contato válidos
  const mapToValidContactType = (value: string): ClientFormData['tipo_contato'] => {
    const contactTypeMap: Record<string, ClientFormData['tipo_contato']> = {
      'lead': 'Lead',
      'contato': 'Contato',
      'contato direto': 'Contato',
      'contact': 'Contato',
      'email': 'Email',
      'e-mail': 'Email',
      'instagram': 'Instagram',
      'insta': 'Instagram',
      'facebook': 'Facebook',
      'fb': 'Facebook'
    };
    
    const normalized = value.toLowerCase().trim();
    return contactTypeMap[normalized] || 'Lead';
  };

  // Mapeia valores para fontes de conhecimento válidas
  const mapToValidHowHeard = (value: string): ClientFormData['como_conheceu'] => {
    const howHeardMap: Record<string, ClientFormData['como_conheceu']> = {
      'anuncio': 'Anúncio',
      'anúncio': 'Anúncio',
      'ad': 'Anúncio',
      'advertisement': 'Anúncio',
      'instagram': 'Instagram',
      'insta': 'Instagram',
      'facebook': 'Facebook',
      'fb': 'Facebook',
      'recomendação': 'Recomendação',
      'recomendacao': 'Recomendação',
      'referral': 'Recomendação',
      'indicação': 'Recomendação',
      'indicacao': 'Recomendação',
      'amigo': 'Recomendação',
      'friend': 'Recomendação'
    };
    
    const normalized = value.toLowerCase().trim();
    return howHeardMap[normalized] || 'Anúncio';
  };

  // Função para tentar converter uma string em data
  const parseDate = (dateStr: string): Date | null => {
    // Tenta vários formatos comuns em português e inglês
    const formats = [
      // BR/PT formats
      /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // dd/mm/yyyy or d/m/yyyy
      /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/, // dd-mm-yyyy or d-m-yyyy
      /^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/, // dd.mm.yyyy or d.m.yyyy
      
      // US/ISO formats
      /^(\d{2,4})-(\d{1,2})-(\d{1,2})$/, // yyyy-mm-dd
      /^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/, // yyyy/mm/dd
      /^(\d{2,4})\.(\d{1,2})\.(\d{1,2})$/, // yyyy.mm.dd
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        let day, month, year;
        
        // Check if the first group has 4 digits (likely a year)
        if (match[1].length === 4) {
          // ISO format (yyyy-mm-dd)
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else {
          // Day-month-year format
          day = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          year = parseInt(match[3]);
          
          // Adjust two-digit year
          if (year < 100) {
            year = year < 50 ? year + 2000 : year + 1900;
          }
        }
        
        const date = new Date(year, month, day);
        
        // Valid date check
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  };

  // Analisa o texto extraído para encontrar dados de cliente
  const parseClientData = (text: string): Partial<ClientFormData> => {
    const clientData: Partial<ClientFormData> = {};
    const lines = text.split(/\r?\n/);
    
    // Primeiro tenta encontrar pares chave-valor (Chave: Valor ou Chave = Valor)
    lines.forEach(line => {
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
              case 'data_nascimento':
                const date = parseDate(value);
                if (date) {
                  (clientData as any)[fieldName] = date;
                }
                break;
              case 'genero':
                (clientData as any)[fieldName] = mapToValidGender(value);
                break;
              case 'estado':
                (clientData as any)[fieldName] = mapToValidStatus(value);
                break;
              case 'tipo_contato':
                (clientData as any)[fieldName] = mapToValidContactType(value);
                break;
              case 'como_conheceu':
                (clientData as any)[fieldName] = mapToValidHowHeard(value);
                break;
              case 'numero_sessoes':
              case 'total_pago':
              case 'max_sessoes':
                const num = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
                if (!isNaN(num)) {
                  (clientData as any)[fieldName] = num;
                }
                break;
              default:
                (clientData as any)[fieldName] = value;
            }
          }
        });
      }
    });
    
    // Se não encontrou dados estruturados, tenta extrair informações por padrões comuns
    if (Object.keys(clientData).length === 0) {
      // Tenta encontrar um nome (primeira linha ou algo que parece um nome)
      const nameMatch = text.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/m);
      if (nameMatch) {
        clientData.nome = nameMatch[1];
      }
      
      // Tenta encontrar um email
      const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        clientData.email = emailMatch[0];
      }
      
      // Tenta encontrar um número de telefone (vários formatos)
      const phoneMatch = text.match(/(?:\+\d{1,3}[- ]?)?\(?\d{2,3}\)?[- ]?\d{3,5}[- ]?\d{4}/);
      if (phoneMatch) {
        clientData.telefone = phoneMatch[0];
      }
      
      // Tenta encontrar uma data de nascimento
      const dateMatches = text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g);
      if (dateMatches) {
        const date = parseDate(dateMatches[0]);
        if (date) {
          clientData.data_nascimento = date;
        }
      }
    }
    
    return clientData;
  };

  // Processa os arquivos
  const processFiles = async () => {
    setIsUploading(true);
    setProgress(0);
    setErrors([]);
    const newErrors: string[] = [];
    
    try {
      const extractedClients: ClientFormData[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(Math.round((i / files.length) * 50)); // Primeira metade da barra de progresso
        
        try {
          let text = '';
          let parsedData: Partial<ClientFormData>[] = [];
          
          // Extrair texto com base no tipo de arquivo
          if (file.type === 'image/png') {
            text = await extractTextFromImage(file);
            parsedData = [parseClientData(text)];
          } else if (file.type === 'application/pdf') {
            text = await readPDFText(file);
            parsedData = [parseClientData(text)];
          } else if (file.type === 'text/plain') {
            text = await readTextFile(file);
            parsedData = [parseClientData(text)];
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            parsedData = await readExcelFile(file, fieldMappings);
          } else if (file.type === 'text/csv') {
            parsedData = await readCSVFile(file, fieldMappings);
          }
          
          // Validação e mapeamento de campos
          for (const data of parsedData) {
            // Completar campos ausentes com valores padrão
            const clientData: ClientFormData = {
              nome: data.nome || '',
              email: data.email || '',
              telefone: data.telefone || '',
              data_nascimento: data.data_nascimento || null,
              genero: data.genero || 'Outro',
              morada: data.morada || '',
              notas: data.notas || '',
              estado: data.estado || 'ongoing',
              tipo_contato: data.tipo_contato || 'Lead',
              como_conheceu: data.como_conheceu || 'Anúncio',
              numero_sessoes: data.numero_sessoes || 0,
              total_pago: data.total_pago || 0,
              max_sessoes: data.max_sessoes || 0
            };
            
            // Validar campos obrigatórios
            if (clientData.nome && clientData.email && clientData.telefone) {
              extractedClients.push(clientData);
            } else {
              const missingFields = [];
              if (!clientData.nome) missingFields.push('Nome');
              if (!clientData.email) missingFields.push('Email');
              if (!clientData.telefone) missingFields.push('Telefone');
              
              newErrors.push(`Arquivo ${file.name}: Campos obrigatórios faltando: ${missingFields.join(', ')}`);
            }
          }
        } catch (err) {
          console.error(`Erro ao processar o arquivo ${file.name}:`, err);
          newErrors.push(`Erro ao processar ${file.name}: ${(err as Error).message}`);
        }
        
        // Atualiza o progresso
        setProgress(Math.round(50 + (i / files.length) * 50)); // Segunda metade da barra de progresso
      }
      
      setExtractedData(extractedClients);
      setErrors(newErrors);
      
      if (extractedClients.length > 0) {
        setCurrentTab('preview');
        toast.success(`${extractedClients.length} cliente(s) extraído(s) com sucesso!`);
      } else {
        toast.error('Não foi possível extrair dados de cliente dos arquivos.');
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
  const importClients = () => {
    if (extractedData.length > 0) {
      onImportComplete(extractedData);
      toast.success(`${extractedData.length} cliente(s) importado(s) com sucesso!`);
      setFiles([]);
      setExtractedData([]);
      setCurrentTab('upload');
    } else {
      toast.error('Não há dados de cliente para importar.');
    }
  };

  return (
    <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'upload' | 'preview')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="preview" disabled={extractedData.length === 0}>
          Visualização {extractedData.length > 0 && `(${extractedData.length})`}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Importar Clientes</CardTitle>
            <CardDescription>
              Arraste e solte arquivos ou clique para selecionar. Tipos suportados: PNG, PDF, TXT, XLSX, CSV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={dropAreaRef}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".png,.pdf,.txt,.xlsx,.csv"
                onChange={handleFileChange}
              />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Arraste e solte seus arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                PNG (OCR), PDF, TXT, Excel (.xlsx) ou CSV
              </p>
            </div>

            {isUploading && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Processando...</p>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium">Arquivos Selecionados</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFiles}
                    className="text-xs h-8"
                  >
                    Limpar Todos
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {files.map((file, index) => {
                    const fileType = file.type as FileType;
                    return (
                      <div 
                        key={`${file.name}-${index}`} 
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          {ALLOWED_FILE_TYPES[fileType]?.icon || <File className="h-8 w-8 text-gray-500" />}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {file.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ALLOWED_FILE_TYPES[fileType]?.label || 'Arquivo'} • {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                          onClick={() => removeFile(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erros de Processamento</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 text-sm">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-[#3A726D] hover:bg-[#265255]"
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
              Revise os dados extraídos antes de importar. {extractedData.length} cliente(s) encontrado(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {extractedData.map((client, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between mb-3">
                    <h3 className="font-medium">Cliente {index + 1}</h3>
                    <Badge variant={client.nome && client.email && client.telefone ? "default" : "destructive"}>
                      {client.nome && client.email && client.telefone ? "Completo" : "Incompleto"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500">Nome:</span>
                      <span className={!client.nome ? "text-red-500" : ""}>{client.nome || "Não detectado"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Email:</span>
                      <span className={!client.email ? "text-red-500" : ""}>{client.email || "Não detectado"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Telefone:</span>
                      <span className={!client.telefone ? "text-red-500" : ""}>{client.telefone || "Não detectado"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Data de Nascimento:</span>
                      <span>
                        {client.data_nascimento 
                          ? new Date(client.data_nascimento).toLocaleDateString('pt-BR') 
                          : "Não detectado"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Gênero:</span>
                      <span>{client.genero || "Outro"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Morada:</span>
                      <span>{client.morada || "Não detectado"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Estado:</span>
                      <span>{client.estado || "ongoing"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Tipo de Contato:</span>
                      <span>{client.tipo_contato || "Lead"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Como Conheceu:</span>
                      <span>{client.como_conheceu || "Anúncio"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Nº de Sessões:</span>
                      <span>{client.numero_sessoes || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Total Pago:</span>
                      <span>€{client.total_pago || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">Máx. Sessões:</span>
                      <span>{client.max_sessoes || 0}</span>
                    </div>
                  </div>
                  
                  {client.notas && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">Notas:</span>
                      <p className="text-sm mt-1 p-2 bg-gray-50 dark:bg-gray-800 rounded">{client.notas}</p>
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
              className="bg-[#3A726D] hover:bg-[#265255]"
              onClick={importClients}
              disabled={extractedData.length === 0}
            >
              Importar {extractedData.length} Cliente(s)
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ClientImport; 