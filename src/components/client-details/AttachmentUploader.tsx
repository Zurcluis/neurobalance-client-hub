import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, X, FileText, Image, FileIcon, Package, File } from 'lucide-react';
import { ClientDetailData } from '@/types/client';

interface AttachmentUploaderProps {
  client: ClientDetailData;
  onAttachmentAdd: (file: File) => void;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

const AttachmentUploader = ({ client, onAttachmentAdd }: AttachmentUploaderProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      addAttachments(Array.from(files));
    }
  };

  const addAttachments = (files: File[]) => {
    const newAttachments = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Notificar o componente pai para cada arquivo
    files.forEach(file => onAttachmentAdd(file));
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== id));
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
  
  // Formatar o tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Determinar o ícone com base no tipo de arquivo
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

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center transition-colors ${
          isDragging ? 'border-[#3f9094] bg-[#3f9094]/5' : 'border-gray-300 hover:border-[#3f9094]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm mb-2 text-gray-500">
          <span className="hidden md:inline">Arraste e solte arquivos aqui ou clique para selecionar</span>
          <span className="inline md:hidden">Toque para selecionar arquivos</span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          className="border-[#3f9094] text-[#3f9094] hover:bg-[#3f9094]/5 w-full sm:w-auto"
        >
          Selecionar Arquivos
        </Button>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Arquivos anexados ({attachments.length})</h3>
          <div className="grid gap-2">
            {attachments.map(attachment => (
              <div 
                key={attachment.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3 overflow-hidden mb-2 sm:mb-0">
                  <div className="shrink-0 p-2 bg-[#3f9094]/10 rounded-md text-[#3f9094]">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-500 self-end sm:self-auto"
                  onClick={() => removeAttachment(attachment.id)}
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