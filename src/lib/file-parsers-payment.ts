import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface RawPaymentData {
    data?: string;
    cliente?: string;
    nif?: string;
    tipologia?: string;
    descricao?: string;
    numero_fatura?: string;
    prestacao?: string;
    valor_base?: number;
    valor_iva?: number;
    retencao?: number;
    valor_total?: number;
    estado?: string;
    metodo_pagamento?: string;
    _rawData?: any; // Para debugging
}

// Mapeamento de colunas baseado na imagem do usuário e variações comuns
const COLUMN_MAPPING: Record<string, string[]> = {
    data: ['data', 'date', 'dia', 'dt.'],
    cliente: ['cliente', 'nome', 'client', 'nome do cliente'],
    nif: ['nif', 'contribuinte', 'vat', 'tax id'],
    tipologia: ['tipologia', 'tipo', 'type', 'categoria'],
    descricao: ['descrição', 'descricao', 'description', 'obs'],
    numero_fatura: ['nº fatura', 'n. fatura', 'fatura', 'invoice', 'doc. nº', 'documento'],
    prestacao: ['prestação', 'prestacao', 'installment'],
    valor_base: ['base', 'valor base', 'net amount', 'iliquido'],
    valor_iva: ['iva', 'valor iva', 'vat amount', 'imposto'],
    retencao: ['retenção', 'retencao', 'retention', 'irs'],
    valor_total: ['total', 'valor total', 'amount', 'valor', 'soma'],
    estado: ['estado', 'status', 'situação', 'situacao'],
    metodo_pagamento: ['método recebimento', 'metodo recebimento', 'pagamento', 'payment method', 'forma pagamento']
};

/**
 * Normaliza uma string de cabeçalho para comparação
 */
const normalizeHeader = (header: string): string => {
    return header?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
};

/**
 * Encontra a chave de mapeamento para um cabeçalho de coluna
 */
const findColumnKey = (header: string): string | null => {
    const normalized = normalizeHeader(header);

    for (const [key, variations] of Object.entries(COLUMN_MAPPING)) {
        if (variations.some(v => normalized.includes(v) || v === normalized)) {
            return key;
        }
    }
    return null;
};

/**
 * Lê arquivo Excel e extrai dados de pagamento
 */
export const readPaymentExcel = async (file: File): Promise<RawPaymentData[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Converte para JSON array de arrays para facilitar a busca do cabeçalho
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // Tenta encontrar a linha de cabeçalho
                let headerRowIndex = 0;
                let columnMap: Record<number, string> = {}; // índice -> chave (ex: 0 -> 'data', 1 -> 'cliente')
                let maxMatches = 0;

                // Procura nas primeiras 10 linhas pela linha que tem mais correspondências de cabeçalho
                for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                    const row = jsonData[i];
                    const currentMap: Record<number, string> = {};
                    let matches = 0;

                    row.forEach((cell, index) => {
                        if (cell) {
                            const key = findColumnKey(cell.toString());
                            if (key) {
                                currentMap[index] = key;
                                matches++;
                            }
                        }
                    });

                    if (matches > maxMatches) {
                        maxMatches = matches;
                        headerRowIndex = i;
                        columnMap = currentMap;
                    }
                }

                // Se encontrou poucas correspondências, assume a primeira linha
                if (maxMatches < 2) {
                    // Fallback: tenta mapear a primeira linha novamente sendo menos estrito ou apenas assume ordem padrão se necessário
                    // Por enquanto, vamos manter o que achou ou vazio
                }

                const rawPayments: RawPaymentData[] = [];

                // Começa a ler dados após a linha de cabeçalho
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    // Pula linhas vazias
                    if (!row || row.length === 0) continue;

                    const payment: RawPaymentData = { _rawData: row };
                    let hasData = false;

                    // Mapeia os dados usando o mapa de colunas descoberto
                    Object.entries(columnMap).forEach(([indexStr, key]) => {
                        const index = parseInt(indexStr);
                        const value = row[index];

                        if (value !== undefined && value !== null && value !== '') {
                            hasData = true;

                            if (key === 'data') {
                                // Tratamento de datas do Excel
                                if (value instanceof Date) {
                                    payment.data = value.toISOString().split('T')[0];
                                } else {
                                    // Tentar parsear string ou número de data excel
                                    payment.data = String(value);
                                }
                            } else if (['valor_base', 'valor_iva', 'retencao', 'valor_total'].includes(key)) {
                                // Limpeza de valores monetários
                                if (typeof value === 'number') {
                                    payment[key as keyof RawPaymentData] = value as any;
                                } else if (typeof value === 'string') {
                                    // Remove símbolo de moeda e converte vírgula para ponto
                                    const cleanVal = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
                                    if (!isNaN(cleanVal)) {
                                        payment[key as keyof RawPaymentData] = cleanVal as any;
                                    }
                                }
                            } else {
                                payment[key as keyof RawPaymentData] = String(value).trim() as any;
                            }
                        }
                    });

                    if (hasData) {
                        rawPayments.push(payment);
                    }
                }

                resolve(rawPayments);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

/**
 * Lê arquivo CSV
 */
export const readPaymentCSV = async (file: File): Promise<RawPaymentData[]> => {
    // Reutilizar lógica simples, convertendo para estrutura similar ao Excel se necessário
    // Por brevidade, implementação similar será feita se solicitado explicitamente, 
    // mas muitas vezes o XLSX lê CSVs bem também.
    return readPaymentExcel(file); // XLSX lida bem com CSV geralmente
};


/**
 * Extrai texto de imagem usando Tesseract.js (OCR básico no frontend)
 */
export const extractTextFromPaymentImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        Tesseract.recognize(
            file,
            'por', // Português
            { logger: m => console.log(m) }
        ).then(({ data: { text } }) => {
            resolve(text);
        }).catch(reject);
    });
};


/**
 * Placeholder para leitura de PDF
 * (Implementação robusta de PDF -> Tabela é complexa no frontend puro, 
 * geralmente converte-se para texto e usa-se regex)
 */
export const readPaymentPDF = async (file: File): Promise<string> => {
    // Implementação básica: extrair todo o texto
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\\n';
    }

    return fullText;
};

/**
 * Parser de texto bruto (vindo de OCR ou PDF) para tentar identificar pagamentos
 * Baseado em Regex para linhas comuns de faturas/relatórios
 */
export const parseRawPaymentText = (text: string): RawPaymentData[] => {
    const lines = text.split('\\n');
    const payments: RawPaymentData[] = [];

    // Exemplo de heurística simples: procurar linhas com formato de data e valor
    // Isso é muito falível sem IA, mas serve como fallback
    const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const moneyRegex = /(\d+[.,]\d{2})\s?€?/;

    lines.forEach(line => {
        const dateMatch = line.match(dateRegex);
        const moneyMatch = line.match(moneyRegex);

        if (dateMatch && moneyMatch) {
            payments.push({
                data: dateMatch[1],
                valor_total: parseFloat(moneyMatch[1].replace(',', '.')),
                descricao: line // Salva a linha toda para o usuário decidir
            });
        }
    });

    return payments;
}
