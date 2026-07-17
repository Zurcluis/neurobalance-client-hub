-- Alterar constraint de role para incluir 'partner'
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_role_check;

ALTER TABLE admins ADD CONSTRAINT admins_role_check 
CHECK (role IN ('admin', 'assistant', 'partner'));
