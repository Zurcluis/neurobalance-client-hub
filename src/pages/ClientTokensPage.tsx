import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import ClientTokenManager from '@/components/clients/ClientTokenManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const ClientTokensPage = () => {
    return (
        <PageLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Gestão de Acessos de Clientes"
                    description="Crie e gerencie links de acesso temporários para clientes"
                    icon={<Shield className="h-5 w-5" />}
                />

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
