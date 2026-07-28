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

async function applyMigration() {
    console.log('Adding NIF column to table "clientes"...');

    const { error } = await supabase.rpc('exec_sql', {
        sql_query: 'ALTER TABLE clientes ADD COLUMN IF NOT EXISTS nif text; COMMENT ON COLUMN clientes.nif IS \'Número de Identificação Fiscal do cliente\';'
    });

    if (error) {
        // If RPC fails (not enabled), we'll have to rely on the fact that the user will apply the .sql file
        // But let's try a direct query if possible (schema mutations via API are usually restricted)
        console.warn('RPC exec_sql failed, expected if not enabled in Supabase. Please ensure  is applied.');
        console.error(error);
    } else {
        console.log('Migration applied successfully via RPC.');
    }
}

applyMigration();
