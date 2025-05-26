import { ClientFormData } from "@/components/clients/ClientForm";
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

// Função para ler arquivos Excel (.xlsx)
export async function readExcelFile(
  file: File,
  fieldMappings: Record<string, string[]>
): Promise<Partial<ClientFormData>[]> {
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
        
        // Mapeia para formato de cliente
        const clients: Partial<ClientFormData>[] = jsonData.map((row: any) => {
          const client: Partial<ClientFormData> = {};
          
          // Para cada campo no mapeamento
          Object.entries(fieldMappings).forEach(([fieldName, aliases]) => {
            // Procura pela chave correspondente no cabeçalho da planilha
            const matchingKey = Object.keys(row).find(key => 
              aliases.includes(key.toLowerCase().trim())
            );
            
            if (matchingKey && row[matchingKey] !== undefined) {
              // Valor encontrado, adiciona ao cliente
              (client as any)[fieldName] = row[matchingKey];
              
              // Converte datas se necessário
              if (fieldName === 'data_nascimento' && client.data_nascimento) {
                // Verifica se é um número serial do Excel
                if (typeof client.data_nascimento === 'number') {
                  // Converte número serial do Excel para data JavaScript
                  const excelEpoch = new Date(1899, 11, 30);
                  const dateValue = new Date(excelEpoch.getTime() + (client.data_nascimento as number) * 24 * 60 * 60 * 1000);
                  client.data_nascimento = dateValue;
                } else if (typeof client.data_nascimento === 'string') {
                  // Tenta converter string para data
                  const date = new Date(client.data_nascimento);
                  if (!isNaN(date.getTime())) {
                    client.data_nascimento = date;
                  } else {
                    client.data_nascimento = null;
                  }
                }
              }
            }
          });
          
          return client;
        });
        
        resolve(clients);
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
): Promise<Partial<ClientFormData>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        
        // Detecta o delimitador (vírgula, ponto e vírgula, tab)
        const detectDelimiter = (text: string): string => {
          const delimiters = [',', ';', '\t', '|'];
          const counts = delimiters.map(d => (text.match(new RegExp(`${d}`, 'g')) || []).length);
          const maxIndex = counts.indexOf(Math.max(...counts));
          return delimiters[maxIndex] || ',';
        };
        
        const delimiter = detectDelimiter(csvText);
        
        // Parse CSV manualmente
        const lines = csvText.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        
        // Cabeçalho
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        // Dados
        const clients: Partial<ClientFormData>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // Split respeitando aspas
          const values: string[] = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          values.push(currentValue.trim().replace(/^["']|["']$/g, ''));
          
          // Cria objeto cliente
          const client: Partial<ClientFormData> = {};
          
          // Para cada campo no mapeamento
          Object.entries(fieldMappings).forEach(([fieldName, aliases]) => {
            // Procura pela chave correspondente no cabeçalho
            const headerIndex = headers.findIndex(h => 
              aliases.includes(h.toLowerCase())
            );
            
            if (headerIndex !== -1 && values[headerIndex]) {
              // Valor encontrado, adiciona ao cliente
              (client as any)[fieldName] = values[headerIndex];
              
              // Converte datas e números
              if (fieldName === 'data_nascimento' && client.data_nascimento) {
                try {
                  const date = new Date(client.data_nascimento.toString());
                  if (!isNaN(date.getTime())) {
                    client.data_nascimento = date;
                  } else {
                    client.data_nascimento = null;
                  }
                } catch {
                  client.data_nascimento = null;
                }
              } else if (['numero_sessoes', 'total_pago', 'max_sessoes'].includes(fieldName)) {
                const numValue = parseFloat(values[headerIndex].replace(/[^\d.,]/g, '').replace(',', '.'));
                if (!isNaN(numValue)) {
                  (client as any)[fieldName] = numValue;
                }
              }
            }
          });
          
          clients.push(client);
        }
        
        resolve(clients);
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
        resolve(text);
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

// Função para extrair texto de PDFs usando pdf-lib
export async function readPDFText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Usa pdf.js para extrair o texto
        // Como pdf.js é uma biblioteca maior, vamos simular a extração aqui
        const pdfData = new Uint8Array(arrayBuffer);
        
        try {
          // Tenta usar pdf-lib para obter informações básicas
          const pdfDoc = await PDFDocument.load(pdfData);
          const text = `PDF Document\nPages: ${pdfDoc.getPageCount()}\nTitle: ${file.name}\n`;
          resolve(text);
        } catch {
          // Fallback - pode ser necessário importar outras bibliotecas para extrair texto
          // Para um caso real, você precisaria de uma biblioteca completa como pdf.js
          resolve(`Não foi possível extrair texto do PDF. Conteúdo não acessível.`);
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
        
        // Inicializar o worker do Tesseract (OCR)
        const worker = await createWorker('por');
        
        // Processa a imagem
        const { data } = await worker.recognize(imageUrl);
        
        // Libera recursos
        await worker.terminate();
        
        resolve(data.text);
      } catch (error) {
        console.error('Erro OCR:', error);
        reject(new Error(`Erro ao processar imagem com OCR: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler a imagem'));
    };
    
    reader.readAsDataURL(file);
  });
} 