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
            const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes if any
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.log('URL:', supabaseUrl);
    // Key is secret, don't log it
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findClient() {
    console.log('Searching for client...');

    // Search by exact ID match (user said "sim ele existe" and image showed ID: 73C)
    // or by name match
    const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, id_manual')
        .or('nome.ilike.%João Gomes%,id_manual.eq.73C');

    if (error) {
        console.error('Error searching client:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found clients:', JSON.stringify(data, null, 2));
    } else {
        console.log('No client found. Attempting broader search...');
        const { data: broadData } = await supabase
            .from('clientes')
            .select('id, nome, id_manual')
            .ilike('nome', '%João%');
        console.log('Broader search results:', JSON.stringify(broadData, null, 2));
    }
}

findClient();
