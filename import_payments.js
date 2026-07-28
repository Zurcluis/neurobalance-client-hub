import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually parse .env.local
try {
    const envConfig = readFileSync(join(__dirname, '.env.local'), 'utf8');
    for (const line of envConfig.split('\n')) {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
            if (key && value) {
                process.env[key] = value;
            }
        }
    }
} catch (e) {
    console.error('Error reading .env.local', e.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = 128; // João Pedro Teixeira Gomes (73C)

const payments = [
    {
        id_cliente: CLIENT_ID,
        data: '2025-11-22',
        valor: 55.01,
        descricao: 'NFB',
        tipo: 'Multibanco',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '210',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    },
    {
        id_cliente: CLIENT_ID,
        data: '2025-11-29',
        valor: 55.01,
        descricao: 'NFB',
        tipo: 'Multibanco',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '220',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    },
    {
        id_cliente: CLIENT_ID,
        data: '2025-12-01',
        valor: 55.01,
        descricao: 'NFB',
        tipo: 'Multibanco',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '222',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    },
    {
        id_cliente: CLIENT_ID,
        data: '2025-12-13',
        valor: 55.01,
        descricao: 'NFB',
        tipo: 'Multibanco',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '234',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    },
    {
        id_cliente: CLIENT_ID,
        data: '2025-12-20',
        valor: 55.01,
        descricao: 'NFB',
        tipo: 'Multibanco',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '244',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    },
    {
        id_cliente: CLIENT_ID,
        data: '2026-01-10',
        valor: 55.01,
        descricao: 'NFB',
        tipo: 'Multibanco',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '267',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    },
    {
        id_cliente: CLIENT_ID,
        data: '2026-02-03',
        valor: 55.01,
        descricao: 'NFB (5 euros a mais)',
        tipo: 'Numerário',
        nif: '293113335',
        tipo_servico: 'Serviços',
        numero_fatura: '257',
        valor_base: 44.72,
        valor_iva: 10.29,
        retencao: 0,
        estado: 'pago'
    }
];

async function importPayments() {
    console.log(`Starting import of ${payments.length} payments for client ID ${CLIENT_ID}...`);

    const { data, error } = await supabase
        .from('pagamentos')
        .insert(payments)
        .select();

    if (error) {
        console.error('Error importing payments:', error);
    } else {
        console.log('Successfully imported payments:', data.length);
        console.log(JSON.stringify(data, null, 2));
    }
}

importPayments();
