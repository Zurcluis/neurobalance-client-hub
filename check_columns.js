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

async function checkColumns() {
    console.log('Checking columns of table "clientes"...');

    // Querying information_schema is restricted in some Supabase setups via API
    // but let's try a simple select to see what comes back in the first row
    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching client row:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in "clientes":', Object.keys(data[0]).join(', '));
    } else {
        console.log('No data found in "clientes" to inspect columns.');
    }
}

checkColumns();
