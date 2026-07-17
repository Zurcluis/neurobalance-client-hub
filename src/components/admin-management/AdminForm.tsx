import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCog, Mail, User, Shield, Calendar, MapPin, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

// Schema de validação dinâmico
const getAdminSchema = (isEdit: boolean) => z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória').refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18 && age <= 100;
  }, 'Deve ter entre 18 e 100 anos'),
  morada: z.string().min(5, 'Morada deve ter pelo menos 5 caracteres'),
  contacto: z.string().min(9, 'Contacto deve ter pelo menos 9 dígitos'),
  role: z.enum(['admin', 'assistant', 'partner'], {
    required_error: 'Selecione um tipo de acesso',
  }),
  ativo: z.boolean().default(true),
  password: isEdit
    ? z.string().optional().refine(val => !val || val.length >= 6, 'A palavra-passe deve ter pelo menos 6 caracteres')
    : z.string().min(6, 'A palavra-passe deve ter pelo menos 6 caracteres'),
});

type AdminFormData = z.infer<ReturnType<typeof getAdminSchema>>;

interface AdminFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin?: any;
  onSubmit: (data: AdminFormData) => void;
}

const AdminForm: React.FC<AdminFormProps> = ({
  open,
  onOpenChange,
  admin,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<AdminFormData>({
    resolver: zodResolver(getAdminSchema(!!admin)),
    defaultValues: {
      nome: admin?.nome || '',
      email: admin?.email || '',
      data_nascimento: admin?.data_nascimento || '',
      morada: admin?.morada || '',
      contacto: admin?.contacto || '',
      role: admin?.role || 'assistant',
      ativo: admin?.ativo ?? true,
      password: '',
    },
  });

  // Reset form when admin changes
  React.useEffect(() => {
    if (admin) {
      form.reset({
        nome: admin.nome,
        email: admin.email,
        data_nascimento: admin.data_nascimento,
        morada: admin.morada,
        contacto: admin.contacto,
        role: admin.role,
        ativo: admin.ativo,
        password: '',
      });
    } else if (open) {
      // Only reset to empty when opening for a new admin
      form.reset({
        nome: '',
        email: '',
        data_nascimento: '',
        morada: '',
        contacto: '',
        role: 'assistant',
        ativo: true,
        password: '',
      });
    }
  }, [admin, form, open]);

  const handleSubmit = (data: AdminFormData) => {
    console.log('AdminForm handleSubmit chamado com dados:', data);
    try {
      onSubmit(data);
      setShowPassword(false);
    } catch (error) {
      console.error('Erro na submissão do formulário:', error);
    }
  };

  const handleClose = () => {
    form.reset();
    setShowPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-[#3f9094]" />
            {admin ? t('editAdministrative') : t('addAdministrative')}
          </DialogTitle>
          <DialogDescription>
            {admin 
              ? 'Edite as informações da administrativa selecionada.' 
              : 'Preencha os dados para adicionar uma nova administrativa ao sistema.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, (errors) => {
            console.log('Erros de validação:', errors);
          })} className="space-y-4 mt-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('fullName')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o nome completo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('email')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@neurobalance.pt"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data de Nascimento */}
            <FormField
              control={form.control}
              name="data_nascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('dateOfBirth')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Morada */}
            <FormField
              control={form.control}
              name="morada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {t('address')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, Cidade, Código Postal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contacto */}
            <FormField
              control={form.control}
              name="contacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t('contact')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="912345678"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Palavra-passe */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Palavra-passe {admin && <span className="text-xs text-gray-500">(deixe em branco para manter)</span>}
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={admin ? "••••••••" : "Introduza a palavra-passe"}
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Acesso */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t('accessType')}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de acesso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="font-medium">{t('administrator')}</div>
                            <div className="text-xs text-gray-500">{t('fullAccess')}</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="assistant">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{t('assistant')}</div>
                            <div className="text-xs text-gray-500">{t('limitedAccess')}</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="partner">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-emerald-500" />
                          <div>
                            <div className="font-medium">{t('partner')}</div>
                            <div className="text-xs text-gray-500">{t('partnerAccess')}</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Ativo */}
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('activeAccount')}
                    </FormLabel>
                    <div className="text-sm text-gray-500">
                      {t('allowAccess')}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  form.handleSubmit(handleSubmit)();
                }}
                className="flex-1 bg-[#3f9094] hover:bg-[#2d7a7e] text-white"
              >
                {admin ? t('update') : t('add')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminForm;
