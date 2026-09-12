import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, Loader2, X, FileText, Image, FileIcon, Package, File } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ClientDetailData } from '@/types/client';

const DEFAULT_EXTENSIONS = ['pdf', 'txt', 'xlsx', 'jpg', 'jpeg', 'png'];

interface AttachmentUploaderProps {
  client?: ClientDetailData;
  onAttachmentAdd?: (file: File) => void;
  onFilesSelected?: (files: File[]) => void;
  uploading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  description?: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) {
    return <Image className="h-4 w-4" />;
  } else if (fileType === 'application/pdf') {
    return <File className="h-4 w-4" />;
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return <FileText className="h-4 w-4" />;
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return <FileText className="h-4 w-4" />;
  } else if (fileType.includes('zip') || fileType.includes('compressed')) {
    return <Package className="h-4 w-4" />;
  } else {
    return <FileIcon className="h-4 w-4" />;
  }
};

const AttachmentUploader = ({
  onAttachmentAdd,
  onFilesSelected,
  uploading = false,
  accept,
  maxSizeMB = 10,
  description,
}: AttachmentUploaderProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

  const validateFile = (file: File): boolean => {
    const extension = extensionOf(file.name);
    if (!DEFAULT_EXTENSIONS.includes(extension)) {
      toast.error(`Tipo de ficheiro não suportado: ${file.name}. Formatos aceites: ${DEFAULT_EXTENSIONS.join(', ').toUpperCase()}.`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ficheiro demasiado grande (máx. ${maxSizeMB} MB): ${file.name}`);
      return false;
    }
    return true;
  };

  const addAttachments = (files: File[]) => {
    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    if (onFilesSelected) {
      onFilesSelected(validFiles);
      return;
    }

    const newAttachments = validFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    validFiles.forEach(file => onAttachmentAdd?.(file));
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addAttachments(Array.from(files));
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addAttachments(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-4 md:p-6 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm mb-2 text-muted-foreground">
          {description || 'Arraste e solte ficheiros aqui ou clique para selecionar'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={uploading}
          className="border-primary text-primary hover:bg-primary/5 w-full sm:w-auto"
        >
          {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Selecionar Ficheiros
        </Button>
      </div>

      {!onFilesSelected && attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Ficheiros anexados ({attachments.length})</h3>
          <div className="grid gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-muted/50 border min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 mb-2 sm:mb-0">
                  <div className="shrink-0 p-2 bg-primary/10 rounded-md text-primary">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive self-end sm:self-auto shrink-0"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label="Remover ficheiro"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;
