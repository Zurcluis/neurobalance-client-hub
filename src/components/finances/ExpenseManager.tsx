import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  FileText, 
  RefreshCw,
  CalendarIcon,
  Upload,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { useExpenses } from '@/hooks/useExpenses';
import ExpenseImport, { ExpenseImportData } from './ExpenseImport';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Definição dos tipos
interface Expense {
  id: number;
  tipo: string;
  categoria: string;
  data: string;
  valor: number;
  notas?: string;
  criado_em: string;
}

interface ExpenseFormValues {
  tipo: string;
  categoria: string;
  data: string;
  valor: number | string;
  notas?: string;
}

// Categorias de despesas
const expenseCategories = {
  'Fixas': [
    'Renda',
    'Água',
    'Luz',
    'Telemóvel',
    'Salários',
    'Contabilidade',
    'ChatGPT',
    'Netflix',
    'Reembolso de Capital'
  ],
  'Variáveis': [
    'Despesas Operacionais',
    'Manutenção',
    'Combustível',
    'Seguros',
    'Publicidade',
    'Outras Despesas Operacionais'
  ],
  'Investimento': [
    'Equipamentos',
    'Melhorias',
    'Software',
    'Formação'
  ],
  'Materiais': [
    'Elétrodos',
    'Pasta Condutora',
    'Pasta Nuprep',
    'Água Destilada',
    'Material de Escritório',
    'Tinta para Impressora'
  ],
  'Outras': [
    'Impostos',
    'Devolveu Dinheiro',
    'Outros'
  ]
};

// Cores para os gráficos
const CHART_COLORS = ['#1088c4', '#9e50b3', '#3f9094', '#ecc249', '#e67c50', '#6633cc', '#44ad53', '#ce3838'];

const ExpenseManager: React.FC = () => {
  // Usar o hook de despesas
  const { 
    expenses, 
    isLoading, 
    error: loadingError, 
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense 
  } = useExpenses();
  
  // Estados para gerenciar UI
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [sortColumn, setSortColumn] = useState<string>('data');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState<'form' | 'import'>('form');
  const [currentExpenseId, setCurrentExpenseId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ExpenseFormValues>({
    tipo: 'Fixas',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    valor: '',
    notas: ''
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>(expenseCategories['Fixas']);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Efeito para atualizar categorias disponíveis quando o tipo muda
  useEffect(() => {
    if (formValues.tipo) {
      setAvailableCategories(expenseCategories[formValues.tipo as keyof typeof expenseCategories] || []);
      setFormValues(prev => ({ ...prev, categoria: '' }));
    }
  }, [formValues.tipo]);

  // Função para adicionar nova despesa
  const handleAddExpense = async () => {
    try {
      if (!formValues.tipo || !formValues.categoria || !formValues.data || !formValues.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const numericValue = typeof formValues.valor === 'string' 
        ? parseFloat(formValues.valor.replace(',', '.')) 
        : formValues.valor;

      if (isNaN(numericValue) || numericValue <= 0) {
        toast.error('Valor inválido');
        return;
      }

      const newExpense = {
        tipo: formValues.tipo,
        categoria: formValues.categoria,
        data: formValues.data,
        valor: numericValue,
        notas: formValues.notas || null
      };

      await addExpense(newExpense);
      setIsAddDialogOpen(false);
      // Recarregar todas as despesas para garantir sincronização
      await fetchExpenses();
      setFormValues({
        tipo: 'Fixas',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
        valor: '',
        notas: ''
      });
    } catch (err) {
      console.error('Erro ao adicionar despesa:', err);
      toast.error('Falha ao adicionar despesa');
    }
  };

  // Função para editar despesa existente
  const handleEditExpense = async () => {
    try {
      if (!currentExpenseId || !formValues.tipo || !formValues.categoria || !formValues.data || !formValues.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const numericValue = typeof formValues.valor === 'string' 
        ? parseFloat(formValues.valor.replace(',', '.')) 
        : formValues.valor;

      if (isNaN(numericValue) || numericValue <= 0) {
        toast.error('Valor inválido');
        return;
      }

      const updatedExpense = {
        tipo: formValues.tipo,
        categoria: formValues.categoria,
        data: formValues.data,
        valor: numericValue,
        notas: formValues.notas || null
      };

      await updateExpense(currentExpenseId, updatedExpense);
      setIsEditDialogOpen(false);
      // Recarregar todas as despesas para garantir sincronização
      await fetchExpenses();
      setCurrentExpenseId(null);
      setFormValues({
        tipo: 'Fixas',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
        valor: '',
        notas: ''
      });
    } catch (err) {
      console.error('Erro ao atualizar despesa:', err);
      toast.error('Falha ao atualizar despesa');
    }
  };

  // Função para excluir uma despesa
  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await deleteExpense(id);
    } catch (err) {
      console.error('Erro ao excluir despesa:', err);
    }
  };

  // Filtrar despesas
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesDateRange = 
        (!dateRange.start || expense.data >= dateRange.start) && 
        (!dateRange.end || expense.data <= dateRange.end);
      
      const matchesType = 
        typeFilter === 'Todos' || 
        expense.tipo === typeFilter;
      
      const matchesCategory =
        categoryFilter === 'Todas' ||
        expense.categoria === categoryFilter;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        expense.categoria.toLowerCase().includes(searchLower) ||
        expense.tipo.toLowerCase().includes(searchLower) ||
        (expense.notas && expense.notas.toLowerCase().includes(searchLower));
      
      return matchesDateRange && matchesType && matchesCategory && matchesSearch;
    });
  }, [expenses, dateRange, typeFilter, categoryFilter, searchQuery]);

  // Ordenar despesas
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      let valueA: any = a[sortColumn as keyof typeof a];
      let valueB: any = b[sortColumn as keyof typeof b];
      
      // Tratamento especial para datas
      if (sortColumn === 'data') {
        valueA = new Date(valueA as string).getTime();
        valueB = new Date(valueB as string).getTime();
      }
      
      // Tratamento especial para valores numéricos
      if (sortColumn === 'valor') {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredExpenses, sortColumn, sortDirection]);

  // Cálculo de totais por tipo
  const totalsByType = useMemo(() => {
    const totals: Record<string, number> = {};
    
    Object.keys(expenseCategories).forEach(type => {
      totals[type] = 0;
    });
    
    filteredExpenses.forEach(expense => {
      if (totals[expense.tipo] !== undefined) {
        totals[expense.tipo] += expense.valor;
      }
    });
    
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredExpenses]);

  // Cálculo de totais por categoria
  const totalsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
      if (!totals[expense.categoria]) {
        totals[expense.categoria] = 0;
      }
      totals[expense.categoria] += expense.valor;
    });
    
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredExpenses]);

  // Total geral de despesas
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => total + expense.valor, 0);
  }, [filteredExpenses]);

  // Função para ordenação da tabela
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Função para exportar para CSV
  const exportToCSV = () => {
    // Cabeçalhos do CSV
    const csvHeaders = 'ID,Tipo,Categoria,Data,Valor,Notas\n';
    
    // Dados formatados para CSV
    const csvData = sortedExpenses.map(expense => {
      try {
        const formattedDate = format(parseISO(expense.data), 'dd/MM/yyyy');
        return `${expense.id},"${expense.tipo}","${expense.categoria}","${formattedDate}",${expense.valor},"${expense.notas || ''}"`;
      } catch (error) {
        return `${expense.id},"${expense.tipo}","${expense.categoria}","${expense.data}",${expense.valor},"${expense.notas || ''}"`;
      }
    }).join('\n');
    
    // Montar o conteúdo completo
    const csvContent = csvHeaders + csvData;
    
    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `despesas-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportDialogOpen(false);
    toast.success('Despesas exportadas com sucesso!');
  };

  // Função para adicionar despesas importadas
  const handleImportExpenses = async (expenses: ExpenseImportData[]) => {
    try {
      // Contador para despesas adicionadas com sucesso
      let successCount = 0;

      // Processar cada despesa
      for (const expense of expenses) {
        try {
          await addExpense({
            tipo: expense.tipo,
            categoria: expense.categoria,
            data: expense.data,
            valor: expense.valor,
            notas: expense.notas || ''
          });
          successCount++;
        } catch (error) {
          console.error(`Erro ao importar despesa ${expense.categoria}:`, error);
        }
      }

      setIsImportDialogOpen(false);
      
      // Recarregar todas as despesas para garantir sincronização
      await fetchExpenses();
      
      if (successCount === expenses.length) {
        toast.success(`${successCount} despesa(s) importada(s) com sucesso!`);
      } else {
        toast.success(`${successCount} de ${expenses.length} despesa(s) importada(s) com sucesso.`);
      }
    } catch (error) {
      console.error('Erro ao importar despesas:', error);
      toast.error('Falha ao importar despesas');
    }
  };

  const openAddExpenseDialog = () => {
    setActiveDialog('form');
    setIsAddDialogOpen(true);
    setIsImportDialogOpen(false);
  };

  const openImportDialog = () => {
    setActiveDialog('import');
    setIsImportDialogOpen(true);
    setIsAddDialogOpen(false);
  };

  // Abrir modal de edição e carregar dados da despesa
  const openEditExpenseDialog = (expense: Expense) => {
    setCurrentExpenseId(expense.id);
    setFormValues({
      tipo: expense.tipo,
      categoria: expense.categoria,
      data: expense.data,
      valor: expense.valor,
      notas: expense.notas || ''
    });
    setAvailableCategories(expenseCategories[expense.tipo as keyof typeof expenseCategories] || []);
    setIsEditDialogOpen(true);
  };

  // Renderização com base no estado de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3f9094] mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando despesas...</p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <p className="text-xl font-medium text-red-600 mb-4">{loadingError}</p>
          <p className="text-gray-500 mb-6">Verifique a configuração do banco de dados</p>
          <Button
            variant="outline"
            onClick={fetchExpenses}
            className="mx-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadingError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{loadingError}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold gradient-heading">Despesas</h2>
            
            <div className="flex items-center gap-2">
              {/* Botão de nova despesa */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3f9094] hover:bg-[#265255]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Despesa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Despesa</DialogTitle>
                  </DialogHeader>
                  
                  {/* Formulário de adição manual */}
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select
                          value={formValues.tipo}
                          onValueChange={(value) => setFormValues(prev => ({ ...prev, tipo: value }))}
                        >
                          <SelectTrigger id="tipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(expenseCategories).map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria</Label>
                        <Select
                          value={formValues.categoria}
                          onValueChange={(value) => setFormValues(prev => ({ ...prev, categoria: value }))}
                        >
                          <SelectTrigger id="categoria">
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data">Data</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formValues.data ? format(new Date(formValues.data), 'dd/MM/yyyy') : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formValues.data ? new Date(formValues.data) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setFormValues(prev => ({ ...prev, data: date.toISOString().split('T')[0] }));
                                  setCalendarOpen(false);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (€)</Label>
                        <Input
                          id="valor"
                          placeholder="0,00"
                          value={formValues.valor}
                          onChange={(e) => setFormValues(prev => ({ ...prev, valor: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notas">Notas (Opcional)</Label>
                      <Textarea
                        id="notas"
                        placeholder="Detalhes adicionais sobre a despesa..."
                        value={formValues.notas}
                        onChange={(e) => setFormValues(prev => ({ ...prev, notas: e.target.value }))}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddExpense} className="bg-[#3f9094] hover:bg-[#265255]">Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Botão de importação */}
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Importar Despesas</DialogTitle>
                    <DialogDescription>
                      Importe dados de despesas a partir de arquivos.
                    </DialogDescription>
                  </DialogHeader>
                  <ExpenseImport 
                    onImportComplete={handleImportExpenses} 
                    availableTypes={Object.keys(expenseCategories)}
                    categoryMapping={expenseCategories}
                  />
                </DialogContent>
              </Dialog>

              {/* Botão de exportação */}
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Exportar Despesas</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-gray-500 mb-4">
                      Exportar despesas para arquivo CSV.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="export-start-date">Data Início</Label>
                        <Input
                          id="export-start-date"
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="export-end-date">Data Fim</Label>
                        <Input
                          id="export-end-date"
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={exportToCSV} className="bg-[#3f9094] hover:bg-[#265255]">
                      Exportar CSV
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="list">Lista de Despesas</TabsTrigger>
              <TabsTrigger value="charts">Análise de Despesas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="space-y-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="text-lg">Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Pesquisar por categoria, tipo..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-10">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Período
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="end">
                          <div className="grid gap-2">
                            <div className="grid gap-1">
                              <Label htmlFor="from">De</Label>
                              <Input
                                id="from"
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor="to">Até</Label>
                              <Input
                                id="to"
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 w-[120px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <span className="truncate">Tipo</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todos">Todos</SelectItem>
                          {Object.keys(expenseCategories).map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-10 w-[150px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <span className="truncate">Categoria</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Todas">Todas</SelectItem>
                          {[...new Set(expenses.map(e => e.categoria))].sort().map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('tipo')}>
                            <div className="flex items-center">
                              Tipo
                              {sortColumn === 'tipo' && (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort('categoria')}>
                            <div className="flex items-center">
                              Categoria
                              {sortColumn === 'categoria' && (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('data')}>
                            <div className="flex items-center">
                              Data
                              {sortColumn === 'data' && (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="w-[100px] text-right cursor-pointer" onClick={() => handleSort('valor')}>
                            <div className="flex items-center justify-end">
                              Valor
                              {sortColumn === 'valor' && (
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead className="w-[200px]">Notas</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedExpenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              Nenhuma despesa encontrada com os filtros selecionados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedExpenses.map((expense) => (
                            <TableRow 
                              key={expense.id} 
                              className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={() => openEditExpenseDialog(expense)}
                            >
                              <TableCell className="font-medium">{expense.tipo}</TableCell>
                              <TableCell>{expense.categoria}</TableCell>
                              <TableCell>
                                {format(new Date(expense.data), 'dd/MM/yyyy')}
                              </TableCell>
                              <TableCell className="text-right">
                                €{expense.valor.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell className="truncate max-w-[200px]">{expense.notas || '-'}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteExpense(expense.id);
                                  }}
                                >
                                  ×
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-sm text-right">
                    Total: <span className="font-bold">€{totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="ml-4 text-gray-500">({filteredExpenses.length} despesas)</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="charts" className="space-y-6">
              {/* Indicadores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glassmorphism hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Despesas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{totalExpenses.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-neuro-gray mt-1">
                      {filteredExpenses.length} despesas registradas
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="glassmorphism hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Maior Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalsByCategory.length > 0 
                        ? totalsByCategory[0].name
                        : "N/A"}
                    </div>
                    <p className="text-xs text-neuro-gray mt-1">
                      {totalsByCategory.length > 0 
                        ? `€${totalsByCategory[0].value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "Sem dados disponíveis"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="glassmorphism hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Principal Tipo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalsByType.length > 0 
                        ? totalsByType.sort((a, b) => b.value - a.value)[0].name 
                        : "N/A"}
                    </div>
                    <p className="text-xs text-neuro-gray mt-1">
                      {totalsByType.length > 0 
                        ? `€${totalsByType.sort((a, b) => b.value - a.value)[0].value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "Sem dados disponíveis"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-lg">Despesas por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={totalsByType}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {totalsByType.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="text-lg">Top 10 Categorias</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={totalsByCategory}
                          layout="vertical"
                          margin={{ top: 20, right: 20, left: 120, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip
                            formatter={(value: any) => [`€${value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Valor']}
                          />
                          <Bar dataKey="value" fill="#3f9094" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de resumo por categoria */}
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="text-lg">Resumo por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">% do Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {totalsByCategory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              Nenhuma despesa encontrada com os filtros selecionados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          totalsByCategory.map((category) => {
                            const expense = expenses.find(e => e.categoria === category.name);
                            const percentage = (category.value / totalExpenses) * 100;
                            
                            return (
                              <TableRow key={category.name}>
                                <TableCell>{expense?.tipo || '-'}</TableCell>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="text-right">
                                  €{category.value.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right">
                                  {percentage.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Modal para editar despesa */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Despesa</DialogTitle>
              </DialogHeader>
              
              {/* Formulário de edição */}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-tipo">Tipo</Label>
                    <Select
                      value={formValues.tipo}
                      onValueChange={(value) => setFormValues(prev => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger id="edit-tipo">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(expenseCategories).map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-categoria">Categoria</Label>
                    <Select
                      value={formValues.categoria}
                      onValueChange={(value) => setFormValues(prev => ({ ...prev, categoria: value }))}
                    >
                      <SelectTrigger id="edit-categoria">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-data">Data</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formValues.data ? format(new Date(formValues.data), 'dd/MM/yyyy') : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formValues.data ? new Date(formValues.data) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormValues(prev => ({ ...prev, data: date.toISOString().split('T')[0] }));
                              setCalendarOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-valor">Valor (€)</Label>
                    <Input
                      id="edit-valor"
                      placeholder="0,00"
                      value={formValues.valor}
                      onChange={(e) => setFormValues(prev => ({ ...prev, valor: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notas">Notas (Opcional)</Label>
                  <Textarea
                    id="edit-notas"
                    placeholder="Detalhes adicionais sobre a despesa..."
                    value={formValues.notas}
                    onChange={(e) => setFormValues(prev => ({ ...prev, notas: e.target.value }))}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleEditExpense} className="bg-[#3f9094] hover:bg-[#265255]">Salvar Alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ExpenseManager; 