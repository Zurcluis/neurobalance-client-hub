-- Create storage buckets for client files and reports
-- Note: This requires the Supabase Storage extension to be enabled

-- First ensure the storage extension is enabled
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Setup storage buckets if they don't exist yet
DO $$
BEGIN
    -- Create bucket for client files
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES (
        'ficheiros',
        'Ficheiros de Clientes',
        false, -- not public by default
        false, -- no avif autodetection
        52428800, -- 50MB limit
        '{image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain}'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create bucket for client reports
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES (
        'relatorios',
        'Relatórios de Clientes',
        false, -- not public by default
        false, -- no avif autodetection
        20971520, -- 20MB limit
        '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain}'
    )
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Add bucket security policies
-- Files Bucket: Only authenticated users can access
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
    'Authenticated users can read files',
    '(auth.role() = ''authenticated'')',
    'ficheiros'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
    'Authenticated users can upload files',
    '(auth.role() = ''authenticated'')',
    'ficheiros'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

-- Reports Bucket: Only authenticated users can access
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
    'Authenticated users can read reports',
    '(auth.role() = ''authenticated'')',
    'relatorios'
)
ON CONFLICT (name, bucket_id) DO NOTHING;

INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
    'Authenticated users can upload reports',
    '(auth.role() = ''authenticated'')',
    'relatorios'
)
ON CONFLICT (name, bucket_id) DO NOTHING; 