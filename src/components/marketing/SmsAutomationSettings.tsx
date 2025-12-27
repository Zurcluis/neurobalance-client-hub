import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { useAppointments } from '@/hooks/useAppointments';
import { useSms } from '@/hooks/useSms';
import { toast } from 'sonner';
import { MessageSquare, Save, Calendar, Send, Loader2, RotateCcw } from 'lucide-react';
import { format, addDays, isWithinInterval, parseISO } from 'date-fns';
import SmsHistory from '@/components/sms/SmsHistory';

const DEFAULT_SESSAO = 'Olá {apelido}, lembrete da sua {tipo} amanhã às {hora}. Dashboard: {link}';
const DEFAULT_EVAL = 'Olá {apelido}, lembrete da sua {tipo} amanhã às {hora}. Dashboard: {link}';

export const SmsAutomationSettings: React.FC = () => {
    const supabase = useSupabaseClient();
    const { appointments, isLoading: appointmentsLoading } = useAppointments();
    const { sendManualSms, isSending } = useSms();

    const [isEnabled, setIsEnabled] = useState(false);
    const [sessionTemplate, setSessionTemplate] = useState(DEFAULT_SESSAO);
    const [evalTemplate, setEvalTemplate] = useState(DEFAULT_EVAL);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(true);
    const [phoneEdits, setPhoneEdits] = useState<Record<number, string>>({});
    const [sendingIds, setSendingIds] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchConfigs = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('app_configs')
                    .select('*')
                    .in('key', ['sms_automation_enabled', 'sms_template_sessao', 'sms_template_avaliacao']);

                if (error) throw error;

                data.forEach(config => {
                    if (config.key === 'sms_automation_enabled') setIsEnabled(config.value);
                    if (config.key === 'sms_template_sessao') setSessionTemplate(config.value);
                    if (config.key === 'sms_template_avaliacao') setEvalTemplate(config.value);
                });
                setIsSaved(true);
            } catch (error) {
                console.error('Error fetching configs:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfigs();
    }, [supabase]);

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updates = [
                { key: 'sms_automation_enabled', value: isEnabled },
                { key: 'sms_template_sessao', value: sessionTemplate },
                { key: 'sms_template_avaliacao', value: evalTemplate },
            ];

            const { error } = await supabase
                .from('app_configs')
                .upsert(updates);

            if (error) throw error;
            toast.success('Configurações de SMS guardadas com sucesso!');
            setIsSaved(true);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Erro ao guardar configurações. Verifique a consola.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = (type: 'sessao' | 'avaliacao') => {
        if (type === 'sessao') setSessionTemplate(DEFAULT_SESSAO);
        else setEvalTemplate(DEFAULT_EVAL);
        setIsSaved(false);
        toast.info('Template reposto (clique em Guardar para confirmar)');
    };

    const upcomingAppointments = appointments.filter(apt => {
        if (!apt.data) return false;
        const aptDate = parseISO(apt.data);
        const now = new Date();
        const fortyEightHoursLater = addDays(now, 2);
        return isWithinInterval(aptDate, { start: now, end: fortyEightHoursLater }) && apt.estado !== 'cancelado';
    });

    const handleQuickSend = async (apt: any) => {
        const phone = phoneEdits[apt.id] || apt.clientes?.telefone;
        const clientId = apt.id_cliente || apt.clientes?.id;

        if (!phone) {
            toast.error('Este cliente não tem um número de telefone associado.');
            return;
        }

        if (!clientId) {
            toast.error('Não foi possível identificar o ID do cliente para gerar o link.');
            return;
        }

        setSendingIds(prev => ({ ...prev, [apt.id]: true }));
        try {
            // Gerar token de acesso (Magic Link)
            const { data: token, error: tokenError } = await supabase.rpc('create_client_access_token', {
                client_id: clientId,
                expires_hours: 48 // 2 dias para o link do SMS
            });

            if (tokenError) {
                console.error('Erro na RPC create_client_access_token:', tokenError);
                throw tokenError;
            }

            // Construir mensagem com o link do dashboard do cliente
            const template = apt.tipo?.toLowerCase().includes('avaliação') ? evalTemplate : sessionTemplate;
            if (!template) return;

            const fullNome = apt.clientes?.nome || 'Cliente';
            const nomeParts = fullNome.trim().split(' ');
            const apelido = nomeParts.length > 1 ? nomeParts[nomeParts.length - 1] : fullNome;

            // Link seguro com token para o login do cliente
            const clientLink = `https://cms.neurobalance.pt/client-login?token=${token}`;

            const message = template
                .replace(/{nome}/g, fullNome)
                .replace(/{apelido}/g, apelido)
                .replace(/{tipo}/g, apt.tipo || 'Sessão')
                .replace(/{titulo}/g, apt.titulo || 'Sessão')
                .replace(/{hora}/g, apt.hora || '')
                .replace(/{link}/g, clientLink);

            // Enviar SMS
            const result = await sendManualSms(phone, message, apt.id, clientId);
            if (result.success) {
                toast.success('SMS enviado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao enviar SMS:', error);
            toast.error('Erro ao enviar SMS');
        } finally {
            setSendingIds(prev => ({ ...prev, [apt.id]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-[#3f9094]" />
                            <CardTitle>Configuração de Templates</CardTitle>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="sms-toggle"
                                    checked={isEnabled}
                                    onCheckedChange={(val) => {
                                        if (val) {
                                            const confirm = window.confirm('Tem a certeza que quer ativar a automação de SMS? As mensagens serão enviadas automaticamente para os clientes.');
                                            if (!confirm) return;
                                        }
                                        setIsEnabled(val);
                                        setIsSaved(false);
                                    }}
                                />
                                <Label htmlFor="sms-toggle" className="cursor-pointer">
                                    Automação {isEnabled ? 'Ativa' : 'Pausada'}
                                </Label>
                            </div>
                            {!isSaved && (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                    Alterações pendentes
                                </Badge>
                            )}
                        </div>
                    </div>
                    <CardDescription>
                        Personalize as mensagens automáticas. Use as variáveis em chavetas para preenchimento automático.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="sessao" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="sessao">Template de Sessão</TabsTrigger>
                            <TabsTrigger value="avaliacao">Template de Avaliação</TabsTrigger>
                        </TabsList>

                        <TabsContent value="sessao" className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <Label>Mensagem de Sessão</Label>
                                <Button variant="ghost" size="sm" onClick={() => handleReset('sessao')} className="h-8 text-xs gap-1">
                                    <RotateCcw className="h-3 w-3" /> Repor Padrão
                                </Button>
                            </div>
                            <Textarea
                                value={sessionTemplate}
                                onChange={(e) => { setSessionTemplate(e.target.value); setIsSaved(false); }}
                                placeholder="Olá {apelido}, {nome}..."
                                className="min-h-[100px] font-mono text-sm"
                            />
                            <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 border border-slate-100">
                                <strong>Pré-visualização:</strong> {sessionTemplate
                                    .replace(/{apelido}/g, 'Silva')
                                    .replace(/{nome}/g, 'João Silva')
                                    .replace(/{tipo}/g, 'Sessão')
                                    .replace(/{hora}/g, '10:00')
                                    .replace(/{titulo}/g, 'Fisioterapia')
                                    .replace(/{link}/g, 'cms.neurobalance.pt/client-login')}
                            </div>
                        </TabsContent>

                        <TabsContent value="avaliacao" className="space-y-4 pt-4">
                            <div className="flex justify-between items-center">
                                <Label>Mensagem de Avaliação</Label>
                                <Button variant="ghost" size="sm" onClick={() => handleReset('avaliacao')} className="h-8 text-xs gap-1">
                                    <RotateCcw className="h-3 w-3" /> Repor Padrão
                                </Button>
                            </div>
                            <Textarea
                                value={evalTemplate}
                                onChange={(e) => { setEvalTemplate(e.target.value); setIsSaved(false); }}
                                placeholder="Olá {apelido}, {nome}, agendamos a sua avaliação..."
                                className="min-h-[100px] font-mono text-sm"
                            />
                            <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 border border-slate-100">
                                <strong>Pré-visualização:</strong> {evalTemplate
                                    .replace(/{apelido}/g, 'Santos')
                                    .replace(/{nome}/g, 'Maria Santos')
                                    .replace(/{tipo}/g, 'Avaliação')
                                    .replace(/{hora}/g, '15:30')
                                    .replace(/{titulo}/g, 'Avaliação Biomecânica')
                                    .replace(/{link}/g, 'cms.neurobalance.pt/client-login')}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <footer className="flex items-center justify-between pt-2 border-t text-xs text-gray-400">
                        <div className="flex gap-4">
                            <span>{'{apelido}'} = Apelido</span>
                            <span>{'{nome}'} = Nome Completo</span>
                            <span>{'{tipo}'} = Tipo</span>
                            <span>{'{titulo}'} = Título Sessão</span>
                            <span>{'{hora}'} = Hora</span>
                        </div>
                        <Button onClick={handleSave} disabled={isLoading || isSaved} className="gap-2">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Guardar Alterações
                        </Button>
                    </footer>
                </CardContent>
            </Card >

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <CardTitle>Envio Manual (Próximas 48h)</CardTitle>
                    </div>
                    <CardDescription>
                        Lista de agendamentos próximos. Envie o SMS agora se não quiser esperar pela automação de 24h.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {appointmentsLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : upcomingAppointments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {upcomingAppointments.map((apt) => (
                                <div key={apt.id} className="group flex items-center justify-between p-3 border rounded-lg bg-white hover:border-primary/50 transition-colors shadow-sm">
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-sm truncate">{apt.clientes?.nome || 'Sem Nome'}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                type="text"
                                                className="h-7 text-xs w-36 bg-slate-50 border-slate-200"
                                                value={phoneEdits[apt.id] !== undefined ? phoneEdits[apt.id] : (apt.clientes?.telefone || '')}
                                                onChange={(e) => setPhoneEdits(prev => ({ ...prev, [apt.id]: e.target.value }))}
                                                placeholder="Telemóvel"
                                            />
                                            <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] uppercase">
                                                    {apt.tipo || 'Sessão'}
                                                </Badge>
                                                {format(parseISO(apt.data), 'dd/MM')} às {apt.hora}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary shrink-0 ml-2"
                                        onClick={() => handleQuickSend(apt)}
                                        disabled={isSending || sendingIds[apt.id]}
                                    >
                                        {sendingIds[apt.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                        Enviar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50/50">
                            <p className="text-gray-400 text-sm italic">Nenhum agendamento para as próximas 48h.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Histórico de SMS */}
            <SmsHistory />
        </div>
    );
};
