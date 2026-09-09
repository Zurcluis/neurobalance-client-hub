import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import MarketingTokenManager from '@/components/marketing/MarketingTokenManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const MarketingTokensPage = () => {
    return (
        <PageLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Gestão de Acessos ao Marketing"
                    description="Crie e gerencie links de acesso temporários para a equipa de marketing"
                    icon={<Shield className="h-5 w-5" />}
                />

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
