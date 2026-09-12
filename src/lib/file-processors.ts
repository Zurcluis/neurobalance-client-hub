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

    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
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

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

interface ExtractedPdfLead {
  nome: string;
  email: string;
  telefone: string;
  data_evento: string;
  origem_campanha: string;
  tipo: string;
  status: string;
  observacoes?: string;
}

const parseDateFromText = (text: string): string | null => {
  const months: Record<string, string> = {
    janeiro: '01', fev: '02', fevereiro: '02',
    março: '03', marco: '03', mar: '03', abril: '04',
    maio: '05', mai: '05', junho: '06', jun: '06', julho: '07', jul: '07',
    agosto: '08', ago: '08', setembro: '09', set: '09', outubro: '10', out: '10',
    novembro: '11', nov: '11', dezembro: '12', dez: '12'
  };

  const matchPt = text.match(/(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)\s+de\s+(\d{4})/i);
  if (matchPt) {
    const day = matchPt[1].padStart(2, '0');
    const month = months[matchPt[2].toLowerCase()] || '01';
    const year = matchPt[3];
    return `${year}-${month}-${day}`;
  }

  const matchNum = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchNum) {
    return `${matchNum[1]}-${matchNum[2].padStart(2, '0')}-${matchNum[3].padStart(2, '0')}`;
  }

  return null;
};

interface PdfToken {
  str: string;
  x: number;
  y: number;
}

// Ruído típico de tabelas de seguimento de leads (colunas Estado/Ação)
const PDF_NOISE_TOKENS = /^(contactar|contacto|contacto telefónico|estado|notas|email|nome|pendente|fechado|ganho|novo|email|#|n\/a|-{1,})$/i;

const isPhonePart = (token: string): boolean => {
  const t = token.trim();
  if (!t) return false;
  if (PDF_NOISE_TOKENS.test(t)) return false;
  if (/%|:/.test(t)) return false;
  const digits = (t.match(/\d/g) || []).length;
  return /^[\d+()\s.-]+$/.test(t) && digits >= 2;
};

const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  // Número PT (móvel/fixo) com ou sem indicativo 351
  const exact = digits.match(/^(?:351)?(9\d{8}|2\d{8})$/);
  if (exact) return exact[1];
  const partial = digits.match(/(9\d{8})/);
  return partial ? partial[1] : raw.trim();
};

// Agrupa os itens de uma "linha" da tabela em sub-linhas de texto (células
// costumam quebrar telefone/nome em várias linhas) e devolve os tokens em
// ordem de leitura: de cima para baixo e da esquerda para a direita.
const buildReadingOrderTokens = (rowItems: PdfToken[]): PdfToken[] => {
  const lines = new Map<number, PdfToken[]>();
  for (const item of rowItems) {
    let lineY: number | null = null;
    for (const existingY of lines.keys()) {
      if (Math.abs(existingY - item.y) <= 3) {
        lineY = existingY;
        break;
      }
    }
    if (lineY === null) {
      lineY = item.y;
      lines.set(lineY, []);
    }
    lines.get(lineY)!.push(item);
  }

  return Array.from(lines.entries())
    .sort((a, b) => b[0] - a[0]) // topo primeiro
    .flatMap(([, items]) => items.sort((a, b) => a.x - b.x)); // esquerda → direita
};

// Processar arquivos PDF e extrair tabelas e registos de leads
export const processPdfFile = async (file: File): Promise<ProcessedFileData> => {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    if (typeof window !== 'undefined') {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      } catch {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '5.4.149'}/build/pdf.worker.min.mjs`;
      }
    }
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const extractedLeads: ExtractedPdfLead[] = [];
    let fullRawText = '';
    let currentDate = new Date().toISOString().split('T')[0];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];

      const pageRaw = items.map(it => it.str).join(' ');
      fullRawText += `--- Página ${pageNum} ---\n` + pageRaw + '\n\n';

      // Agrupar itens por coordenada Y (tolerância +-10 para suportar quebras de linha em células)
      const rowsMap = new Map<number, any[]>();
      for (const item of items) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        let matchedY: number | null = null;
        for (const existingY of rowsMap.keys()) {
          if (Math.abs(existingY - y) <= 10) {
            matchedY = existingY;
            break;
          }
        }
        if (matchedY === null) {
          matchedY = y;
          rowsMap.set(matchedY, []);
        }
        rowsMap.get(matchedY)!.push({
          str: item.str.trim(),
          x: Math.round(item.transform[4]),
          y
        });
      }

      // Ordenar linhas do topo para o fundo (Y decrescente)
      const sortedY = Array.from(rowsMap.keys()).sort((a, b) => b - a);

      for (const y of sortedY) {
        const rowItems = rowsMap.get(y)!;
        // Tokens em ordem de leitura (células podem ter texto quebrado em várias linhas)
        const tokens = buildReadingOrderTokens(rowItems);
        const rowText = tokens.map(it => it.str).join(' ');

        // Detetar cabeçalhos de data na tabela
        const detectedDate = parseDateFromText(rowText);
        if (detectedDate) {
          currentDate = detectedDate;
          continue;
        }

        // Procurar email na linha
        const emailToken = tokens.find(it => /@/.test(it.str));
        if (emailToken) {
          const emailMatch = emailToken.str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
          if (!emailMatch) continue;
          const email = emailMatch[1].trim().toLowerCase();

          const emailIdx = tokens.indexOf(emailToken);

          // Nome: tokens antes do email, excluindo ruído, índices e fragmentos de telefone
          const nameParts: string[] = [];
          for (let i = 0; i < emailIdx; i++) {
            const t = tokens[i];
            if (t === emailToken) break;
            const s = t.str.trim();
            if (!s) continue;
            if (PDF_NOISE_TOKENS.test(s)) continue;
            if (isPhonePart(s)) continue;
            if (/^#?\d+(\.\d+)?$/.test(s)) continue; // índices (#) e números
            nameParts.push(s);
          }
          const name = nameParts.join(' ');

          // Telefone: todos os fragmentos numéricos da linha (inclui células
          // quebradas em várias sub-linhas, ex: "+351 914 965" + "277")
          const phoneParts = tokens
            .filter(it => it !== emailToken && it.x >= 50 && isPhonePart(it.str))
            .map(it => it.str.trim());
          const phone = phoneParts.length > 0 ? normalizePhone(phoneParts.join(' ')) : '';

          if (!name && !phone) continue;

          // Estado: Pendente/Fechado/Ganho quando existir na linha
          const rowStatus = /fechado|ganho/i.test(rowText)
            ? 'Contactado'
            : 'Novo';

          extractedLeads.push({
            nome: name.trim() || 'Lead',
            email,
            telefone: phone,
            data_evento: currentDate,
            origem_campanha: 'Email',
            tipo: 'Lead',
            status: rowStatus
          });
        }
      }
    }

    // Fallback se não encontrou linhas tabulares com email
    if (extractedLeads.length === 0) {
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      const lines = fullRawText.split('\n');
      for (const line of lines) {
        const matches = line.match(emailRegex);
        if (matches) {
          for (const email of matches) {
            const phoneMatch = line.match(/(?:\+351\s*)?(?:9[1236]\d{7}|2\d{8}|(?:\+351[\s-]*)?9\d(?:\s*\d){7,8})/);
            const parts = line.split(email);
            const potentialName = parts[0]
              .split(/\s+/)
              .filter(word => word && !PDF_NOISE_TOKENS.test(word) && !isPhonePart(word) && !/^#?\d+$/.test(word))
              .join(' ')
              .trim();
            extractedLeads.push({
              nome: potentialName || 'Lead',
              email: email.trim().toLowerCase(),
              telefone: phoneMatch ? normalizePhone(phoneMatch[0]) : '',
              data_evento: currentDate,
              origem_campanha: 'Email',
              tipo: 'Lead',
              status: 'Novo'
            });
          }
        }
      }
    }

    if (extractedLeads.length > 0) {
      const tableData: any[][] = [
        ['Nome', 'Email', 'Telefone', 'Data do Evento', 'Origem', 'Tipo', 'Status'],
        ...extractedLeads.map(lead => [
          lead.nome,
          lead.email,
          lead.telefone,
          lead.data_evento,
          lead.origem_campanha,
          lead.tipo,
          lead.status
        ])
      ];

      return {
        type: 'pdf',
        content: tableData,
        raw: fullRawText,
        fileName: file.name
      };
    }

    const textLines = fullRawText.split('\n').filter(l => l.trim()).map(l => [l]);
    return {
      type: 'pdf',
      content: textLines.length > 0 ? textLines : [['Documento PDF sem texto extraível']],
      raw: fullRawText,
      fileName: file.name
    };
  } catch (error) {
    console.error(`Erro ao processar arquivo PDF:`, error);
    throw new Error(`Erro ao processar arquivo PDF: ${error instanceof Error ? error.message : error}`);
  }
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

// ─── Helpers de cabeçalhos e normalização ──────────────────────────────────

const stripAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normKey = (value: unknown) => stripAccents(String(value ?? '')).toLowerCase().trim();

// Datas podem chegar como texto ("2026-09-04"), dd/mm/yyyy ou serial do Excel
const normalizeDateValue = (value: unknown): string => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return new Date().toISOString().split('T')[0];
  }
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().split('T')[0];
  }
  const str = String(value).trim();
  const iso = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  return str;
};

// Encontra a linha de cabeçalhos reais (ficheiros costumam ter título/summário antes)
const findHeaderRowIndex = (rows: unknown[], keywords: string[], scanLimit = 25): number => {
  const limit = Math.min(rows.length, scanLimit);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const keys = row.map(normKey).filter(Boolean);
    if (keys.length === 0) continue;
    const hits = keywords.filter(k => keys.some(key => key.includes(k)));
    if (hits.length >= 2) return i;
  }
  return -1;
};

// Detectar tipo de dados baseado no conteúdo
export const detectDataType = (content: any[]): 'marketing' | 'lead-compra' | 'unknown' => {
  if (!content || content.length === 0) return 'unknown';

  // Analisar as primeiras linhas (ficheiros reais têm título/summário antes dos cabeçalhos)
  const scanText = content
    .slice(0, 10)
    .map(row => (Array.isArray(row) ? row.join('|') : typeof row === 'string' ? row : JSON.stringify(row)))
    .join('|')
    .toLowerCase();

  // Leads têm sempre colunas de contacto; campanhas não têm
  const hasContactCols = ['email', 'telefone', 'telemovel', 'contacto'].some(k => scanText.includes(k));
  const marketingKeywords = [
    'campanha', 'campaign', 'marketing', 'investimento', 'leads',
    'reunioes', 'vendas', 'receita', 'cpl', 'cac', 'roi', 'roas'
  ];
  const hasMarketingKeywords = marketingKeywords.some(keyword => scanText.includes(keyword));

  if (hasContactCols) return 'lead-compra';
  if (hasMarketingKeywords) return 'marketing';

  return 'unknown';
};

// Mapear dados do Excel para formato de Marketing
export const mapToMarketingData = (excelData: any[]): any[] => {
  if (!excelData || excelData.length < 2) return [];

  const headerIndex = findHeaderRowIndex(excelData, ['campanha', 'campaign', 'investimento', 'leads', 'receita']);
  if (headerIndex === -1) return [];

  const headers = (excelData[headerIndex] as any[]).map(normKey);
  const rows = excelData.slice(headerIndex + 1);

  return rows.map((row: any[]) => {
    const obj: any = {};
    headers.forEach((key, index) => {
      const value = row[index];
      const set = (field: string, val: any) => {
        if (val === undefined || val === null || String(val).trim() === '') return;
        if (obj[field] === undefined || obj[field] === '') obj[field] = val;
      };

      if (key.includes('nome') || key.includes('campanha')) set('nome', value);
      else if (key.includes('origem')) set('origem', value);
      else if (key.includes('mes')) set('mes', value);
      else if (key.includes('ano')) set('ano', value);
      else if (key.includes('investimento')) set('investimento', parseFloat(value) || 0);
      else if (key.includes('leads')) set('leads', parseInt(value) || 0);
      else if (key.includes('reunioes')) set('reunioes', parseInt(value) || 0);
      else if (key.includes('vendas')) set('vendas', parseInt(value) || 0);
      else if (key.includes('receita')) set('receita', parseFloat(value) || 0);
    });

    return obj;
  }).filter(item => item.nome); // Filtrar apenas itens com nome
};

// Mapear dados do Excel para formato de Lead Compra
export const mapToLeadCompraData = (excelData: any[]): any[] => {
  if (!excelData || excelData.length < 2) return [];

  // Localizar a linha de cabeçalhos real (ficheiros têm título/summário antes)
  const headerIndex = findHeaderRowIndex(excelData, ['nome', 'email', 'telefone', 'contacto']);
  if (headerIndex === -1) return [];

  const headers = (excelData[headerIndex] as any[]).map(normKey);
  const rows = excelData.slice(headerIndex + 1);

  return rows.map((row: any[]) => {
    const obj: any = {};
    headers.forEach((key, index) => {
      const value = row[index];
      // Manter o primeiro valor não vazio (evita colunas tipo "Data Último Contacto"
      // a sobrescrever "Data", etc.)
      const set = (field: string, val: any) => {
        if (val === undefined || val === null || String(val).trim() === '') return;
        if (obj[field] === undefined || obj[field] === '') obj[field] = val;
      };

      if (key === '#' || key === '') return; // coluna de índice
      if (key.includes('nome')) set('nome', value);
      else if (key.includes('email') || key.includes('e-mail')) set('email', value);
      else if (key.includes('telefon') || key === 'contacto') set('telefone', value);
      else if (key.includes('cidade') || key.includes('morada')) set('cidade', value);
      else if (key.includes('idade')) set('idade', parseInt(value) || 25);
      else if (key.includes('genero')) set('genero', value || 'Feminino');
      else if (key.includes('valor')) set('valor_pago', parseFloat(value) || 0);
      else if (key.includes('data')) set('data_evento', value);
      else if (key.includes('canal') || key.includes('origem')) set('origem_campanha', value);
      else if (key.includes('status') || key.includes('estado')) set('status', value);
      else if (key.includes('observ') || key.includes('notas')) set('observacoes', value);
      else if (key.includes('tipo')) set('tipo', String(value).toLowerCase().includes('compra') ? 'Compra' : 'Lead');
    });

    if (!obj.tipo) obj.tipo = 'Lead';
    obj.data_evento = normalizeDateValue(obj.data_evento);

    const validLeadCompraStatuses = [
      'Iniciou Neurofeedback',
      'Não vai avançar',
      'Vão marcar consulta mais à frente',
      'Vai iniciar NFB mas ainda não marcou primeira consulta',
      'Continuam Neurofeedback',
      'Falta resultados da avaliação',
      'Marcaram avaliação',
      'Começa mais tarde'
    ];

    const rawStatus = stripAccents(String(obj.status || '')).toLowerCase();
    const isFresh = rawStatus === '' || rawStatus === 'novo' || rawStatus === 'pendente' ||
      !validLeadCompraStatuses.includes(String(obj.status || '').trim());
    if (isFresh) {
      obj.landing_status = 'Novo';
      obj.status = 'Marcaram avaliação';
    }
    if (!obj.idade) obj.idade = 25;
    if (!obj.genero) obj.genero = 'Feminino';
    if (obj.valor_pago === undefined) obj.valor_pago = 0;
    if (!obj.origem_campanha) obj.origem_campanha = 'Email';

    return obj;
  })
  // Só linhas com dados reais (descarta título, summários e linhas vazias)
  .filter(item => item.nome && (item.email || item.telefone));
};
