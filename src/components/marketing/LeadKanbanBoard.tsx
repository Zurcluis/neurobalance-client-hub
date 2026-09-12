import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  Phone,
  MoreVertical,
  Trash2,
  Edit,
  MessageSquare,
  RefreshCw,
  User,
  Users,
  Search,
  Send,
  ExternalLink,
  Clock,
  MapPin,
  UserPlus,
  Upload,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { KANBAN_COLUMNS, LandingLead, LandingLeadStatus } from '@/types/landing-lead';
import { useLandingLeads } from '@/hooks/useLandingLeads';
import { LandingLeadForm } from '@/components/marketing/LandingLeadForm';
import KpiCard from '@/components/shared/KpiCard';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// ─── Lead Card ───────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: LandingLead;
  onDragStart: (e: React.DragEvent, lead: LandingLead) => void;
  onClick: (lead: LandingLead) => void;
  onEdit: (lead: LandingLead) => void;
  onDelete: (id: string) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onDragStart, onClick, onEdit, onDelete }) => {
  const nome = lead.nome || 'Sem nome';
  const email = (lead.email && !lead.email.includes('@neurobalance.local')) ? lead.email : 'Sem email';
  const telefone = lead.telefone || 'Sem telefone';
  const origem = lead.origem || 'Desconhecida';
  const showOrigem = origem !== 'Desconhecida';

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) return;
    onClick(lead);
  };

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(e, lead);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 cursor-grab hover:shadow-md transition-all duration-200 hover:border-teal-300 active:cursor-grabbing select-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0 pointer-events-none">
            {nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 pointer-events-none">
            <h4 className="font-medium text-gray-900 text-sm truncate">{nome}</h4>
            <p className="text-xs text-gray-500">
              {lead.created_at ? format(new Date(lead.created_at), 'dd MMM yyyy', { locale: pt }) : ''}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-radix-dropdown-menu-trigger>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick(lead); }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 text-xs text-gray-600 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3 text-teal-500 flex-shrink-0" />
          <span className="truncate">{email}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-teal-500 flex-shrink-0" />
          <span>{telefone}</span>
        </div>
      </div>

      {lead.observacoes && (
        <div className="mt-2 pt-2 border-t border-gray-100 pointer-events-none">
          <div className="flex items-start gap-1.5 text-xs text-gray-500">
            <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{lead.observacoes}</span>
          </div>
        </div>
      )}

      {showOrigem && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between pointer-events-none">
          <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
            {origem}
          </Badge>
        </div>
      )}
    </div>
  );
};

// ─── Kanban Column ───────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: { id: LandingLeadStatus; title: string; color: string };
  leads: LandingLead[];
  onDragStart: (e: React.DragEvent, lead: LandingLead) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: LandingLeadStatus) => void;
  onClickLead: (lead: LandingLead) => void;
  onEditLead: (lead: LandingLead) => void;
  onDeleteLead: (id: string) => void;
  onAddLeadToColumn?: (status: LandingLeadStatus) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column, leads, onDragStart, onDragOver, onDrop, onClickLead, onEditLead, onDeleteLead, onAddLeadToColumn,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the column itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e, column.id);
  };

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col bg-muted/60 dark:bg-gray-800/40 rounded-xl p-2 transition-all duration-200 ${
        isDragOver ? 'ring-2 ring-teal-400 bg-teal-50/50 dark:bg-teal-950/30' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2.5 h-2.5 flex-shrink-0 rounded-full ${column.color}`} />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-xs lg:text-sm truncate" title={column.title}>
            {column.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="secondary" className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0">
            {leads.length}
          </Badge>
          {onAddLeadToColumn && (
            <button
              type="button"
              onClick={() => onAddLeadToColumn(column.id)}
              className="h-5 w-5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-300 dark:hover:bg-teal-950/40 flex items-center justify-center transition-colors"
              title={`Adicionar lead em ${column.title}`}
              aria-label={`Adicionar lead em ${column.title}`}
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onDragStart={onDragStart}
            onClick={onClickLead}
            onEdit={onEditLead}
            onDelete={onDeleteLead}
          />
        ))}
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <User className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">Sem leads</p>
          </div>
        )}
      </div>
    </div>
  );
};

export interface LeadKanbanBoardProps {
  leads?: LandingLead[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddLead?: (data: Omit<LandingLead, 'id' | 'created_at' | 'updated_at'>) => Promise<LandingLead | void>;
  onUpdateStatus?: (id: string, status: LandingLeadStatus) => Promise<void>;
  onUpdateLead?: (id: string, data: Partial<LandingLead>) => Promise<LandingLead | void>;
  onDeleteLead?: (id: string) => Promise<void>;
  onImportClick?: () => void;
}

const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = (props) => {
  const internalHook = useLandingLeads();

  const leads = props.leads ?? internalHook.leads;
  const isLoading = props.isLoading ?? internalHook.isLoading;
  const fetchLeads = props.onRefresh ?? internalHook.fetchLeads;
  const addLead = props.onAddLead ?? internalHook.addLead;
  const updateLeadStatus = props.onUpdateStatus ?? internalHook.updateLeadStatus;
  const updateLead = props.onUpdateLead ?? internalHook.updateLead;
  const deleteLead = props.onDeleteLead ?? internalHook.deleteLead;
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLead, setDraggedLead] = useState<LandingLead | null>(null);
  const [selectedLead, setSelectedLead] = useState<LandingLead | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [createLeadStatus, setCreateLeadStatus] = useState<LandingLeadStatus | undefined>(undefined);
  const [editForm, setEditForm] = useState({ observacoes: '' });
  const [emailForm, setEmailForm] = useState({ assunto: '', mensagem: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Filter
  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(
      (lead) =>
        (lead.nome || '').toLowerCase().includes(term) ||
        (lead.email || '').toLowerCase().includes(term) ||
        (lead.telefone || '').includes(term),
    );
  }, [leads, searchTerm]);

  // Group by status
  const leadsByStatus = useMemo(() => {
    const grouped: Record<LandingLeadStatus, LandingLead[]> = {
      'Novo': [],
      'Contactado': [],
      'Agendou Avaliação': [],
      'Avaliação Realizada': [],
      'Iniciou Neurofeedback': [],
      'Não Avança': [],
    };

    filteredLeads.forEach((lead) => {
      if (grouped[lead.status] !== undefined) {
        grouped[lead.status].push(lead);
      } else {
        grouped['Novo'].push(lead);
      }
    });

    return grouped;
  }, [filteredLeads]);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, lead: LandingLead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('leadId', lead.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: LandingLeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const lead = draggedLead || leads.find(l => l.id === leadId);
    if (lead && lead.status !== newStatus) {
      await updateLeadStatus(lead.id, newStatus);
    }
    setDraggedLead(null);
  };

  // Lead actions
  const handleClickLead = (lead: LandingLead) => {
    setSelectedLead(lead);
    setIsEditingDetails(false);
    setEditForm({ observacoes: lead.observacoes || '' });
    setEmailForm({
      assunto: `Olá ${lead.nome || 'Cliente'} - NeuroBalance`,
      mensagem: `Olá ${lead.nome || ''},\n\nObrigado pelo seu interesse na NeuroBalance!\n\nFicámos muito satisfeitos por ter entrado em contacto connosco. Gostaríamos de agendar uma conversa para esclarecer todas as suas dúvidas sobre o Neurofeedback.\n\nQuando seria conveniente para si?\n\nCom os melhores cumprimentos,\nEquipa NeuroBalance`,
    });
    setShowEmailForm(false);
  };

  const handleEditLead = (lead: LandingLead) => {
    setSelectedLead(lead);
    setIsEditingDetails(true);
  };

  const handleUpdateLead = async (data: Partial<LandingLead>) => {
    if (selectedLead) {
      await updateLead(selectedLead.id, data);
      setSelectedLead({ ...selectedLead, ...data });
      setIsEditingDetails(false);
      toast.success('Lead atualizado com sucesso!');
    }
  };

  const handleSaveObservacoes = async () => {
    if (selectedLead) {
      try {
        await updateLead(selectedLead.id, { observacoes: editForm.observacoes });
        setSelectedLead({ ...selectedLead, observacoes: editForm.observacoes });
        toast.success('Notas guardadas!');
      } catch (error) {
        console.error('Erro ao guardar notas:', error);
        toast.error('Erro ao guardar as notas. Tente novamente.');
      }
    }
  };

  const handleSendEmail = async () => {
    if (!selectedLead?.email) {
      toast.error('Este lead não tem email registado.');
      return;
    }
    if (!emailForm.assunto.trim() || !emailForm.mensagem.trim()) {
      toast.error('Por favor, preencha o assunto e a mensagem.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedLead.email)}&su=${encodeURIComponent(emailForm.assunto)}&body=${encodeURIComponent(emailForm.mensagem)}`;
      window.open(gmailUrl, '_blank');

      if (selectedLead.status === 'Novo') {
        await updateLeadStatus(selectedLead.id, 'Contactado');
        setSelectedLead({ ...selectedLead, status: 'Contactado' });
      }

      const novaObs = `${editForm.observacoes ? editForm.observacoes + '\n\n' : ''}Email preparado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}:\nPara: ${selectedLead.email}\nAssunto: ${emailForm.assunto}`;
      await updateLead(selectedLead.id, { observacoes: novaObs });
      setEditForm({ observacoes: novaObs });

      toast.success('Gmail aberto! Complete o envio do email.');
      setShowEmailForm(false);
    } catch {
      toast.error('Erro ao abrir o Gmail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const handleDeleteLead = (id: string) => {
    setLeadToDelete(id);
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    const id = leadToDelete;
    setLeadToDelete(null);
    await deleteLead(id);
    if (selectedLead?.id === id) setSelectedLead(null);
  };

  const handleCall = (telefone: string) => {
    window.open(`tel:${telefone}`, '_blank');
    toast.success('A iniciar chamada...');
  };

  const handleConvertToClient = () => {
    if (!selectedLead) return;
    const lead = selectedLead;
    setSelectedLead(null);
    window.dispatchEvent(
      new CustomEvent('openConvertLeadDialog', {
        detail: { lead, type: 'landing' },
      }),
    );
  };

  // Quick stats
  const stats = useMemo(() => ({
    total: leads.length,
    novos: leadsByStatus['Novo'].length,
    emProgresso: leads.filter((l) => !['Novo', 'Não Avança', 'Iniciou Neurofeedback'].includes(l.status)).length,
    convertidos: leadsByStatus['Iniciou Neurofeedback'].length,
    taxaConversao: leads.length > 0
      ? ((leadsByStatus['Iniciou Neurofeedback'].length / leads.length) * 100).toFixed(1)
      : '0',
  }), [leads, leadsByStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <KpiCard icon={Users} label="Total Leads" value={stats.total} tone="blue" />
          <KpiCard icon={UserPlus} label="Novos" value={stats.novos} tone="amber" />
          <KpiCard icon={Clock} label="Em Progresso" value={stats.emProgresso} tone="purple" />
          <KpiCard icon={TrendingUp} label="Convertidos" value={stats.convertidos} tone="emerald" sub={`${stats.taxaConversao}% de conversão`} />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome, contacto ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => fetchLeads()} title="Atualizar" aria-label="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {props.onImportClick && (
            <Button
              variant="outline"
              onClick={props.onImportClick}
              className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <Upload className="h-4 w-4" />
              Importar PDF
            </Button>
          )}
          <Button onClick={() => setIsCreateLeadOpen(true)} className="gap-1.5 bg-neurobalance-teal hover:bg-neurobalance-secondary text-white">
            <UserPlus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="pb-4 w-full">
        <div className="flex flex-nowrap gap-2 w-full overflow-hidden">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              leads={leadsByStatus[column.id] || []}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClickLead={handleClickLead}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              onAddLeadToColumn={(status) => {
                setCreateLeadStatus(status);
                setIsCreateLeadOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-medium">
                {(selectedLead?.nome || 'L').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-xl">{isEditingDetails ? 'Editar Lead' : (selectedLead?.nome || 'Lead')}</span>
                {!isEditingDetails && (
                  <Badge className="ml-3" variant="outline">{selectedLead?.status}</Badge>
                )}
              </div>
            </DialogTitle>
            {!isEditingDetails && (
              <DialogDescription>
                Lead recebido em{' '}
                {selectedLead?.created_at
                  ? format(new Date(selectedLead.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })
                  : 'data desconhecida'}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedLead && (
            isEditingDetails ? (
              <LandingLeadForm
                initialData={selectedLead}
                onSubmit={handleUpdateLead}
                onCancel={() => setIsEditingDetails(false)}
              />
            ) : (
              <div className="space-y-6">
                {/* Botão de conversão quando em Avaliação Realizada */}
                {selectedLead.status === 'Avaliação Realizada' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-indigo-800 text-sm">Avaliação concluída!</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Este lead pode ser convertido em cliente.</p>
                    </div>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleConvertToClient}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Converter em Cliente
                    </Button>
                  </div>
                )}

                {/* Informações de Contacto */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações de Contacto
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                      <Mail className="h-5 w-5 text-teal-500" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{selectedLead.email || 'Não disponível'}</p>
                      </div>
                      {selectedLead.email && (
                        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setShowEmailForm(true)}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                      <Phone className="h-5 w-5 text-teal-500" />
                      <div>
                        <p className="text-xs text-gray-500">Telefone</p>
                        <p className="font-medium text-gray-900">{selectedLead.telefone || 'Não disponível'}</p>
                      </div>
                      {selectedLead.telefone && (
                        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => handleCall(selectedLead.telefone)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                      <MapPin className="h-5 w-5 text-teal-500" />
                      <div>
                        <p className="text-xs text-gray-500">Origem</p>
                        <p className="font-medium text-gray-900">{selectedLead.origem || 'Desconhecida'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                      <Clock className="h-5 w-5 text-teal-500" />
                      <div>
                        <p className="text-xs text-gray-500">Última atualização</p>
                        <p className="font-medium text-gray-900">
                          {selectedLead.updated_at
                            ? format(new Date(selectedLead.updated_at), 'dd/MM/yyyy HH:mm', { locale: pt })
                            : 'Nunca atualizado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email form */}
                {showEmailForm && (
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    <h4 className="font-semibold text-teal-700 mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Enviar Email
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="email-assunto">Assunto</Label>
                        <Input
                          id="email-assunto"
                          value={emailForm.assunto}
                          onChange={(e) => setEmailForm({ ...emailForm, assunto: e.target.value })}
                          placeholder="Assunto do email..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email-mensagem">Mensagem</Label>
                        <Textarea
                          id="email-mensagem"
                          value={emailForm.mensagem}
                          onChange={(e) => setEmailForm({ ...emailForm, mensagem: e.target.value })}
                          placeholder="Escreva a sua mensagem..."
                          rows={6}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowEmailForm(false)}>Cancelar</Button>
                        <Button onClick={handleSendEmail} disabled={isSendingEmail} className="bg-teal-600 hover:bg-teal-700">
                          {isSendingEmail ? (
                            <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />A enviar...</>
                          ) : (
                            <><Send className="h-4 w-4 mr-2" />Enviar Email</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observações */}
                <div>
                  <Label htmlFor="observacoes" className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Observações / Notas
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm({ observacoes: e.target.value })}
                    placeholder="Adicionar notas sobre este lead..."
                    rows={4}
                  />
                  <Button size="sm" className="mt-2" onClick={handleSaveObservacoes}>
                    Guardar Notas
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteLead(selectedLead.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Lead
                  </Button>
                  <div className="flex gap-2">
                    {!showEmailForm && selectedLead.email && (
                      <Button variant="outline" onClick={() => setShowEmailForm(true)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Email
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsEditingDetails(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Lead
                    </Button>
                    <Button onClick={() => setSelectedLead(null)}>Fechar</Button>
                  </div>
                </div>
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Lead no Quadro */}
      <Dialog open={isCreateLeadOpen} onOpenChange={(open) => {
        setIsCreateLeadOpen(open);
        if (!open) setCreateLeadStatus(undefined);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lead (Quadro)</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar uma nova lead diretamente a uma coluna do quadro.
            </DialogDescription>
          </DialogHeader>
          <LandingLeadForm
            initialData={createLeadStatus ? ({ status: createLeadStatus } as LandingLead) : undefined}
            onSubmit={async (data) => {
              await addLead({ ...data, email: data.email ?? '' });
              setIsCreateLeadOpen(false);
              setCreateLeadStatus(undefined);
            }}
            onCancel={() => {
              setIsCreateLeadOpen(false);
              setCreateLeadStatus(undefined);
            }}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={leadToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setLeadToDelete(null);
        }}
        onConfirm={confirmDeleteLead}
        title="Eliminar lead"
        description="Tem a certeza que deseja eliminar este lead? Esta ação não pode ser desfeita."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
};

export default LeadKanbanBoard;
