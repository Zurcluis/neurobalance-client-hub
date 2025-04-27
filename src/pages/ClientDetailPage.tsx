
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, User, Upload, FileText, FilePdf, FileExcel, Trash2, ArrowLeft } from 'lucide-react';
import { ClientData } from '@/components/clients/ClientCard';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

// Tipos de dados
interface ClientDetailData extends ClientData {
  address?: string;
  notes?: string;
}

interface Session {
  id: string;
  clientId: string;
  date: string;
  notes: string;
  paid: boolean;
}

interface Payment {
  id: string;
  clientId: string;
  date: string;
  amount: number;
  description: string;
  method: string;
}

interface ClientFile {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
}

// Função para carregar dados do localStorage
const loadFromStorage = <T extends unknown>(key: string, defaultValue: T): T => {
  const storedData = localStorage.getItem(key);
  return storedData ? JSON.parse(storedData) : defaultValue;
};

// Função para salvar dados no localStorage
const saveToStorage = <T extends unknown>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  
  // Estados
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  
  // Estados para diálogos
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  
  // Formulários
  const profileForm = useForm<ClientDetailData>();
  const sessionForm = useForm<Session>();
  const paymentForm = useForm<Payment>();

  // Carregar dados
  useEffect(() => {
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const foundClient = clients.find(c => c.id === clientId);
    
    if (foundClient) {
      setClient(foundClient);
    }
    
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const clientSessions = allSessions.filter(session => session.clientId === clientId);
    setSessions(clientSessions);
    
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const clientPayments = allPayments.filter(payment => payment.clientId === clientId);
    setPayments(clientPayments);
    
    const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
    const clientFiles = allFiles.filter(file => file.clientId === clientId);
    setFiles(clientFiles);
  }, [clientId]);

  // Se o cliente não for encontrado, mostrar erro
  if (!client) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-500">Cliente Não Encontrado</h2>
          <p className="mt-2 mb-6">O cliente que procura não existe ou foi removido.</p>
          <Link to="/clients">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  // Funções para atualização de dados
  const updateClient = (data: ClientDetailData) => {
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => c.id === clientId ? {...c, ...data} : c);
    saveToStorage('clients', updatedClients);
    setClient({...client, ...data});
    setIsProfileDialogOpen(false);
    toast.success('Informações do cliente atualizadas com sucesso');
  };
  
  const addSession = (data: Session) => {
    const newSession = {
      ...data,
      id: Date.now().toString(),
      clientId: clientId as string,
    };
    const allSessions = loadFromStorage<Session[]>('sessions', []);
    const updatedSessions = [...allSessions, newSession];
    saveToStorage('sessions', updatedSessions);
    
    // Atualizar número de sessões do cliente
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId ? {...c, sessionCount: (c.sessionCount || 0) + 1} : c
    );
    saveToStorage('clients', updatedClients);
    
    setSessions(prev => [...prev, newSession]);
    setClient(prev => prev ? {...prev, sessionCount: (prev.sessionCount || 0) + 1} : null);
    setIsSessionDialogOpen(false);
    toast.success('Sessão adicionada com sucesso');
  };

  const addPayment = (data: Payment) => {
    const newPayment = {
      ...data,
      id: Date.now().toString(),
      clientId: clientId as string,
    };
    const allPayments = loadFromStorage<Payment[]>('payments', []);
    const updatedPayments = [...allPayments, newPayment];
    saveToStorage('payments', updatedPayments);
    
    // Atualizar total pago pelo cliente
    const clients = loadFromStorage<ClientDetailData[]>('clients', []);
    const updatedClients = clients.map(c => 
      c.id === clientId ? {...c, totalPaid: (c.totalPaid || 0) + data.amount} : c
    );
    saveToStorage('clients', updatedClients);
    
    setPayments(prev => [...prev, newPayment]);
    setClient(prev => prev ? {...prev, totalPaid: (prev.totalPaid || 0) + data.amount} : null);
    setIsPaymentDialogOpen(false);
    toast.success('Pagamento registado com sucesso');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Verificar tipo de arquivo
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de ficheiro não suportado. Apenas PDF, TXT e XLSX são permitidos.');
        return;
      }
      
      // Criar URL temporária para o arquivo
      const fileUrl = URL.createObjectURL(file);
      
      // Determinar o ícone do tipo de arquivo
      let fileType = 'outro';
      if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type === 'text/plain') fileType = 'txt';
      else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') fileType = 'xlsx';
      
      // Criar novo registro de arquivo
      const newFile: ClientFile = {
        id: Date.now().toString(),
        clientId: clientId as string,
        name: file.name,
        type: fileType,
        size: file.size,
        url: fileUrl,
        uploadDate: new Date().toISOString(),
      };
      
      // Salvar no localStorage
      const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
      const updatedFiles = [...allFiles, newFile];
      saveToStorage('clientFiles', updatedFiles);
      
      setFiles(prev => [...prev, newFile]);
      setIsFileDialogOpen(false);
      toast.success('Ficheiro carregado com sucesso');
    }
  };

  const deleteFile = (fileId: string) => {
    const allFiles = loadFromStorage<ClientFile[]>('clientFiles', []);
    const updatedFiles = allFiles.filter(file => file.id !== fileId);
    saveToStorage('clientFiles', updatedFiles);
    setFiles(files.filter(file => file.id !== fileId));
    toast.success('Ficheiro eliminado com sucesso');
  };

  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FilePdf className="h-5 w-5 text-red-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileExcel className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <PageLayout>
      <div className="flex items-center mb-8">
        <Link to="/clients">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold gradient-heading">{client.name}</h1>
          <p className="text-gray-600 mt-1">{client.email} • {client.phone}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <Calendar className="h-4 w-4 text-[#3f9094]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{client.sessionCount}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#3f9094]">
              <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
              <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
              <path d="M7 14c3.22-2.91 4.29-8.75 5-12 1.66 2.38 4.94 9 5 12" />
              <path d="M22 9c-4.29 0-7.14-2.33-10-7 4.67 2.33 5.56 5 3 7" />
            </svg>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">€{client.totalPaid?.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="glassmorphism md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próxima Sessão</CardTitle>
            <Calendar className="h-4 w-4 text-[#3f9094]" />
          </CardHeader>
          <CardContent>
            {client.nextSession ? (
              <p className="text-xl font-medium">{client.nextSession}</p>
            ) : (
              <p className="text-gray-500">Sem sessões agendadas</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="files">Ficheiros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>Informações Pessoais</span>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => {
                  profileForm.reset(client);
                  setIsProfileDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Nome Completo</h3>
                  <p>{client.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Email</h3>
                  <p>{client.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Telefone</h3>
                  <p>{client.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Morada</h3>
                  <p>{client.address || "Não especificado"}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Notas</h3>
                <p className="text-sm">
                  {client.notes || "Sem notas adicionadas"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Diálogo para editar perfil */}
          <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Perfil do Cliente</DialogTitle>
              </DialogHeader>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(updateClient)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Morada</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} className="min-h-[100px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsProfileDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#3f9094] hover:bg-[#265255]"
                    >
                      Guardar Alterações
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Histórico de Sessões</span>
              </CardTitle>
              <Button 
                className="bg-[#3f9094] hover:bg-[#265255]"
                onClick={() => {
                  sessionForm.reset({
                    id: '',
                    clientId: clientId as string,
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                    paid: false,
                  });
                  setIsSessionDialogOpen(true);
                }}
              >
                Adicionar Sessão
              </Button>
            </CardHeader>
            <CardContent>
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="p-4 rounded-lg bg-[#c5cfce] border border-white/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">Sessão em {new Date(session.date).toLocaleDateString('pt-PT')}</h3>
                            <Badge variant="outline" className="text-xs">
                              {session.paid ? 'Pago' : 'Não Pago'}
                            </Badge>
                          </div>
                          <p className="text-sm mt-2 text-gray-700">{session.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Sem histórico de sessões disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diálogo para adicionar sessão */}
          <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Sessão</DialogTitle>
              </DialogHeader>
              <Form {...sessionForm}>
                <form onSubmit={sessionForm.handleSubmit(addSession)} className="space-y-4">
                  <FormField
                    control={sessionForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Sessão</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sessionForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas da Sessão</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[100px]" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sessionForm.control}
                    name="paid"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value}
                              onChange={field.onChange}
                              id="paid-checkbox"
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel htmlFor="paid-checkbox" className="cursor-pointer">Sessão paga</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsSessionDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#3f9094] hover:bg-[#265255]"
                    >
                      Adicionar Sessão
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="payments" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span>Histórico de Pagamentos</span>
              </CardTitle>
              <Button 
                className="bg-[#3f9094] hover:bg-[#265255]"
                onClick={() => {
                  paymentForm.reset({
                    id: '',
                    clientId: clientId as string,
                    date: new Date().toISOString().split('T')[0],
                    amount: 0,
                    description: '',
                    method: '',
                  });
                  setIsPaymentDialogOpen(true);
                }}
              >
                Registar Pagamento
              </Button>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="p-4 rounded-lg bg-[#3f9094]/20 border border-white/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{payment.description}</h3>
                          <p className="text-sm text-gray-600">Data: {new Date(payment.date).toLocaleDateString('pt-PT')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">€{payment.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-600">{payment.method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Sem histórico de pagamentos disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diálogo para adicionar pagamento */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registar Pagamento</DialogTitle>
              </DialogHeader>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(addPayment)} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Descrição do pagamento" required />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" required />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (€)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              required 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={paymentForm.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pagamento</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="MB WAY, Transferência, Cartão, etc."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsPaymentDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-[#3f9094] hover:bg-[#265255]"
                    >
                      Registar Pagamento
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="files" className="mt-0">
          <Card className="glassmorphism">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>Ficheiros</span>
              </CardTitle>
              <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3f9094] hover:bg-[#265255]">
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar Ficheiro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Carregar Ficheiro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Selecione um ficheiro para carregar (PDF, TXT ou XLSX)
                    </p>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <Input 
                        type="file" 
                        onChange={handleFileUpload}
                        accept=".pdf,.txt,.xlsx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsFileDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-[#c5cfce]/20"
                    >
                      <div className="flex items-center space-x-3">
                        {renderFileIcon(file.type)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-[#3f9094]/10"
                        >
                          <FileText className="h-4 w-4 text-[#3f9094]" />
                        </a>
                        <button 
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 rounded hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Nenhum ficheiro carregado</p>
                  <p className="text-sm text-gray-500 mt-1">Carregue documentos como relatórios, avaliações ou exames</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default ClientDetailPage;
