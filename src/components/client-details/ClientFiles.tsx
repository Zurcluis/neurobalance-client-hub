
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ClientFile } from '@/types/client';

interface ClientFilesProps {
  files: ClientFile[];
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (fileId: string) => void;
}

const ClientFiles = ({ files, onUploadFile, onDeleteFile }: ClientFilesProps) => {
  const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false);

  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-500" />;
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
                  onChange={onUploadFile}
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
                    onClick={() => onDeleteFile(file.id)}
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
            <p className="text-sm text-gray-500 mt-1">
              Carregue documentos como relatórios, avaliações ou exames
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientFiles;
