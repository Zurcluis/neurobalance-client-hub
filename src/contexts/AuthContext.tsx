import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type Usuario = Database['public']['Tables']['usuarios']['Row'];

interface AuthContextType {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          return;
        }

        if (session && mounted) {
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Fetch user data from usuarios table
          const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', session.user.email)
            .single();
          
          if (usuarioError) {
            console.error('Error fetching user data:', usuarioError);
          } else if (usuarioData && mounted) {
            setUsuario(usuarioData);
          }
        }
      } catch (error) {
        console.error('Error in session check:', error);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        
        // Fetch user data from usuarios table
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        if (usuarioError) {
          console.error('Error fetching user data:', usuarioError);
        } else if (usuarioData && mounted) {
          setUsuario(usuarioData);
        }
      } else {
        setUser(null);
        setUsuario(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Update last login timestamp
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ 
            ultimo_login: new Date().toISOString() 
          })
          .eq('email', email);

        if (updateError) {
          console.error('Error updating last login:', updateError);
        }

        setUser(data.user);
        setIsAuthenticated(true);
        
        // Fetch user data from usuarios table
        const { data: usuarioData, error: usuarioError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .single();
        
        if (usuarioError) {
          console.error('Error fetching user data:', usuarioError);
        } else if (usuarioData) {
          setUsuario(usuarioData);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setUsuario(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 