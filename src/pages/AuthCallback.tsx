import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (!session) {
          throw new Error("No session found after authentication");
        }
        
        // Wait a moment to ensure the session is properly set
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Double check the session is still valid
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession) {
          throw new Error("Session validation failed");
        }

        // Redirect to home page after successful login
        navigate("/");
        toast.success("Successfully logged in!");
      } catch (error: any) {
        console.error("Auth callback error:", error);
        toast.error(error.message || "Failed to complete authentication");
        navigate("/login", {
          state: {
            error: "Authentication failed. Please try again."
          }
        });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold">Completing authentication...</h2>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback; 