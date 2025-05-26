import React, { useState } from 'react';
import { ClientDetailData } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mail, 
  Share2, 
  Link, 
  Copy, 
  FileText, 
  File, 
  Facebook, 
  Twitter,
  Send,
  Download,
  Check,
  Lock,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportShareProps {
  client: ClientDetailData;
}

const ReportShare = ({ client }: ReportShareProps) => {
  const [activeTab, setActiveTab] = useState('email');
  const [emailAddresses, setEmailAddresses] = useState('');
  const [subject, setSubject] = useState(`Relatório do Cliente - ${client.nome}`);
  const [message, setMessage] = useState(`Olá,\n\nSegue em anexo o relatório do cliente ${client.nome}.\n\nAtenciosamente,\nEquipe NeuroBalance`);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [sendCopy, setSendCopy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [password, setPassword] = useState('');
  const [linkExpiration, setLinkExpiration] = useState('7');
  
  // Exemplo de relatórios disponíveis
  const availableReports = [
    { id: '1', title: 'Relatório Trimestral Q4', date: '2023-12-31', format: 'pdf', size: '392 KB' },
    { id: '2', title: 'Relatório Financeiro', date: '2023-11-15', format: 'pdf', size: '256 KB' },
    { id: '3', title: 'Histórico de Sessões', date: '2023-10-22', format: 'txt', size: '128 KB' },
  ];
  
  // Exemplo de função para compartilhar por e-mail
  const handleEmailShare = () => {
    // Aqui seria a implementação real para enviar os relatórios por e-mail
    alert(`E-mail(s) enviado(s) para: ${emailAddresses}`);
  };
  
  // Exemplo de função para gerar e copiar link
  const handleCopyLink = () => {
    // Aqui seria a implementação real para gerar um link compartilhável
    const shareableLink = `https://neurobalance.app/share/report/${Math.random().toString(36).substring(2, 15)}`;
    navigator.clipboard.writeText(shareableLink);
    setLinkCopied(true);
    
    setTimeout(() => {
      setLinkCopied(false);
    }, 3000);
  };
  
  // Exemplo de função para compartilhar nas redes sociais
  const handleSocialShare = (platform: string) => {
    // Aqui seria a implementação real para compartilhar nas redes sociais
    alert(`Compartilhando no ${platform}`);
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap w-full">
          <TabsTrigger value="email" className="flex items-center gap-2 flex-1">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">E-mail</span>
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2 flex-1">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Link</span>
          </TabsTrigger>
          <TabsTrigger value="download" className="flex items-center gap-2 flex-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="recipients">Destinatários (separados por vírgula)</Label>
              <Input
                id="recipients"
                placeholder="cliente@email.com, colega@clinica.com"
                value={emailAddresses}
                onChange={(e) => setEmailAddresses(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto do e-mail"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Escreva uma mensagem..."
                className="min-h-[120px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium mb-2">Selecione os relatórios a anexar:</h4>
              <div className="grid gap-3">
                {availableReports.map(report => (
                  <div 
                    key={report.id} 
                    className="flex items-center space-x-2 border p-3 rounded-md bg-white/70"
                  >
                    <Checkbox id={`report-${report.id}`} defaultChecked />
                    <div className="flex-1">
                      <label 
                        htmlFor={`report-${report.id}`}
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {report.format === 'pdf' ? <File className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        <span className="truncate">{report.title}</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(report.date), 'dd/MM/yyyy')} • {report.format.toUpperCase()} • {report.size}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="attachments"
                  checked={includeAttachments}
                  onCheckedChange={setIncludeAttachments}
                />
                <Label htmlFor="attachments">Incluir relatórios como anexos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-copy"
                  checked={sendCopy}
                  onCheckedChange={setSendCopy}
                />
                <Label htmlFor="send-copy">Enviar uma cópia para mim</Label>
              </div>
            </div>
            
            <Button 
              onClick={handleEmailShare}
              className="bg-[#3f9094] hover:bg-[#265255] w-full mt-4"
              disabled={!emailAddresses}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar E-mail
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="link">
          <div className="space-y-6">
            <div className="p-4 border rounded-md bg-white/70">
              <h3 className="text-sm font-medium mb-4">Compartilhar via Link</h3>
              <p className="text-sm text-gray-600 mb-4">
                Gere um link seguro para compartilhar os relatórios selecionados. O link pode ser protegido por senha e ter um prazo de validade.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="password-protect"
                    checked={passwordProtect}
                    onCheckedChange={setPasswordProtect}
                  />
                  <Label htmlFor="password-protect" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Proteger com senha</span>
                  </Label>
                </div>
                
                {passwordProtect && (
                  <div className="pl-2 sm:pl-6 border-l-2 border-gray-100">
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite uma senha..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        A senha será necessária para acessar os relatórios.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="expiration">Expiração do Link</Label>
                  <select
                    id="expiration"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={linkExpiration}
                    onChange={(e) => setLinkExpiration(e.target.value)}
                  >
                    <option value="1">1 dia</option>
                    <option value="3">3 dias</option>
                    <option value="7">7 dias</option>
                    <option value="30">30 dias</option>
                    <option value="never">Nunca expira</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Relatórios incluídos:</h4>
                  <div className="pl-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {availableReports.map(report => (
                      <div key={report.id} className="flex items-center gap-2 py-1 text-sm">
                        <Checkbox id={`link-report-${report.id}`} defaultChecked />
                        <label htmlFor={`link-report-${report.id}`} className="truncate">
                          {report.title} ({report.format.toUpperCase()})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                  <Button
                    onClick={handleCopyLink}
                    className="flex-1 bg-[#3f9094] hover:bg-[#265255]"
                  >
                    {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {linkCopied ? 'Link Copiado!' : 'Gerar e Copiar Link'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleSocialShare('whatsapp')}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sm:hidden">Compartilhar</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-2 flex-wrap pt-4">
              <Button
                variant="ghost"
                className="flex items-center gap-2 flex-1 sm:flex-none"
                onClick={() => handleSocialShare('facebook')}
              >
                <Facebook className="h-5 w-5" />
                <span>Facebook</span>
              </Button>
              
              <Button
                variant="ghost"
                className="flex items-center gap-2 flex-1 sm:flex-none"
                onClick={() => handleSocialShare('twitter')}
              >
                <Twitter className="h-5 w-5" />
                <span>Twitter</span>
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="download">
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-white/70">
              <h3 className="text-sm font-medium mb-2">Baixar Relatórios</h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecione os relatórios que deseja baixar.
              </p>
              
              <div className="grid gap-3 mt-4">
                {availableReports.map(report => (
                  <div 
                    key={report.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between p-3 border rounded-md bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                      <Checkbox id={`download-${report.id}`} defaultChecked />
                      <div>
                        <label 
                          htmlFor={`download-${report.id}`}
                          className="text-sm font-medium"
                        >
                          {report.title}
                        </label>
                        <p className="text-xs text-gray-500">
                          {format(new Date(report.date), 'dd/MM/yyyy')} • {report.format.toUpperCase()} • {report.size}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button className="bg-[#3f9094] hover:bg-[#265255] w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Selecionados
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportShare; 