import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const TOKEN_VALIDITY_HOURS = 24 * 30;
const TOKEN_VALIDITY_DAYS = 30;

type CopiedItem = 'token' | 'link';

interface ClientTokenPanelProps {
  clientId: number;
  className?: string;
}

const buildLoginUrl = (token: string) =>
  `${window.location.origin}/client-login?token=${token}`;

const createAccessToken = async (clientId: number): Promise<string> => {
  const { data, error } = await supabase.rpc('create_client_access_token', {
    client_id: clientId,
    expires_hours: TOKEN_VALIDITY_HOURS,
  });

  if (error) throw error;
  if (!data) throw new Error('O servidor não devolveu um token');
  return data;
};

const copyText = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return copyTextFallback(text);
    }
  }
  return copyTextFallback(text);
};

const copyTextFallback = (text: string): boolean => {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textArea);
    return ok;
  } catch {
    return false;
  }
};

const ClientTokenPanel: React.FC<ClientTokenPanelProps> = ({ clientId, className }) => {
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedItem, setCopiedItem] = useState<CopiedItem | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const copyWithFeedback = async (text: string, item: CopiedItem, successMessage: string) => {
    const ok = await copyText(text);
    if (!ok) {
      toast.error('Não foi possível copiar. Copie manualmente.');
      return;
    }
    setCopiedItem(item);
    toast.success(successMessage);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedItem(null), 2000);
  };

  const ensureToken = async (): Promise<string | null> => {
    if (activeToken) return activeToken;
    try {
      setIsGenerating(true);
      const token = await createAccessToken(clientId);
      setActiveToken(token);
      return token;
    } catch {
      toast.error('Erro ao gerar o token de acesso. Tente novamente.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateToken = async () => {
    const token = await ensureToken();
    if (!token) return;
    await copyWithFeedback(token, 'token', 'Token gerado e copiado');
  };

  const handleCopyLink = async () => {
    const token = await ensureToken();
    if (!token) return;
    await copyWithFeedback(buildLoginUrl(token), 'link', 'Link de acesso copiado');
  };

  const handleOpenPortal = async () => {
    const token = await ensureToken();
    if (!token) return;
    window.open(buildLoginUrl(token), '_blank', 'noopener');
  };

  const primaryButtonClass =
    'border-primary/40 text-primary hover:bg-primary/10 hover:text-primary';

  return (
    <Card className={cn('w-full max-w-md p-4 shadow-sm', className)}>
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">Acesso do Cliente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gere o token de entrada no portal do cliente.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full shrink-0',
                activeToken ? 'bg-emerald-500' : 'bg-muted-foreground/40'
              )}
            />
            <span className={activeToken ? 'text-foreground' : 'text-muted-foreground'}>
              {activeToken ? 'Token ativo' : 'Sem token gerado'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className={primaryButtonClass}
          onClick={handleGenerateToken}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : copiedItem === 'token' ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )}
          {isGenerating ? 'A gerar...' : copiedItem === 'token' ? 'Copiado' : 'Gerar token'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={primaryButtonClass}
          onClick={handleCopyLink}
          disabled={isGenerating}
        >
          {copiedItem === 'link' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedItem === 'link' ? 'Copiado' : 'Copiar link'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={primaryButtonClass}
          onClick={handleOpenPortal}
          disabled={isGenerating}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir portal
        </Button>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        O token é válido durante {TOKEN_VALIDITY_DAYS} dias a contar da geração.
      </p>
    </Card>
  );
};

export default ClientTokenPanel;
