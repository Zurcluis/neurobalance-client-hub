import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Building2,
    MapPin,
    Phone,
    Mail,
    Globe,
    Instagram,
    Facebook,
    Clock,
    User,
    FileText,
    Calendar,
    Edit,
    Save,
    X,
    Copy,
    Check,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useClinicInfo } from '@/hooks/useClinicInfo';

const ClinicInfoPage = () => {
    const { clinicInfo, isLoading, error, updateClinicInfo, setClinicInfo } = useClinicInfo();
    const [isEditing, setIsEditing] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Copiado para a área de transferência!');
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            toast.error('Erro ao copiar');
        }
    };

    const handleSave = async () => {
        if (!clinicInfo) return;

        setIsSaving(true);
        try {
            await updateClinicInfo({
                nome_clinica: clinicInfo.nome_clinica,
                nif_clinica: clinicInfo.nif_clinica,
                morada: clinicInfo.morada,
                telefone: clinicInfo.telefone,
                email: clinicInfo.email,
                website: clinicInfo.website,
                instagram: clinicInfo.instagram,
                facebook: clinicInfo.facebook,
                horario_segunda_sexta: clinicInfo.horario_segunda_sexta,
                horario_sabado: clinicInfo.horario_sabado,
                horario_domingo: clinicInfo.horario_domingo,
                diretora_clinica: clinicInfo.diretora_clinica,
                descricao_curta: clinicInfo.descricao_curta,
                descricao_longa: clinicInfo.descricao_longa,
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Recarregar dados originais se necessário
        window.location.reload();
    };

    const renderCopyButton = (field: string, value: string) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleCopy(value, field)}
        >
            {copiedField === field ? (
                <Check className="h-4 w-4 text-green-600" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </Button>
    );

    return (
        <PageLayout>
            {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
                        <span className="text-gray-600">A carregar informações...</span>
                    </div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
                    </div>
                </div>
            ) : !clinicInfo ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-gray-600">Nenhuma informação encontrada</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <FileText className="h-8 w-8 text-[#3f9094]" />
                                Ficha Técnica da Clínica
                            </h1>
                            <p className="text-gray-600 mt-2">Informações institucionais da NeuroBalance</p>
                        </div>

                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="bg-[#3f9094] hover:bg-[#2d7a7e] gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="gap-2"
                                    disabled={isSaving}
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-green-600 hover:bg-green-700 gap-2"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            A guardar...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Guardar
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Informações Principais */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Dados Gerais */}
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] text-white">
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Dados Gerais
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-gray-700">Nome da Clínica</Label>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.nome_clinica}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, nome_clinica: e.target.value })}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="text-gray-900 mt-1">{clinicInfo.nome_clinica}</p>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-gray-700">NIF</Label>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.nif_clinica}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, nif_clinica: e.target.value })}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <div className="text-gray-900 mt-1">
                                            {clinicInfo.nif_clinica}
                                            {clinicInfo.nif_clinica === "POR_PREENCHER" && (
                                                <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                                                    Por preencher
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Diretora Clínica
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.diretora_clinica}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, diretora_clinica: e.target.value })}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <p className="text-gray-900 mt-1">{clinicInfo.diretora_clinica}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contactos */}
                        <Card className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] text-white">
                                <CardTitle className="flex items-center gap-2">
                                    <Phone className="h-5 w-5" />
                                    Contactos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Morada
                                    </Label>
                                    {isEditing ? (
                                        <Textarea
                                            value={clinicInfo.morada}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, morada: e.target.value })}
                                            className="mt-1"
                                            rows={2}
                                        />
                                    ) : (
                                        <div className="flex items-start justify-between mt-1">
                                            <p className="text-gray-900 flex-1">{clinicInfo.morada}</p>
                                            {renderCopyButton('morada', clinicInfo.morada)}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Telefone
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.telefone}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, telefone: e.target.value })}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between mt-1">
                                            <a
                                                href={`tel:${clinicInfo.telefone}`}
                                                className="text-[#3f9094] hover:underline"
                                            >
                                                {clinicInfo.telefone}
                                            </a>
                                            {renderCopyButton('telefone', clinicInfo.telefone)}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.email}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, email: e.target.value })}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between mt-1">
                                            <a
                                                href={`mailto:${clinicInfo.email}`}
                                                className="text-[#3f9094] hover:underline"
                                            >
                                                {clinicInfo.email}
                                            </a>
                                            {renderCopyButton('email', clinicInfo.email)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Horário de Funcionamento */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] text-white">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Horário de Funcionamento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-[#3f9094]" />
                                        <span className="font-semibold text-gray-700">Segunda a Sexta</span>
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.horario_segunda_sexta}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, horario_segunda_sexta: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-gray-900">{clinicInfo.horario_segunda_sexta}</p>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-[#3f9094]" />
                                        <span className="font-semibold text-gray-700">Sábado</span>
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.horario_sabado}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, horario_sabado: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-gray-900">{clinicInfo.horario_sabado}</p>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-[#3f9094]" />
                                        <span className="font-semibold text-gray-700">Domingo</span>
                                    </div>
                                    {isEditing ? (
                                        <Input
                                            value={clinicInfo.horario_domingo}
                                            onChange={(e) => setClinicInfo({ ...clinicInfo, horario_domingo: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-red-600 font-medium">{clinicInfo.horario_domingo}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Redes Sociais e Website */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] text-white">
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Presença Digital
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Globe className="h-5 w-5 text-[#3f9094]" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-700">Website</p>
                                        {isEditing ? (
                                            <Input
                                                value={clinicInfo.website}
                                                onChange={(e) => setClinicInfo({ ...clinicInfo, website: e.target.value })}
                                                className="mt-1"
                                            />
                                        ) : (
                                            <a
                                                href={clinicInfo.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#3f9094] text-sm block"
                                            >
                                                neurobalance.pt
                                            </a>
                                        )}
                                    </div>
                                    {!isEditing && renderCopyButton('website', clinicInfo.website)}
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Instagram className="h-5 w-5 text-[#E4405F]" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-700">Instagram</p>
                                        {isEditing ? (
                                            <Input
                                                value={clinicInfo.instagram}
                                                onChange={(e) => setClinicInfo({ ...clinicInfo, instagram: e.target.value })}
                                                className="mt-1"
                                            />
                                        ) : (
                                            <a
                                                href={`https://instagram.com/${clinicInfo.instagram.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#E4405F] text-sm block"
                                            >
                                                {clinicInfo.instagram}
                                            </a>
                                        )}
                                    </div>
                                    {!isEditing && renderCopyButton('instagram', clinicInfo.instagram)}
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <Facebook className="h-5 w-5 text-[#1877F2]" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-700">Facebook</p>
                                        {isEditing ? (
                                            <Input
                                                value={clinicInfo.facebook}
                                                onChange={(e) => setClinicInfo({ ...clinicInfo, facebook: e.target.value })}
                                                className="mt-1"
                                            />
                                        ) : (
                                            <p className="text-[#1877F2] text-sm truncate">{clinicInfo.facebook}</p>
                                        )}
                                    </div>
                                    {!isEditing && renderCopyButton('facebook', clinicInfo.facebook)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Descrição */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] text-white">
                            <CardTitle>Sobre a Clínica</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <Label className="font-semibold text-lg text-gray-900 mb-2 block">Descrição</Label>
                                {isEditing ? (
                                    <Textarea
                                        value={clinicInfo.descricao_curta}
                                        onChange={(e) => setClinicInfo({ ...clinicInfo, descricao_curta: e.target.value })}
                                        rows={2}
                                    />
                                ) : (
                                    <p className="text-gray-700 italic">{clinicInfo.descricao_curta}</p>
                                )}
                            </div>

                            <div>
                                <Label className="font-semibold text-lg text-gray-900 mb-2 block">Informação Detalhada</Label>
                                {isEditing ? (
                                    <Textarea
                                        value={clinicInfo.descricao_longa}
                                        onChange={(e) => setClinicInfo({ ...clinicInfo, descricao_longa: e.target.value })}
                                        rows={10}
                                    />
                                ) : (
                                    <div className="text-gray-700 space-y-3 whitespace-pre-line">
                                        {clinicInfo.descricao_longa}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageLayout>
    );
};

export default ClinicInfoPage;
