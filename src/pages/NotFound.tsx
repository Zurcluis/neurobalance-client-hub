import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Página não encontrada | NeuroBalance';
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card-glass p-8 max-w-md w-full text-center">
        <h1 className="text-6xl font-bold gradient-heading mb-4">404</h1>
        <p className="text-xl text-neuro-gray mb-6">Página não encontrada</p>
        <p className="mb-8">
          A página que procura não existe ou foi movida.
        </p>
        <Link to="/">
          <Button className="bg-neuro-primary hover:bg-neuro-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
