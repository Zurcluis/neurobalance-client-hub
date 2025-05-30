-- Create initial admin user in Supabase Auth
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'geral.neurobalance@gmail.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  '',
  '',
  '',
  ''
);

-- Create initial admin user in our usuarios table
INSERT INTO usuarios (
  email,
  nome,
  role,
  ativo,
  senha_hash,
  criado_em,
  updated_at
) VALUES (
  'geral.neurobalance@gmail.com',
  'Administrador',
  'admin',
  true,
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW()
); 