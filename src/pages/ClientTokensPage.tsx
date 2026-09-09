import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import ClientTokenManager from '@/components/admin/ClientTokenManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const ClientTokensPage = () => {
    return (
        <PageLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Gestão de Acessos de Clientes"
                    description="Crie e faça a gestão de links de acesso temporários para clientes"
                    icon={<Shield className="h-5 w-5" />}
                />

                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>Acesso Restrito:</strong> apenas administradores principais podem criar e gerir
                        tokens de acesso. Os clientes que acedem via link gerado terão acesso apenas ao seu
                        dashboard pessoal.
                    </AlertDescription>
                </Alert>

                <ClientTokenManager />
            </div>
        </PageLayout>
    );
};

export default ClientTokensPage;
