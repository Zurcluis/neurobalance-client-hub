import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    AlertTriangle,
    User,
    MessageSquare,
    ArrowLeft
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AppointmentData {
    id: number;
    titulo: string;
    data: string;
    hora: string;
    tipo: string;
    estado: string;
    cliente_nome: string;
}

interface TokenResponse {
    success: boolean;
    error?: string;
    already_used?: boolean;
    previous_action?: string;
    appointment?: AppointmentData;
}

const ConfirmAppointmentPage = () => {
    const { token } = useParams<{ token: string }>();
    const supabase = useSupabaseClient();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appointment, setAppointment] = useState<AppointmentData | null>(null);
    const [alreadyUsed, setAlreadyUsed] = useState(false);
    const [previousAction, setPreviousAction] = useState<string | null>(null);
    const [showCannotAttend, setShowCannotAttend] = useState(false);
    const [message, setMessage] = useState('');
    const [actionCompleted, setActionCompleted] = useState<'confirmed' | 'cannot_attend' | null>(null);

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!token) {
                setError('Token inválido');
                setLoading(false);
                return;
            }

            try {
                const { data, error: rpcError } = await supabase.rpc('get_appointment_by_token', {
                    p_token: token
                });

                if (rpcError) throw rpcError;

                const result = data as TokenResponse;

                if (!result.success) {
                    setError(result.error || 'Erro ao carregar agendamento');
                } else if (result.already_used) {
                    setAlreadyUsed(true);
                    setPreviousAction(result.previous_action || null);
                    setAppointment(result.appointment || null);
                } else {
                    setAppointment(result.appointment || null);
                }
            } catch (err: any) {
                console.error('Erro ao buscar agendamento:', err);
                setError('Erro ao carregar os dados do agendamento');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [token, supabase]);

    const handleConfirm = async () => {
        if (!token) return;

        setSubmitting(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('use_confirmation_token', {
                p_token: token,
                p_action: 'confirmed',
                p_message: null
            });

            if (rpcError) throw rpcError;

            const result = data as { success: boolean; error?: string };

            if (result.success) {
                setActionCompleted('confirmed');
                toast.success('Sessão confirmada com sucesso!');
            } else {
                setError(result.error || 'Erro ao confirmar');
            }
        } catch (err: any) {
            console.error('Erro ao confirmar:', err);
            toast.error('Erro ao confirmar sessão');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCannotAttend = async () => {
        if (!token) return;

        setSubmitting(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('use_confirmation_token', {
                p_token: token,
                p_action: 'cannot_attend',
                p_message: message || null
            });

            if (rpcError) throw rpcError;

            const result = data as { success: boolean; error?: string };

            if (result.success) {
                setActionCompleted('cannot_attend');
                toast.success('A clínica foi notificada. Entraremos em contacto brevemente.');
            } else {
                setError(result.error || 'Erro ao processar pedido');
            }
        } catch (err: any) {
            console.error('Erro ao processar:', err);
            toast.error('Erro ao processar pedido');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600">A carregar os dados da sessão...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 p-4">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Link Inválido</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <p className="text-sm text-gray-500">
                            Se precisar de ajuda, contacte a clínica directamente.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Already used state
    if (alreadyUsed && appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 p-4">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${previousAction === 'confirmed' ? 'bg-emerald-100' : 'bg-amber-100'
                            }`}>
                            {previousAction === 'confirmed'
                                ? <CheckCircle className="h-8 w-8 text-emerald-600" />
                                : <AlertTriangle className="h-8 w-8 text-amber-600" />
                            }
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {previousAction === 'confirmed' ? 'Sessão Já Confirmada' : 'Pedido Já Registado'}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {previousAction === 'confirmed'
                                ? 'Esta sessão já foi confirmada anteriormente.'
                                : 'Já recebemos o seu pedido de reagendamento.'
                            }
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4 text-left">
                            <p className="font-semibold text-gray-900">{appointment.titulo}</p>
                            <p className="text-sm text-gray-600">
                                {format(parseISO(appointment.data), "EEEE, d 'de' MMMM", { locale: ptBR })} às {appointment.hora}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Action completed state
    if (actionCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 p-4">
                <Card className="max-w-md w-full border-0 shadow-xl">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${actionCompleted === 'confirmed'
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500'
                            }`}>
                            {actionCompleted === 'confirmed'
                                ? <CheckCircle className="h-10 w-10 text-white" />
                                : <MessageSquare className="h-10 w-10 text-white" />
                            }
                        </div>

                        {actionCompleted === 'confirmed' ? (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessão Confirmada!</h2>
                                <p className="text-gray-600 mb-6">
                                    Obrigado por confirmar. Esperamos por si!
                                </p>
                                {appointment && (
                                    <div className="bg-emerald-50 rounded-xl p-4 text-left border border-emerald-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                            <span className="font-semibold text-emerald-800">
                                                {format(parseISO(appointment.data), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-emerald-600" />
                                            <span className="text-emerald-700">{appointment.hora}</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido Registado</h2>
                                <p className="text-gray-600 mb-6">
                                    A clínica foi notificada e entrará em contacto consigo brevemente para reagendar.
                                </p>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                    <p className="text-sm text-amber-800">
                                        Se precisar de algo urgente, contacte-nos directamente.
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Main confirmation view
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 p-4 py-8">
            <div className="max-w-md mx-auto">
                {/* Logo */}
                <div className="text-center mb-6">
                    <img
                        src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
                        alt="NeuroBalance"
                        className="h-16 w-auto mx-auto"
                    />
                </div>

                {/* Main Card */}
                <Card className="border-0 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white">
                        <h1 className="text-xl font-bold mb-1">Confirmação de Sessão</h1>
                        <p className="text-teal-100 text-sm">
                            Por favor confirme a sua presença
                        </p>
                    </div>

                    <CardContent className="p-6">
                        {appointment && (
                            <>
                                {/* Client greeting */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                                        <User className="h-6 w-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Olá,</p>
                                        <p className="font-semibold text-gray-900">{appointment.cliente_nome}</p>
                                    </div>
                                </div>

                                {/* Appointment details */}
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Data</p>
                                            <p className="font-semibold text-gray-900">
                                                {format(parseISO(appointment.data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                            <Clock className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Hora</p>
                                            <p className="font-semibold text-gray-900">{appointment.hora}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-200">
                                        <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                                            {appointment.tipo || appointment.titulo}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {!showCannotAttend ? (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleConfirm}
                                            disabled={submitting}
                                            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/30"
                                        >
                                            {submitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                <CheckCircle className="h-5 w-5 mr-2" />
                                            )}
                                            Confirmar Presença
                                        </Button>

                                        <Button
                                            onClick={() => setShowCannotAttend(true)}
                                            disabled={submitting}
                                            variant="outline"
                                            className="w-full h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
                                        >
                                            <XCircle className="h-4 w-4 mr-2 text-gray-500" />
                                            Não Posso Comparecer
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Button
                                            onClick={() => setShowCannotAttend(false)}
                                            variant="ghost"
                                            size="sm"
                                            className="mb-2"
                                        >
                                            <ArrowLeft className="h-4 w-4 mr-1" />
                                            Voltar
                                        </Button>

                                        <Alert className="bg-amber-50 border-amber-200">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-amber-800">
                                                A clínica será notificada e entrará em contacto para reagendar.
                                            </AlertDescription>
                                        </Alert>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Mensagem (opcional)</Label>
                                            <Textarea
                                                id="message"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Deixe uma mensagem ou sugestão de nova data..."
                                                className="min-h-[100px] resize-none"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleCannotAttend}
                                            disabled={submitting}
                                            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl"
                                        >
                                            {submitting ? (
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : (
                                                <MessageSquare className="h-5 w-5 mr-2" />
                                            )}
                                            Enviar Pedido de Reagendamento
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    NeuroBalance • Cuide da sua saúde
                </p>
            </div>
        </div>
    );
};

export default ConfirmAppointmentPage;
