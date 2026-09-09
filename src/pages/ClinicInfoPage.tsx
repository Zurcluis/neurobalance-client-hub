import { useState, type ReactNode } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
    Hash,
    FileText,
    Edit,
    Save,
    X,
    Copy,
    Check,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useClinicInfo, type ClinicInfo } from '@/hooks/useClinicInfo';

type FieldKey = keyof ClinicInfo;

interface FieldConfig {
    label: string;
    icon: ReactNode;
    field: FieldKey;
    copy?: boolean;
    tabular?: boolean;
    textarea?: boolean;
    rows?: number;
    renderValue?: (value: string) => ReactNode;
}

const ClinicInfoPage = () => {
    const { clinicInfo, isLoading, error, updateClinicInfo, fetchClinicInfo } = useClinicInfo();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [draft, setDraft] = useState<ClinicInfo | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleEdit = () => {
        if (!clinicInfo) return;
        setDraft({ ...clinicInfo });
        setIsEditing(true);
    };

    const handleCancel = () => {
        setDraft(null);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!draft) return;

        setIsSaving(true);
        try {
            await updateClinicInfo({
                nome_clinica: draft.nome_clinica,
                nif_clinica: draft.nif_clinica,
                morada: draft.morada,
                telefone: draft.telefone,
                email: draft.email,
                website: draft.website,
                instagram: draft.instagram,
                facebook: draft.facebook,
                horario_segunda_sexta: draft.horario_segunda_sexta,
                horario_sabado: draft.horario_sabado,
                horario_domingo: draft.horario_domingo,
                diretora_clinica: draft.diretora_clinica,
                descricao_curta: draft.descricao_curta,
                descricao_longa: draft.descricao_longa,
            });
            setDraft(null);
            setIsEditing(false);
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    const setField = (field: FieldKey, value: string) => {
        setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Copiado para a área de transferência!');
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast.error('Erro ao copiar');
        }
    };

    const renderCopyButton = (field: string, value: string) => (
        <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
            onClick={() => handleCopy(value, field)}
            aria-label="Copiar"
        >
            {copiedField === field ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
                <Copy className="h-4 w-4" />
            )}
        </Button>
    );

    const renderField = (config: FieldConfig) => {
        const { label, icon, field, copy, tabular, textarea, rows, renderValue } = config;
        const value = isEditing ? (draft?.[field] ?? '') : (clinicInfo?.[field] ?? '');

        return (
            <div>
                <div className="flex items-center gap-1.5">
                    {icon}
                    <Label className="text-sm text-muted-foreground">{label}</Label>
                </div>
                {isEditing ? (
                    textarea ? (
                        <Textarea
                            value={value}
                            onChange={(e) => setField(field, e.target.value)}
                            rows={rows ?? 3}
                            className="mt-1.5"
                        />
                    ) : (
                        <Input
                            value={value}
                            onChange={(e) => setField(field, e.target.value)}
                            className="mt-1.5"
                        />
                    )
                ) : (
                    <div className="mt-1.5 flex items-start justify-between gap-2">
                        <div className={`min-w-0 text-sm font-medium ${tabular ? 'tabular-nums' : ''}`}>
                            {renderValue
                                ? renderValue(value)
                                : (value || <span className="text-muted-foreground font-normal">—</span>)}
                        </div>
                        {copy && value && renderCopyButton(field, value)}
                    </div>
                )}
            </div>
        );
    };

    const renderCardHeader = (icon: ReactNode, title: string) => (
        <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                </div>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </div>
        </CardHeader>
    );

    if (isLoading) {
        return (
            <PageLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-72" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                    <Skeleton className="h-36" />
                    <Skeleton className="h-36" />
                    <Skeleton className="h-72" />
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout>
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                    <p className="text-sm text-destructive">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchClinicInfo()}>
                        Tentar novamente
                    </Button>
                </div>
            </PageLayout>
        );
    }

    if (!clinicInfo) {
        return (
            <PageLayout>
                <div className="flex min-h-[400px] items-center justify-center">
                    <p className="text-muted-foreground">Nenhuma informação encontrada</p>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Ficha Técnica da Clínica"
                    description="Informações institucionais da NeuroBalance"
                    icon={<FileText className="h-5 w-5" />}
                    actions={
                        isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90"
                                    onClick={handleSave}
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
                            </>
                        ) : (
                            <Button
                                size="sm"
                                className="gap-2 bg-gradient-to-r from-[#3f9094] to-[#2A5854] hover:opacity-90"
                                onClick={handleEdit}
                            >
                                <Edit className="h-4 w-4" />
                                Editar
                            </Button>
                        )
                    }
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        {renderCardHeader(<Building2 className="h-5 w-5" />, 'Dados Gerais')}
                        <CardContent className="space-y-4">
                            {renderField({
                                label: 'Nome da Clínica',
                                icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
                                field: 'nome_clinica',
                            })}
                            {renderField({
                                label: 'NIF',
                                icon: <Hash className="h-4 w-4 text-muted-foreground" />,
                                field: 'nif_clinica',
                                tabular: true,
                                renderValue: (value) => (
                                    <span className="flex flex-wrap items-center gap-2">
                                        {value}
                                        {value === 'POR_PREENCHER' && (
                                            <Badge
                                                variant="outline"
                                                className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700"
                                            >
                                                Por preencher
                                            </Badge>
                                        )}
                                    </span>
                                ),
                            })}
                            {renderField({
                                label: 'Diretora Clínica',
                                icon: <User className="h-4 w-4 text-muted-foreground" />,
                                field: 'diretora_clinica',
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        {renderCardHeader(<Phone className="h-5 w-5" />, 'Contactos')}
                        <CardContent className="space-y-4">
                            {renderField({
                                label: 'Morada',
                                icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
                                field: 'morada',
                                textarea: true,
                                rows: 2,
                                copy: true,
                            })}
                            {renderField({
                                label: 'Telefone',
                                icon: <Phone className="h-4 w-4 text-muted-foreground" />,
                                field: 'telefone',
                                tabular: true,
                                copy: true,
                                renderValue: (value) =>
                                    value ? (
                                        <a href={`tel:${value}`} className="text-primary hover:underline">
                                            {value}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground font-normal">—</span>
                                    ),
                            })}
                            {renderField({
                                label: 'Email',
                                icon: <Mail className="h-4 w-4 text-muted-foreground" />,
                                field: 'email',
                                copy: true,
                                renderValue: (value) =>
                                    value ? (
                                        <a href={`mailto:${value}`} className="text-primary hover:underline break-all">
                                            {value}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground font-normal">—</span>
                                    ),
                            })}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    {renderCardHeader(<Clock className="h-5 w-5" />, 'Horário de Funcionamento')}
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {([
                                { label: 'Segunda a Sexta', field: 'horario_segunda_sexta' as FieldKey },
                                { label: 'Sábado', field: 'horario_sabado' as FieldKey },
                                { label: 'Domingo', field: 'horario_domingo' as FieldKey },
                            ]).map((item) => (
                                <div key={item.field} className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                    {isEditing ? (
                                        <Input
                                            value={draft?.[item.field] ?? ''}
                                            onChange={(e) => setField(item.field, e.target.value)}
                                            className="mt-1.5"
                                        />
                                    ) : (
                                        <p className="mt-0.5 text-sm font-medium tabular-nums">
                                            {clinicInfo[item.field] || <span className="text-muted-foreground font-normal">—</span>}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    {renderCardHeader(<Globe className="h-5 w-5" />, 'Presença Digital')}
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                                <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-muted-foreground">Website</p>
                                    {isEditing ? (
                                        <Input
                                            value={draft?.website ?? ''}
                                            onChange={(e) => setField('website', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    ) : clinicInfo.website ? (
                                        <a
                                            href={clinicInfo.website.startsWith('http') ? clinicInfo.website : `https://${clinicInfo.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block truncate text-sm font-medium text-primary hover:underline"
                                        >
                                            {clinicInfo.website}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">—</p>
                                    )}
                                </div>
                                {!isEditing && clinicInfo.website && renderCopyButton('website', clinicInfo.website)}
                            </div>

                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                                <Instagram className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-muted-foreground">Instagram</p>
                                    {isEditing ? (
                                        <Input
                                            value={draft?.instagram ?? ''}
                                            onChange={(e) => setField('instagram', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    ) : clinicInfo.instagram ? (
                                        <a
                                            href={`https://instagram.com/${clinicInfo.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block truncate text-sm font-medium text-primary hover:underline"
                                        >
                                            {clinicInfo.instagram}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">—</p>
                                    )}
                                </div>
                                {!isEditing && clinicInfo.instagram && renderCopyButton('instagram', clinicInfo.instagram)}
                            </div>

                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                                <Facebook className="h-5 w-5 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-muted-foreground">Facebook</p>
                                    {isEditing ? (
                                        <Input
                                            value={draft?.facebook ?? ''}
                                            onChange={(e) => setField('facebook', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    ) : (
                                        <p className="truncate text-sm font-medium">
                                            {clinicInfo.facebook || <span className="text-muted-foreground font-normal">—</span>}
                                        </p>
                                    )}
                                </div>
                                {!isEditing && clinicInfo.facebook && renderCopyButton('facebook', clinicInfo.facebook)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    {renderCardHeader(<FileText className="h-5 w-5" />, 'Sobre a Clínica')}
                    <CardContent className="space-y-4">
                        {renderField({
                            label: 'Descrição',
                            icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
                            field: 'descricao_curta',
                            textarea: true,
                            rows: 2,
                        })}
                        <div>
                            <div className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <Label className="text-sm text-muted-foreground">Informação Detalhada</Label>
                            </div>
                            {isEditing ? (
                                <Textarea
                                    value={draft?.descricao_longa ?? ''}
                                    onChange={(e) => setField('descricao_longa', e.target.value)}
                                    rows={10}
                                    className="mt-1.5"
                                />
                            ) : (
                                <div className="mt-1.5 whitespace-pre-line text-sm">
                                    {clinicInfo.descricao_longa || (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
};

export default ClinicInfoPage;
