import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  File,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { processFile, detectDataType, mapToMarketingData, mapToLeadCompraData, ProcessedFileData } from '@/lib/file-processors';

interface FileImporterProps {
  onDataImported: (data: any[], type: 'marketing' | 'lead-compra') => void;
  expectedType?: 'marketing' | 'lead-compra';
  title?: string;
  description?: string;
}

const FileImporter: React.FC<FileImporterProps> = ({
  onDataImported,
  expectedType,
  title = 'Importar Arquivo',
  description = 'Arraste arquivos ou clique para selecionar'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFileData[]>([]);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        setProgress((i / acceptedFiles.length) * 100);
        
        const processedData = await processFile(file);
        const detectedType = detectDataType(processedData.content);
        
        // Validar tipo se especificado
        if (expectedType && detectedType !== expectedType && detectedType !== 'unknown') {
          toast.error(`Arquivo ${file.name} parece ser do tipo ${detectedType}, mas esperado ${expectedType}`);
          continue;
        }

        setProcessedFiles(prev => [...prev, processedData]);
        toast.success(`Arquivo ${file.name} processado com sucesso!`);
        
      } catch (error) {
        console.error(`Erro ao processar ${file.name}:`, error);
        toast.error(`Erro ao processar ${file.name}: ${error}`);
      }
    }

    setProgress(100);
    setIsProcessing(false);
  }, [expectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: isProcessing
  });

  const importData = (fileData: ProcessedFileData) => {
    const detectedType = detectDataType(fileData.content);
    const finalType = expectedType || detectedType;

    if (finalType === 'unknown') {
      toast.error('Não foi possível detectar o tipo de dados. Verifique o formato do arquivo.');
      return;
    }

    let mappedData: any[] = [];

    if (finalType === 'marketing') {
      mappedData = (fileData.type === 'excel' || fileData.type === 'csv') 
        ? mapToMarketingData(fileData.content)
        : [];
    } else if (finalType === 'lead-compra') {
      mappedData = (fileData.type === 'excel' || fileData.type === 'csv') 
        ? mapToLeadCompraData(fileData.content)
        : [];
    }

    if (mappedData.length === 0) {
      toast.error('Nenhum dado válido encontrado no arquivo.');
      return;
    }

    onDataImported(mappedData, finalType);
    toast.success(`${mappedData.length} registos importados com sucesso!`);
  };

  const removeFile = (index: number) => {
    setProcessedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadTemplate = (type: 'marketing' | 'lead-compra') => {
    const templates = {
      marketing: [
        ['Nome da Campanha', 'Origem', 'Mês', 'Ano', 'Investimento', 'Leads', 'Reuniões', 'Vendas', 'Receita'],
        ['Campanha Facebook Q1', 'Facebook Ads', 1, 2025, 1000, 150, 20, 5, 2500],
        ['Google Ads Verão', 'Google Ads', 6, 2025, 2000, 300, 45, 12, 6000]
      ],
      'lead-compra': [
        ['Nome', 'Email', 'Telefone', 'Cidade', 'Idade', 'Género', 'Valor', 'Data do Evento', 'Tipo'],
        ['João Silva', 'joao@email.com', '912345678', 'Lisboa', 35, 'Masculino', 85, '2025-01-15', 'Compra'],
        ['Maria Santos', 'maria@email.com', '923456789', 'Porto', 28, 'Feminino', 0, '2025-01-16', 'Lead']
      ]
    };

    // Criar e baixar arquivo Excel
    import('xlsx').then(XLSX => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templates[type]);
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, `template_${type}.xlsx`);
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'excel': return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
      case 'csv': return <FileSpreadsheet className="h-6 w-6 text-orange-600" />;
      case 'word': return <FileText className="h-6 w-6 text-blue-600" />;
      case 'pdf': return <File className="h-6 w-6 text-red-600" />;
      default: return <File className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate('marketing')}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Template Marketing
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate('lead-compra')}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Template Lead Compra
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-[#3f9094] bg-[#3f9094]/5' : 'border-gray-300 hover:border-[#3f9094]'}
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {isDragActive ? 'Solte os arquivos aqui...' : description}
            </h3>
            <p className="text-gray-600 mb-4">
              Suportados: Excel (.xlsx, .xls), CSV (.csv), Word (.docx), PDF (.pdf)
            </p>
            <Button 
              type="button" 
              disabled={isProcessing}
              className="bg-[#3f9094] hover:bg-[#2d7a7e]"
            >
              {isProcessing ? 'Processando...' : 'Selecionar Arquivos'}
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Processando arquivos...</span>
                <span className="text-sm font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {processedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Arquivos Processados ({processedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {processedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {file.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Array.isArray(file.content) ? file.content.length : 0} linhas
                      </Badge>
                      <Badge 
                        variant={detectDataType(file.content) !== 'unknown' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {detectDataType(file.content)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importData(file)}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" />
                    Importar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFile(index)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileImporter;
