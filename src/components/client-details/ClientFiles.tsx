import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Image, Loader2, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { StoredClientFile } from './useClientDetailData';
import AttachmentUploader from './AttachmentUploader';

interface ClientFilesProps {
  files: StoredClientFile[];
  isUploading: boolean;
  onUploadFiles: (files: File[]) => void;
  onDeleteFile: (fileId: string) => void;
}

const renderFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500 dark:text-red-400" />;
    case 'txt':
      return <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
    case 'xlsx':
      return <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <Image className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

const formatUploadDate = (uploadDate: string) => {
  const date = new Date(uploadDate);
  if (isNaN(date.getTime())) return '';
  return format(date, 'dd/MM/yyyy');
};

const ClientFiles = ({ files, isUploading, onUploadFiles, onDeleteFile }: ClientFilesProps) => {
  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<StoredClientFile | null>(null);

  const handleFilesSelected = (selected: File[]) => {
    onUploadFiles(selected);
  };

  const handleDownload = (file: StoredClientFile) => {
    if (!file.url) {
      toast.error('O ficheiro não tem um endereço de download disponível.');
      return;
    }
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <CardTitle className="flex items-center gap-3 text-base font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <span>Ficheiros</span>
        </CardTitle>
        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Carregar Ficheiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Carregar Ficheiro</DialogTitle>
              <DialogDescription>
                Selecione um ficheiro para carregar (PDF, TXT, XLSX, JPG ou PNG, máx. 10 MB)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <AttachmentUploader
                onFilesSelected={handleFilesSelected}
                uploading={isUploading}
                accept=".pdf,.txt,.xlsx,.jpg,.jpeg,.png"
                maxSizeMB={10}
                description="Arraste e solte ficheiros aqui ou clique para selecionar"
              />
              {isUploading && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  A carregar ficheiro...
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFileDialogOpen(false)}
                >
                  Fechar
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
                className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0">{renderFileIcon(file.type)}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                      {formatUploadDate(file.uploadDate) && ` • ${formatUploadDate(file.uploadDate)}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    title="Descarregar ficheiro"
                    aria-label="Descarregar ficheiro"
                    className="p-1.5 rounded hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4 text-primary" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileToDelete(file)}
                    title="Eliminar ficheiro"
                    aria-label="Eliminar ficheiro"
                    className="p-1.5 rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="Nenhum ficheiro carregado"
            description="Carregue documentos como relatórios, avaliações ou exames"
            action={{
              label: 'Carregar Ficheiro',
              onClick: () => setIsFileDialogOpen(true),
              icon: <Upload className="h-4 w-4" />,
              variant: 'default'
            }}
          />
        )}
      </CardContent>

      <ConfirmDialog
        open={fileToDelete !== null}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        onConfirm={() => {
          if (fileToDelete) onDeleteFile(fileToDelete.id);
          setFileToDelete(null);
        }}
        title="Eliminar Ficheiro"
        description={
          fileToDelete
            ? `Tem a certeza que quer eliminar "${fileToDelete.name}"? Esta ação não pode ser revertida.`
            : ''
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </Card>
  );
};

export default ClientFiles;
