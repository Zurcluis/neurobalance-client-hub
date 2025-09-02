import * as XLSX from 'xlsx';

export interface ProcessedFileData {
  type: 'excel' | 'word' | 'pdf' | 'csv';
  content: any[];
  raw: string;
  fileName: string;
}

// Processar arquivos Excel (.xlsx, .xls)
export const processExcelFile = async (file: File): Promise<ProcessedFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pegar a primeira aba
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Converter para string para exibição
        const csvString = XLSX.utils.sheet_to_csv(worksheet);
        
        resolve({
          type: 'excel',
          content: jsonData,
          raw: csvString,
          fileName: file.name
        });
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Excel: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
};

// Processar arquivos CSV
export const processCsvFile = async (file: File): Promise<ProcessedFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const csvData = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
        
        resolve({
          type: 'csv',
          content: csvData,
          raw: text,
          fileName: file.name
        });
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo CSV: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
};

// Processar arquivos Word (.docx) - Versão simplificada
export const processWordFile = async (file: File): Promise<ProcessedFileData> => {
  // Para agora, vamos tratar Word como texto simples
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        resolve({
          type: 'word',
          content: lines,
          raw: text,
          fileName: file.name
        });
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Word: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
};

// Processar arquivos PDF - Versão simplificada (placeholder)
export const processPdfFile = async (file: File): Promise<ProcessedFileData> => {
  // Para agora, retornamos um placeholder
  return Promise.resolve({
    type: 'pdf',
    content: [['Processamento de PDF em desenvolvimento']],
    raw: 'Processamento de PDF em desenvolvimento',
    fileName: file.name
  });
};

// Função principal para processar qualquer tipo de arquivo
export const processFile = async (file: File): Promise<ProcessedFileData> => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  switch (fileExtension) {
    case 'xlsx':
    case 'xls':
      return processExcelFile(file);
    
    case 'csv':
      return processCsvFile(file);
    
    case 'docx':
    case 'doc':
      return processWordFile(file);
    
    case 'pdf':
      return processPdfFile(file);
    
    default:
      throw new Error(`Tipo de arquivo não suportado: ${fileExtension}. Suportados: Excel (.xlsx, .xls), CSV (.csv), Word (.docx), PDF (.pdf)`);
  }
};

// Detectar tipo de dados baseado no conteúdo
export const detectDataType = (content: any[]): 'marketing' | 'lead-compra' | 'unknown' => {
  if (!content || content.length === 0) return 'unknown';
  
  // Converter primeira linha para string se for array
  const firstRow = Array.isArray(content[0]) ? content[0].join('|').toLowerCase() : 
                   typeof content[0] === 'string' ? content[0].toLowerCase() : 
                   JSON.stringify(content[0]).toLowerCase();
  
  // Palavras-chave para Marketing
  const marketingKeywords = [
    'campanha', 'campaign', 'marketing', 'investimento', 'leads', 
    'reunioes', 'vendas', 'receita', 'origem', 'cpl', 'cac', 'roi', 'roas'
  ];
  
  // Palavras-chave para Lead Compra
  const leadCompraKeywords = [
    'nome', 'email', 'telefone', 'telemóvel', 'cidade', 'idade', 
    'genero', 'género', 'valor', 'compra', 'lead', 'evento'
  ];
  
  const hasMarketingKeywords = marketingKeywords.some(keyword => 
    firstRow.includes(keyword)
  );
  
  const hasLeadCompraKeywords = leadCompraKeywords.some(keyword => 
    firstRow.includes(keyword)
  );
  
  if (hasMarketingKeywords && !hasLeadCompraKeywords) return 'marketing';
  if (hasLeadCompraKeywords && !hasMarketingKeywords) return 'lead-compra';
  if (hasLeadCompraKeywords) return 'lead-compra'; // Priorizar lead-compra se ambos
  
  return 'unknown';
};

// Mapear dados do Excel para formato de Marketing
export const mapToMarketingData = (excelData: any[]): any[] => {
  if (!excelData || excelData.length < 2) return [];
  
  const headers = excelData[0] as string[];
  const rows = excelData.slice(1);
  
  return rows.map((row: any[]) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      const key = header?.toString().toLowerCase().trim();
      const value = row[index];
      
      // Mapear campos comuns
      if (key?.includes('nome') || key?.includes('campanha')) obj.nome = value;
      if (key?.includes('origem')) obj.origem = value;
      if (key?.includes('mes') || key?.includes('mês')) obj.mes = value;
      if (key?.includes('ano')) obj.ano = value;
      if (key?.includes('investimento')) obj.investimento = parseFloat(value) || 0;
      if (key?.includes('leads')) obj.leads = parseInt(value) || 0;
      if (key?.includes('reunioes') || key?.includes('reuniões')) obj.reunioes = parseInt(value) || 0;
      if (key?.includes('vendas')) obj.vendas = parseInt(value) || 0;
      if (key?.includes('receita')) obj.receita = parseFloat(value) || 0;
    });
    
    return obj;
  }).filter(item => item.nome); // Filtrar apenas itens com nome
};

// Mapear dados do Excel para formato de Lead Compra
export const mapToLeadCompraData = (excelData: any[]): any[] => {
  if (!excelData || excelData.length < 2) return [];
  
  const headers = excelData[0] as string[];
  const rows = excelData.slice(1);
  
  return rows.map((row: any[]) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      const key = header?.toString().toLowerCase().trim();
      const value = row[index];
      
      // Mapear campos comuns
      if (key?.includes('nome')) obj.nome = value;
      if (key?.includes('email') || key?.includes('e-mail')) obj.email = value;
      if (key?.includes('telefone') || key?.includes('telemóvel') || key?.includes('contacto')) obj.telefone = value;
      if (key?.includes('cidade')) obj.cidade = value;
      if (key?.includes('idade')) obj.idade = parseInt(value) || null;
      if (key?.includes('genero') || key?.includes('género')) obj.genero = value;
      if (key?.includes('valor')) obj.valor_pago = parseFloat(value) || 0;
      if (key?.includes('data')) obj.data_evento = value;
      if (key?.includes('tipo') || key?.includes('evento')) obj.tipo = value?.toString().toLowerCase().includes('lead') ? 'Lead' : 'Compra';
    });
    
    return obj;
  }).filter(item => item.nome); // Filtrar apenas itens com nome
};
