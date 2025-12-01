import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import MarketingTokenManager from '@/components/marketing/MarketingTokenManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const MarketingTokensPage = () => {
    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-8 w-8 text-[#3f9094]" />
                        Gestão de Acessos ao Marketing
                    </h1>
                    <p className="text-gray-600 mt-2">Crie e gerencie links de acesso temporários para a equipa de marketing</p>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        <strong>Acesso Restrito:</strong> Apenas administradores principais podem criar e gerenciar tokens de acesso.
                        Os utilizadores que acedem via link gerado NÃO terão acesso a esta página.
                    </AlertDescription>
                </Alert>

                <MarketingTokenManager />
            </div>
        </PageLayout>
    );
};

export default MarketingTokensPage;
