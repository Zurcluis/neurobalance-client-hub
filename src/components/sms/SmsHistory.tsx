import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Search, RefreshCw, CheckCircle2, XCircle, Clock, Send, Trash2 } from 'lucide-react';
import { useSms } from '@/hooks/useSms';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

interface SmsHistoryProps {
    clientId?: number;
}

const SmsHistory = ({ clientId }: SmsHistoryProps) => {
    const { smsHistory, fetchSmsHistory, isLoadingHistory, deleteSms } = useSms();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchSmsHistory(clientId);
    }, [fetchSmsHistory, clientId]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return (
                    <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Entregue
                    </Badge>
                );
            case 'sent':
                return (
                    <Badge className="bg-blue-100 text-blue-700 gap-1">
                        <Send className="h-3 w-3" />
                        Enviado
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                        <Clock className="h-3 w-3" />
                        Pendente
                    </Badge>
                );
            case 'failed':
            case 'undelivered':
                return (
                    <Badge className="bg-red-100 text-red-700 gap-1">
                        <XCircle className="h-3 w-3" />
                        Falhou
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        {status}
                    </Badge>
                );
        }
    };

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'manual':
                return <Badge variant="outline">Manual</Badge>;
            case 'automatico':
                return <Badge variant="outline" className="border-blue-500 text-blue-600">Automático</Badge>;
            case 'lembrete':
                return <Badge variant="outline" className="border-purple-500 text-purple-600">Lembrete</Badge>;
            default:
                return <Badge variant="outline">{tipo}</Badge>;
        }
    };

    const filteredHistory = smsHistory.filter((sms) => {
        const matchesSearch = searchQuery === '' ||
            sms.mensagem.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sms.telefone.includes(searchQuery) ||
            sms.clientes?.nome.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || sms.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#3f9094]" />
                    <span>Histórico de SMS</span>
                    <Badge variant="secondary">{filteredHistory.length}</Badge>
                </CardTitle>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSmsHistory(clientId)}
                    disabled={isLoadingHistory}
                >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Pesquisar por mensagem, telefone ou cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                            <SelectItem value="sent">Enviado</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="failed">Falhou</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Lista de SMS */}
                {isLoadingHistory ? (
                    <div className="py-8 text-center">
                        <RefreshCw className="h-8 w-8 text-gray-300 mx-auto mb-2 animate-spin" />
                        <p className="text-gray-500">A carregar histórico...</p>
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {filteredHistory.map((sms) => (
                            <div
                                key={sms.id}
                                className="p-4 rounded-lg bg-[#c5cfce]/40 border border-[#B1D4CF]/30 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {getStatusBadge(sms.status)}
                                        {getTipoBadge(sms.tipo)}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {format(parseISO(sms.enviado_em), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                                    </span>
                                </div>

                                <div className="mb-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <span className="font-medium">Para:</span>
                                        <span>{sms.telefone}</span>
                                        {sms.clientes && (
                                            <span className="text-[#3f9094]">
                                                ({sms.clientes.id_manual || ''} {sms.clientes.nome})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white/50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                                    {sms.mensagem}
                                </div>

                                {sms.erro && (
                                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                        <strong>Erro:</strong> {sms.erro}
                                    </div>
                                )}

                                {sms.twilio_sid && (
                                    <div className="mt-2 text-xs text-gray-400">
                                        SID: {sms.twilio_sid}
                                    </div>
                                )}

                                {/* Botão Apagar */}
                                <div className="mt-3 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteSms(sms.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Apagar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum SMS encontrado</p>
                        {searchQuery || statusFilter !== 'all' ? (
                            <p className="text-sm text-gray-400 mt-1">Tenta ajustar os filtros</p>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SmsHistory;
