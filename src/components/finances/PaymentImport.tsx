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
    Image as ImageIcon,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
    readPaymentExcel,
    readPaymentCSV,
    extractTextFromPaymentImage,
    readPaymentPDF,
    parseRawPaymentText,
    RawPaymentData
} from '@/lib/file-parsers-payment';
import { usePaymentMatching } from '@/hooks/usePaymentMatching';

// Estrutura final do pagamento para importar
export interface PaymentImportData {
    id_cliente: number | null;
    nome_cliente_original: string; // Nome que veio no arquivo
    nif_original: string; // NIF que veio no arquivo
    data: string;
    valor_total: number;
    valor_base?: number;
    valor_iva?: number;
    retencao?: number;
    descricao: string;
    tipologia: string;
    numero_fatura?: string;
    estado: string;
    metodo_pagamento: string;
    isValid: boolean;
    validationErrors: string[];
}

interface PaymentImportProps {
    onImportComplete: (payments: PaymentImportData[]) => void;
    onCancel: () => void;
}

const ALLOWED_FILE_TYPES = {
    'image/png': { icon: <ImageIcon className="h-8 w-8 text-purple-500" />, label: 'Imagem PNG' },
    'image/jpeg': { icon: <ImageIcon className="h-8 w-8 text-purple-500" />, label: 'Imagem JPEG' },
    'application/pdf': { icon: <File className="h-8 w-8 text-red-500" />, label: 'Documento PDF' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        icon: <FileSpreadsheet className="h-8 w-8 text-green-500" />,
        label: 'Planilha Excel'
    },
    'text/csv': { icon: <FileSpreadsheet className="h-8 w-8 text-green-500" />, label: 'Arquivo CSV' },
};



const PaymentImport: React.FC<PaymentImportProps> = ({
    onImportComplete,
    onCancel
}) => {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [extractedData, setExtractedData] = useState<PaymentImportData[]>([]);
    const [currentTab, setCurrentTab] = useState('upload');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { findClient, isLoading: isLoadingClients } = usePaymentMatching();

    // Manipulador de upload de arquivos
    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            newFiles.forEach(file => {
                if (file.type in ALLOWED_FILE_TYPES ||
                    (file.name.endsWith('.csv') && file.type === '') || // Alguns browsers não detectam CSV
                    file.name.endsWith('.xlsx')) {
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

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Converte RawPaymentData em PaymentImportData com validação
    const processRawData = (rawData: RawPaymentData[]): PaymentImportData[] => {
        return rawData.map(raw => {
            const clientMatch = findClient(raw.cliente, raw.nif);
            const validationErrors: string[] = [];

            // Validações básicas
            if (!raw.data) validationErrors.push('Data ausente');
            if (!raw.valor_total) validationErrors.push('Valor total ausente');
            if (!clientMatch) validationErrors.push('Cliente não encontrado no sistema');

            return {
                id_cliente: clientMatch?.id || null,
                nome_cliente_original: raw.cliente || 'Desconhecido',
                nif_original: raw.nif || '',
                data: raw.data || new Date().toISOString().split('T')[0],
                valor_total: raw.valor_total || 0,
                valor_base: raw.valor_base,
                valor_iva: raw.valor_iva,
                retencao: raw.retencao,
                descricao: raw.descricao || 'Pagamento Importado',
                tipologia: raw.tipologia || 'Serviços',
                numero_fatura: raw.numero_fatura,
                estado: raw.estado?.toLowerCase() || 'pago',
                metodo_pagamento: raw.metodo_pagamento || 'Multibanco',
                isValid: validationErrors.length === 0,
                validationErrors
            };
        });
    };

    const processFiles = async () => {
        setIsUploading(true);
        setProgress(0);
        setErrors([]);
        const newErrors: string[] = [];
        const allExtractedPayments: PaymentImportData[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setProgress(Math.round((i / files.length) * 100));

                try {
                    let rawPayments: RawPaymentData[] = [];

                    if (file.name.endsWith('.xlsx')) {
                        rawPayments = await readPaymentExcel(file);
                    } else if (file.name.endsWith('.csv') || file.type === 'text/csv') {
                        rawPayments = await readPaymentCSV(file);
                    } else if (file.type.startsWith('image/')) {
                        const text = await extractTextFromPaymentImage(file);
                        rawPayments = parseRawPaymentText(text);
                    } else if (file.type === 'application/pdf') {
                        const text = await readPaymentPDF(file);
                        rawPayments = parseRawPaymentText(text);
                    }

                    const processed = processRawData(rawPayments);
                    allExtractedPayments.push(...processed);

                } catch (err) {
                    console.error(`Erro ao processar ${file.name}:`, err);
                    newErrors.push(`Erro no arquivo ${file.name}: ${(err as Error).message}`);
                }
            }

            setExtractedData(allExtractedPayments);
            setErrors(newErrors);

            if (allExtractedPayments.length > 0) {
                setCurrentTab('preview');
                toast.success(`${allExtractedPayments.length} pagamentos processados.`);
            } else if (newErrors.length > 0) {
                toast.error('Erros ao processar arquivos.');
            } else {
                toast.warning('Nenhum pagamento encontrado nos arquivos.');
            }

        } catch (err) {
            console.error('Erro geral:', err);
            toast.error('Falha no processamento.');
        } finally {
            setIsUploading(false);
            setProgress(100);
        }
    };

    const handleFinalImport = () => {
        const validPayments = extractedData.filter(p => p.isValid);
        if (validPayments.length === 0) {
            toast.error('Nenhum pagamento válido para importar.');
            return;
        }
        onImportComplete(validPayments);
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="space-y-4">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Carregar Arquivos</TabsTrigger>
                    <TabsTrigger value="preview" disabled={extractedData.length === 0}>
                        Revisão e Importação
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Selecione os arquivos</CardTitle>
                            <CardDescription>
                                Suporte para Excel (.xlsx) com colunas: Data, Cliente, Valor, Fatura, etc.
                                Imagens e PDFs têm suporte experimental.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                onClick={triggerFileInput}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="h-10 w-10 text-gray-400 mb-4" />
                                <p className="text-sm text-gray-600 font-medium">Clique para selecionar ou arraste arquivos</p>
                                <p className="text-xs text-gray-400 mt-2">XLSX, CSV, PNG, JPG, PDF</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    multiple
                                    accept=".xlsx,.csv,.png,.jpg,.jpeg,.pdf"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {files.length > 0 && (
                                <div className="mt-6 space-y-2">
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                            <div className="flex items-center gap-3">
                                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                                <span className="text-sm font-medium">{file.name}</span>
                                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeFile(idx)}>
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isUploading && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Processando...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            )}

                            {errors.length > 0 && (
                                <Alert variant="destructive" className="mt-4">
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
                            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                            <Button
                                onClick={processFiles}
                                disabled={files.length === 0 || isUploading || isLoadingClients}
                                className="bg-[#3f9094] hover:bg-[#2A5854] text-white"
                            >
                                {isLoadingClients ? 'Carregando Clientes...' : 'Processar'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Resultados da Extração</h3>
                        <Badge variant="outline" className="text-sm">
                            {extractedData.filter(p => p.isValid).length} válidos de {extractedData.length}
                        </Badge>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {extractedData.map((item, idx) => (
                            <Card key={idx} className={`border-l-4 ${item.isValid ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900">{item.nome_cliente_original}</p>
                                                {!item.isValid && item.validationErrors.includes('Cliente não encontrado no sistema') && (
                                                    <Badge variant="destructive" className="text-[10px]">Cliente não identificado</Badge>
                                                )}
                                                {item.id_cliente && (
                                                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 hover:bg-green-200">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Vinculado
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{item.descricao} • {item.nif_original || 'Sem NIF'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#3f9094]">€ {item.valor_total.toFixed(2)}</p>
                                            <p className="text-xs text-gray-400">{item.data}</p>
                                        </div>
                                    </div>

                                    {!item.isValid && (
                                        <div className="mt-2 bg-red-50 p-2 rounded text-xs text-red-600 flex flex-col gap-1">
                                            {item.validationErrors.map((err, i) => (
                                                <span key={i}>• {err}</span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setCurrentTab('upload')}>Voltar</Button>
                        <Button
                            onClick={handleFinalImport}
                            className="bg-[#3f9094] hover:bg-[#2A5854] text-white"
                            disabled={extractedData.filter(p => p.isValid).length === 0}
                        >
                            Importar {extractedData.filter(p => p.isValid).length} Itens
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PaymentImport;
