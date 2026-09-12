import { useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import MarketingTokenManager from '@/components/marketing/MarketingTokenManager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

const MarketingTokensPage = () => {
    useEffect(() => {
        document.title = 'Acessos ao Marketing | NeuroBalance';
    }, []);

    return (
        <PageLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Gestão de Acessos ao Marketing"
                    description="Crie e faça a gestão de links de acesso temporários para a equipa de marketing"
                    icon={<Shield className="h-5 w-5" />}
                />

                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>Acesso Restrito:</strong> apenas administradores principais podem criar e gerir
                        tokens de acesso. Os utilizadores que acedem via link gerado não terão acesso a esta
                        página.
                    </AlertDescription>
                </Alert>

                <MarketingTokenManager />
            </div>
        </PageLayout>
    );
};

export default MarketingTokensPage;
