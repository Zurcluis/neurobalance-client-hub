import { ExpenseImportData } from "@/components/finances/ExpenseImport";
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

// Função para ler arquivos Excel (.xlsx)
export async function readExcelFile(
  file: File,
  fieldMappings: Record<string, string[]>
): Promise<Partial<ExpenseImportData>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume primeira planilha
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
          resolve([]);
          return;
        }
        
        // Mapeia os campos com base nos cabeçalhos da planilha
        const result: Partial<ExpenseImportData>[] = [];
        const headers = Object.keys(jsonData[0]);
        
        const fieldMap: Record<string, string> = {};
        
        // Associa os cabeçalhos aos campos de destino
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase().trim();
          
          // Verifica cada campo de mapeamento
          for (const [field, aliases] of Object.entries(fieldMappings)) {
            if (aliases.some(alias => lowerHeader.includes(alias.toLowerCase()))) {
              fieldMap[header] = field;
              break;
            }
          }
        });
        
        // Percorre todas as linhas de dados
        jsonData.forEach((row: any) => {
          const expense: Partial<ExpenseImportData> = {};
          
          // Mapeia os valores usando o mapeamento de campos
          Object.entries(row).forEach(([header, value]) => {
            const field = fieldMap[header];
            if (field) {
              (expense as any)[field] = value;
            }
          });
          
          // Adiciona somente se tiver dados significativos
          if (Object.keys(expense).length > 0) {
            result.push(expense);
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Excel: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo Excel'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Função para ler arquivos CSV
export async function readCSVFile(
  file: File,
  fieldMappings: Record<string, string[]>
): Promise<Partial<ExpenseImportData>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        if (!csvText) {
          resolve([]);
          return;
        }
        
        // Converte o CSV para array de objetos
        const lines = csvText.split(/\r?\n/);
        if (lines.length <= 1) {
          resolve([]);
          return;
        }
        
        // Separa os cabeçalhos (primeira linha)
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Mapeia os cabeçalhos aos campos de destino
        const fieldMap: Record<string, string> = {};
        headers.forEach((header, index) => {
          const lowerHeader = header.toLowerCase().trim();
          
          // Verifica cada campo de mapeamento
          for (const [field, aliases] of Object.entries(fieldMappings)) {
            if (aliases.some(alias => lowerHeader.includes(alias.toLowerCase()))) {
              fieldMap[index.toString()] = field;
              break;
            }
          }
        });
        
        // Processa cada linha de dados
        const result: Partial<ExpenseImportData>[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const expense: Partial<ExpenseImportData> = {};
          
          // Associa valores aos campos mapeados
          values.forEach((value, index) => {
            const field = fieldMap[index.toString()];
            if (field && value) {
              (expense as any)[field] = value;
            }
          });
          
          // Adiciona somente se tiver dados significativos
          if (Object.keys(expense).length > 0) {
            result.push(expense);
          }
        }
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo CSV: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo CSV'));
    };
    
    reader.readAsText(file);
  });
}

// Função para ler arquivos de texto
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        resolve(text || '');
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo de texto: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo de texto'));
    };
    
    reader.readAsText(file);
  });
}

// Função para extrair texto de PDFs
export async function readPDFText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Usa pdf-lib para obter informações básicas
        try {
          const pdfData = new Uint8Array(arrayBuffer);
          const pdfDoc = await PDFDocument.load(pdfData);
          
          // Em uma implementação real, você utilizaria uma biblioteca como pdf.js
          // para extrair o texto completo. Aqui estamos apenas fornecendo um placeholder.
          const pageCount = pdfDoc.getPageCount();
          
          // Retorna um texto informativo - em produção, extrairia o texto real
          resolve(`PDF com ${pageCount} página(s)\nNome: ${file.name}\n`);
        } catch (pdfError) {
          // Fallback simples
          resolve(`Não foi possível extrair texto do PDF. Por favor, use outro formato.`);
        }
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo PDF: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo PDF'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Função para extrair texto de imagens usando OCR (Tesseract.js)
export async function extractTextFromImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const imageUrl = e.target?.result as string;
        
        try {
          // Inicializar o worker do Tesseract para português
          const worker = await createWorker('por');
          
          // Processa a imagem usando o Tesseract OCR
          const { data } = await worker.recognize(imageUrl);
          
          // Libera recursos
          await worker.terminate();
          
          // Retorna o texto extraído
          resolve(data.text || 'Nenhum texto reconhecido na imagem.');
        } catch (ocrError) {
          // Fallback caso o OCR falhe
          console.error('Erro OCR:', ocrError);
          resolve('Não foi possível extrair texto da imagem usando OCR.');
        }
      } catch (error) {
        console.error('Erro geral:', error);
        reject(new Error(`Erro ao processar imagem: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler a imagem'));
    };
    
    reader.readAsDataURL(file);
  });
} 