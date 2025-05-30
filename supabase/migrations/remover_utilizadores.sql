    -- Remove from auth.users
    DELETE FROM auth.users 
    WHERE email = email_usuario;

    -- Remove from usuarios table
    DELETE FROM usuarios 
    WHERE email = email_usuario;