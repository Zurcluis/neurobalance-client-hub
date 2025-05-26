import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { InfoIcon, HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const MonitoringPage = () => {
  return (
    <PageLayout>
      <h1 className="text-3xl font-bold gradient-heading mb-6">Monitorização de Sessão</h1>
      
      <div className="flex flex-col items-center justify-center py-12">
        <Alert className="max-w-lg mx-auto">
          <InfoIcon className="h-6 w-6 text-amber-500 mb-2" />
          <AlertTitle className="text-lg font-semibold mb-2">Funcionalidade Temporariamente Indisponível</AlertTitle>
          <AlertDescription>
            <p className="mb-4">
              A funcionalidade de monitorização de sessão está temporariamente indisponível.
              Estamos trabalhando em melhorias para proporcionar uma melhor experiência.
            </p>
            <p className="mb-4">
              Para registrar informações sobre as sessões, por favor utilize a aba "Sessões" 
              no perfil de cada cliente.
            </p>
            <div className="flex justify-center mt-6">
              <Link to="/">
                <Button className="flex items-center">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Voltar ao início
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </PageLayout>
  );
};

export default MonitoringPage;
 