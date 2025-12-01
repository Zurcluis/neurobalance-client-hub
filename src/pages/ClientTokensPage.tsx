import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ClientTokenManager from '@/components/clients/ClientTokenManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const ClientTokensPage = () => {
    return (
        <PageLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="h-8 w-8 text-[#3f9094]" />
                        Gestão de Acessos de Clientes
                    </h1>
                    <p className="text-gray-600 mt-2">Crie e gerencie links de acesso temporários para clientes</p>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        <strong>Acesso Restrito:</strong> Apenas administradores principais podem criar e gerenciar tokens de acesso.
                        Os clientes que acedem via link gerado terão acesso apenas ao seu dashboard pessoal.
                    </AlertDescription>
                </Alert>

                <ClientTokenManager />
            </div>
        </PageLayout>
    );
};

export default ClientTokensPage;
