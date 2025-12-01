import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Image, File, Calendar, Clock, User, Loader2, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ParsedAppointment {
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  terapeuta?: string;
  id_manual?: string;
  estado?: string;
  cor?: string;
  notas?: string;
  clientName?: string;
}

interface CalendarImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (appointments: ParsedAppointment[]) => Promise<void>;
  clients: { id: number; nome: string }[];
}

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.gif';

export const CalendarImport: React.FC<CalendarImportProps> = ({
  isOpen,
  onClose,
  onImport,
  clients
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [parsedAppointments, setParsedAppointments] = useState<ParsedAppointment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'confirm'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      // Para ficheiros de texto, ler diretamente
      if (selectedFile.type === 'text/plain') {
        const text = await selectedFile.text();
        setExtractedText(text);
        parseTextForAppointments(text);
      }
      // Para PDFs, tentar extrair texto básico
      else if (selectedFile.type === 'application/pdf') {
        // PDF precisa de processamento especial
        // Por agora, vamos pedir ao utilizador para colar o texto
        setExtractedText('');
        toast.info('PDF detectado. Por favor, copie o texto do PDF e cole abaixo para análise.');
      }
      // Para imagens, pedir ao utilizador para descrever
      else if (selectedFile.type.startsWith('image/')) {
        setExtractedText('');
        toast.info('Imagem detectada. Por favor, descreva os agendamentos da imagem no campo de texto.');
      }
      // Para documentos Word
      else if (selectedFile.name.endsWith('.doc') || selectedFile.name.endsWith('.docx')) {
        setExtractedText('');
        toast.info('Documento Word detectado. Por favor, copie o texto do documento e cole abaixo.');
      }

      setStep('review');
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar o arquivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseTextForAppointments = (text: string) => {
    const appointments: ParsedAppointment[] = [];

    // Normalizar texto (substituir diferentes tipos de traços)
    const normalizedText = text
      .replace(/–/g, '-')  // en-dash
      .replace(/—/g, '-')  // em-dash
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    // Mapeamento de meses em português
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'janeiro': '01',
      'fev': '02', 'fevereiro': '02',
      'mar': '03', 'março': '03', 'marco': '03',
      'abr': '04', 'abril': '04',
      'mai': '05', 'maio': '05',
      'jun': '06', 'junho': '06',
      'jul': '07', 'julho': '07',
      'ago': '08', 'agosto': '08',
      'set': '09', 'setembro': '09',
      'out': '10', 'outubro': '10',
      'nov': '11', 'novembro': '11',
      'dez': '12', 'dezembro': '12'
    };

    const getMonthNumber = (monthStr: string): string => {
      const cleaned = monthStr.toLowerCase().replace(/\./g, '').trim();
      return monthMap[cleaned] || monthMap[cleaned.substring(0, 3)] || '';
    };

    const lines = normalizedText.split('\n');

    // Variáveis para acumular informação de um evento
    let currentDay = '';
    let currentMonth = '';
    let currentYear = '';
    let currentTime = '';
    let currentTitle = '';

    const saveCurrentEvent = () => {
      if (currentDay && currentMonth && currentYear) {
        const data = `${currentYear}-${currentMonth}-${currentDay.padStart(2, '0')}`;
        appointments.push({
          titulo: currentTitle.trim() || 'Sessão',
          data,
          hora: currentTime || '09:00',
          tipo: 'sessão',
        });
      }
      // Reset título e hora para próximo evento (manter mês/ano)
      currentTime = '';
      currentTitle = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // ============================================
      // FORMATO GOOGLE CALENDAR
      // ============================================

      // Padrão: Dia + Mês/Ano na mesma linha ou próximas
      // Exemplo: "12" seguido de "Nov. 2025, Sex"

      // Linha é apenas um número (dia do mês) - formato Google Calendar
      const dayOnlyMatch = line.match(/^(\d{1,2})$/);
      if (dayOnlyMatch) {
        // Salvar evento anterior se existir
        if (currentDay && currentMonth && currentYear && (currentTime || currentTitle)) {
          saveCurrentEvent();
        }
        currentDay = dayOnlyMatch[1];
        currentTime = '';
        currentTitle = '';
        continue;
      }

      // Padrão: Mês. Ano, Dia da semana (Nov. 2025, Sex ou NOV. 2025, SEX)
      const monthYearDayMatch = line.match(/^([A-Za-zÀ-ÿ]+)\.?\s*(\d{4}),?\s*([A-Za-zÀ-ÿ]+)\.?$/i);
      if (monthYearDayMatch) {
        const month = getMonthNumber(monthYearDayMatch[1]);
        if (month) {
          currentMonth = month;
          currentYear = monthYearDayMatch[2];
        }
        continue;
      }

      // Padrão: Horário com intervalo (16:00 - 17:00)
      const timeRangeMatch = line.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (timeRangeMatch) {
        currentTime = `${timeRangeMatch[1].padStart(2, '0')}:${timeRangeMatch[2]}`;
        continue;
      }

      // Padrão: Apenas horário simples (16:00)
      const simpleTimeMatch = line.match(/^(\d{1,2}):(\d{2})$/);
      if (simpleTimeMatch) {
        currentTime = `${simpleTimeMatch[1].padStart(2, '0')}:${simpleTimeMatch[2]}`;
        continue;
      }

      // ============================================
      // FORMATO DATA COMPLETA
      // ============================================

      // Padrão: DD/MM/YYYY com ou sem hora
      const fullDateMatch = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (fullDateMatch) {
        // Salvar evento anterior
        if (currentDay && currentMonth && currentYear && (currentTime || currentTitle)) {
          saveCurrentEvent();
        }

        currentDay = fullDateMatch[1];
        currentMonth = fullDateMatch[2].padStart(2, '0');
        currentYear = fullDateMatch[3];

        // Verificar se há horário na mesma linha
        const timeInLine = line.match(/(\d{1,2}):(\d{2})/);
        if (timeInLine) {
          currentTime = `${timeInLine[1].padStart(2, '0')}:${timeInLine[2]}`;
        }

        // Extrair título se houver mais texto
        let remainingText = line.replace(fullDateMatch[0], '');
        if (timeInLine) {
          remainingText = remainingText.replace(/(\d{1,2}):(\d{2})(\s*-\s*(\d{1,2}):(\d{2}))?/g, '');
        }
        remainingText = remainingText.replace(/-/g, ' ').replace(/às?/gi, '').replace(/\s+/g, ' ').trim();
        if (remainingText.length > 2) {
          currentTitle = remainingText;
        }
        continue;
      }

      // Padrão: YYYY-MM-DD
      const isoDateMatch = line.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoDateMatch) {
        if (currentDay && currentMonth && currentYear && (currentTime || currentTitle)) {
          saveCurrentEvent();
        }
        currentYear = isoDateMatch[1];
        currentMonth = isoDateMatch[2];
        currentDay = isoDateMatch[3];
        continue;
      }

      // ============================================
      // TÍTULO DO EVENTO
      // ============================================

      // Se já temos um dia, esta linha pode ser o título
      if (currentDay && line.length > 0) {
        // Ignorar dias da semana abreviados
        const weekDayAbbrevs = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'sáb', 'dom',
          'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
        const cleanLine = line.toLowerCase().replace(/\./g, '').trim();
        const isWeekDay = weekDayAbbrevs.includes(cleanLine);

        if (!isWeekDay) {
          // Se já tem título, é um novo evento com o mesmo título ou adicionar ao título
          if (currentTitle && currentTime) {
            // Já temos título e hora, este pode ser um novo evento
            saveCurrentEvent();
            currentTitle = line;
          } else {
            // Acumular título
            currentTitle = currentTitle ? currentTitle + ' ' + line : line;
          }
        }
      } else if (!currentDay) {
        // ============================================
        // FORMATOS DE LINHA ÚNICA
        // ============================================

        // "Nome - 03/12/2025 às 10:00" ou "Nome - 03/12/2025 10:00"
        const combinedMatch1 = line.match(/(.+?)\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(?:às?\s*)?(\d{1,2}):(\d{2})/i);
        if (combinedMatch1) {
          appointments.push({
            titulo: combinedMatch1[1].trim() || 'Sessão',
            data: `${combinedMatch1[4]}-${combinedMatch1[3].padStart(2, '0')}-${combinedMatch1[2].padStart(2, '0')}`,
            hora: `${combinedMatch1[5].padStart(2, '0')}:${combinedMatch1[6]}`,
            tipo: 'sessão',
          });
          continue;
        }

        // "03/12/2025 10:00 - Nome"
        const combinedMatch2 = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})\s*-\s*(.+)/i);
        if (combinedMatch2) {
          appointments.push({
            titulo: combinedMatch2[6].trim() || 'Sessão',
            data: `${combinedMatch2[3]}-${combinedMatch2[2].padStart(2, '0')}-${combinedMatch2[1].padStart(2, '0')}`,
            hora: `${combinedMatch2[4].padStart(2, '0')}:${combinedMatch2[5]}`,
            tipo: 'sessão',
          });
          continue;
        }

        // "03/12/2025 10:00 Nome" (sem separador)
        const combinedMatch3 = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(.+)/i);
        if (combinedMatch3) {
          appointments.push({
            titulo: combinedMatch3[6].trim() || 'Sessão',
            data: `${combinedMatch3[3]}-${combinedMatch3[2].padStart(2, '0')}-${combinedMatch3[1].padStart(2, '0')}`,
            hora: `${combinedMatch3[4].padStart(2, '0')}:${combinedMatch3[5]}`,
            tipo: 'sessão',
          });
          continue;
        }
      }
    }

    // Salvar último evento se houver
    if (currentDay && currentMonth && currentYear) {
      saveCurrentEvent();
    }

    // ============================================
    // FALLBACK: Parser genérico linha a linha
    // ============================================
    if (appointments.length === 0) {
      const allLines = normalizedText.split('\n').filter(l => l.trim());
      for (const line of allLines) {
        const trimmed = line.trim();
        if (trimmed.length < 3) continue;

        let data = '';
        let hora = '';
        let titulo = trimmed;

        // Procurar data DD/MM/YYYY
        const dateMatch = trimmed.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dateMatch) {
          data = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
          titulo = titulo.replace(dateMatch[0], '').trim();
        }

        // Procurar horário
        const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          hora = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
          titulo = titulo.replace(/(\d{1,2}):(\d{2})(\s*-\s*(\d{1,2}):(\d{2}))?/g, '').trim();
        }

        // Limpar título
        titulo = titulo.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();

        if ((data || hora) && titulo.length >= 2) {
          appointments.push({
            titulo: titulo || 'Sessão',
            data: data || format(new Date(), 'yyyy-MM-dd'),
            hora: hora || '09:00',
            tipo: 'sessão',
          });
        }
      }
    }

    // Remover duplicados baseado em data + hora + título
    const uniqueAppointments = appointments.filter((apt, index, self) =>
      index === self.findIndex(a =>
        a.data === apt.data && a.hora === apt.hora && a.titulo === apt.titulo
      )
    );

    console.log('Agendamentos parseados:', uniqueAppointments);
    setParsedAppointments(uniqueAppointments);

    if (uniqueAppointments.length > 0) {
      setStep('confirm');
      toast.success(`${uniqueAppointments.length} agendamento(s) detectado(s)!`);
    } else {
      toast.warning('Nenhum agendamento detectado. Verifique o formato do texto.');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setExtractedText(e.target.value);
  };

  const handleAnalyzeText = () => {
    if (!extractedText.trim()) {
      toast.error('Por favor, insira o texto para analisar');
      return;
    }
    parseTextForAppointments(extractedText);
  };

  const updateAppointment = (index: number, field: keyof ParsedAppointment, value: string) => {
    setParsedAppointments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeAppointment = (index: number) => {
    setParsedAppointments(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (parsedAppointments.length === 0) {
      toast.error('Nenhum agendamento para importar');
      return;
    }

    setIsImporting(true);
    try {
      await onImport(parsedAppointments);
      toast.success(`${parsedAppointments.length} agendamento(s) importado(s) com sucesso!`);
      handleClose();
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error('Erro ao importar agendamentos');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setExtractedText('');
    setParsedAppointments([]);
    setStep('upload');
    onClose();
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return <FileText className="h-8 w-8 text-red-500" />;
    if (type.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
    if (type === 'text/plain') return <FileText className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-teal-600" />
            Importar Agendamentos
          </DialogTitle>
          <DialogDescription>
            Faça upload de um ficheiro (PDF, TXT, DOC, imagem) para importar agendamentos automaticamente.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Upload de ficheiro */}
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                "hover:border-teal-500 hover:bg-teal-50/50",
                file ? "border-teal-500 bg-teal-50" : "border-gray-300"
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-teal-500 animate-spin" />
                  <p className="text-gray-600">A processar ficheiro...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-3">
                  {getFileIcon(file.type)}
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}>
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Carregar ficheiro</p>
                    <p className="text-xs text-gray-500">PDF, TXT, DOC, Imagem</p>
                  </div>
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>

            {/* Colar texto diretamente */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cole o texto diretamente</Label>
              <Textarea
                value={extractedText}
                onChange={handleTextChange}
                placeholder="Cole aqui o texto do Google Calendar, PDF ou documento...&#10;&#10;Formato Google Calendar:&#10;12&#10;Nov. 2025, Sex&#10;16:00 - 17:00&#10;Nome do Evento&#10;&#10;Ou formato simples:&#10;03/12/2025 10:00 - Sessão com João"
                className="min-h-[120px] font-mono text-sm"
              />
              <Button
                onClick={() => {
                  if (extractedText.trim()) {
                    parseTextForAppointments(extractedText);
                  } else {
                    toast.error('Cole algum texto para analisar');
                  }
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600"
                disabled={!extractedText.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar Texto
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Cole ou edite o texto abaixo e clique em "Analisar" para detectar agendamentos.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Texto do documento</Label>
              <Textarea
                value={extractedText}
                onChange={handleTextChange}
                placeholder="Cole aqui o texto copiado do seu documento...&#10;&#10;Exemplo:&#10;03/12/2025 10:00 - Sessão com João Silva&#10;05/12/2025 14:30 - Avaliação Maria Santos"
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button onClick={handleAnalyzeText} className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600">
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar Texto
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {parsedAppointments.length} agendamento(s) encontrado(s)
              </h3>
              <Button variant="outline" size="sm" onClick={() => setStep('review')}>
                Editar texto
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {parsedAppointments.map((apt, index) => (
                <Card key={index} className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-gray-400 hover:text-red-500"
                    onClick={() => removeAppointment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <CardContent className="p-4 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Título</Label>
                      <Input
                        value={apt.titulo}
                        onChange={(e) => updateAppointment(index, 'titulo', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data</Label>
                      <Input
                        type="date"
                        value={apt.data}
                        onChange={(e) => updateAppointment(index, 'data', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hora</Label>
                      <Input
                        type="time"
                        value={apt.hora}
                        onChange={(e) => updateAppointment(index, 'hora', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo de Sessão</Label>
                      <Select
                        value={apt.tipo}
                        onValueChange={(value) => updateAppointment(index, 'tipo', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sessão">Sessão</SelectItem>
                          <SelectItem value="avaliação">Avaliação</SelectItem>
                          <SelectItem value="consulta">Consulta</SelectItem>
                          <SelectItem value="consulta inicial">Consulta Inicial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Terapeuta</Label>
                      <Input
                        value={apt.terapeuta || ''}
                        onChange={(e) => updateAppointment(index, 'terapeuta', e.target.value)}
                        placeholder="Nome do terapeuta"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ID Manual do Cliente</Label>
                      <Input
                        value={apt.id_manual || ''}
                        onChange={(e) => updateAppointment(index, 'id_manual', e.target.value)}
                        placeholder="ID manual"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Estado</Label>
                      <Select
                        value={apt.estado || 'pendente'}
                        onValueChange={(value) => updateAppointment(index, 'estado', value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="concluído">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Cor</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="color"
                          value={apt.cor || '#3B82F6'}
                          onChange={(e) => updateAppointment(index, 'cor', e.target.value)}
                          className="h-8 w-16 p-1"
                        />
                        <Input
                          type="text"
                          value={apt.cor || '#3B82F6'}
                          onChange={(e) => updateAppointment(index, 'cor', e.target.value)}
                          placeholder="#3B82F6"
                          className="h-8 text-sm flex-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {parsedAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum agendamento detectado</p>
                <Button variant="link" onClick={() => setStep('review')}>
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          {step === 'confirm' && parsedAppointments.length > 0 && (
            <Button
              onClick={handleImport}
              disabled={isImporting}
              className="bg-gradient-to-r from-teal-500 to-cyan-600"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A importar...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Importar {parsedAppointments.length} agendamento(s)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarImport;

