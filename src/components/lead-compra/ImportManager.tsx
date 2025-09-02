import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportData, ImportResult } from '@/types/lead-compra';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ImportManagerProps {
  onImport: (data: ImportData[]) => Promise<ImportResult>;
}

const ImportManager: React.FC<ImportManagerProps> = ({ onImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    try {
      setIsImporting(true);
      setProgress(10);
      
      const text = await file.text();
      setProgress(30);
      
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('Arquivo deve ter pelo menos uma linha de cabeçalho e uma linha de dados');
      }

      setProgress(50);

      // Processar CSV
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data: ImportData[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          console.warn(`Linha ${i + 1} tem número incorreto de colunas, pulando...`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
        });

        // Mapear campos esperados
        const importItem: ImportData = {
          nome: row.nome || row.name || '',
          email: row.email || '',
          telefone: row.telefone || row.phone || row.telefone || '',
          idade: parseInt(row.idade || row.age || '0'),
          genero: row.genero || row.gender || row.sexo || 'Outro',
          cidade: row.cidade || row.city || row.localidade || 'Outro',
          valor_pago: parseFloat(row.valor_pago || row.valor || row.price || '0'),
          data_evento: row.data_evento || row.data || row.date || new Date().toISOString().split('T')[0],
          tipo: row.tipo || row.type || row.status || 'Lead',
          origem_campanha: row.origem_campanha || row.origem || row.source || row.campanha || '',
        };

        data.push(importItem);
      }

      setProgress(70);

      if (data.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      // Importar dados
      const result = await onImport(data);
      setImportResult(result);
      setProgress(100);

      toast.success(`Importação concluída: ${result.sucessos} sucessos, ${result.erros} erros`);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro na importação');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'nome,email,telefone,idade,genero,cidade,valor_pago,data_evento,tipo,origem_campanha',
      'Maria Silva,maria@exemplo.com,912345678,35,Feminino,Lisboa,185,2025-06-15,Compra,Google Ads',
      'João Santos,joao@exemplo.com,923456789,28,Masculino,Porto,0,2025-06-20,Lead,Facebook Ads',
      'Ana Costa,ana@exemplo.com,934567890,42,Feminino,Coimbra,485,2025-07-10,Compra,Email Marketing'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-lead-compra.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Instruções */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato do arquivo CSV:</strong> O arquivo deve conter as colunas: nome, email, telefone, idade, genero, cidade, valor_pago, data_evento, tipo, origem_campanha.
          Use o template abaixo como referência.
        </AlertDescription>
      </Alert>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Template de Importação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Baixe o template CSV com exemplos de dados para facilitar a importação.
          </p>
          <Button onClick={downloadTemplate} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Baixar Template CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile">Arquivo CSV</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Processando arquivo...</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado da Importação */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.erros === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{importResult.totalLinhas}</p>
                <p className="text-sm text-gray-600">Total de Linhas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{importResult.sucessos}</p>
                <p className="text-sm text-gray-600">Sucessos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{importResult.erros}</p>
                <p className="text-sm text-gray-600">Erros</p>
              </div>
            </div>

            {importResult.erros > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800">Detalhes dos Erros:</h4>
                <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  {importResult.detalhesErros.map((erro, index) => (
                    <p key={index} className="text-sm text-red-700">
                      • {erro}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {importResult.sucessos > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{importResult.sucessos} registos</strong> foram importados com sucesso!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formato Esperado */}
      <Card>
        <CardHeader>
          <CardTitle>Formato Esperado do CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Campo</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Exemplo</th>
                  <th className="text-left p-2">Obrigatório</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="p-2">nome</td>
                  <td className="p-2">Texto</td>
                  <td className="p-2">Maria Silva</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">email</td>
                  <td className="p-2">Email</td>
                  <td className="p-2">maria@exemplo.com</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">telefone</td>
                  <td className="p-2">Texto</td>
                  <td className="p-2">912345678</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">idade</td>
                  <td className="p-2">Número</td>
                  <td className="p-2">35</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">genero</td>
                  <td className="p-2">Texto</td>
                  <td className="p-2">Feminino, Masculino, Outro</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">cidade</td>
                  <td className="p-2">Texto</td>
                  <td className="p-2">Lisboa</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">valor_pago</td>
                  <td className="p-2">Número</td>
                  <td className="p-2">185.50</td>
                  <td className="p-2">Não</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">data_evento</td>
                  <td className="p-2">Data</td>
                  <td className="p-2">2025-06-15</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">tipo</td>
                  <td className="p-2">Texto</td>
                  <td className="p-2">Compra, Lead</td>
                  <td className="p-2">Sim</td>
                </tr>
                <tr>
                  <td className="p-2">origem_campanha</td>
                  <td className="p-2">Texto</td>
                  <td className="p-2">Google Ads</td>
                  <td className="p-2">Não</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportManager;
