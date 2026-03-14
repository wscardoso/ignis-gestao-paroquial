import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    BookOpen,
    Calendar,
    FileText,
    ChevronRight,
    Filter,
    ArrowLeft,
    Scroll,
    Flame,
    Heart,
    Award,
    Droplets,
    Printer,
    Pencil,
    Trash2,
    Loader2,
    type LucideIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ignisApi } from '../../services/api';
import type { Sacrament } from '../../services/api';
import { SacramentForm } from './SacramentForm';
import { CertificatePreview } from './CertificatePreview';
import { useTenant } from '../../contexts/TenantContext';
import { ModuleHeader } from '../ui/ModuleHeader';
import './Sacramenta.css';

export type SacramentType = 'baptism' | 'first_communion' | 'confirmation' | 'marriage' | 'anointing_of_sick';

interface SacramentConfig {
    label: string;
    description: string;
    searchPlaceholder: string;
    emptyMessage: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    detailRows: { label: string; key: string }[];
}

const SACRAMENT_CONFIGS: Record<SacramentType, SacramentConfig> = {
    baptism: {
        label: 'Batismos',
        description: 'Gestão de registros históricos e novos batizados.',
        searchPlaceholder: 'Buscar por nome do batizado...',
        emptyMessage: 'Nenhum registro de batismo encontrado.',
        icon: Flame,
        iconColor: 'var(--accent)',
        iconBg: 'rgba(209, 168, 74, 0.1)',
        detailRows: [
            { label: 'Padrinho', key: 'godfather' },
            { label: 'Madrinha', key: 'godmother' },
        ],
    },
    first_communion: {
        label: '1ª Eucaristia',
        description: 'Registros de Primeira Eucaristia (Primeira Comunhão).',
        searchPlaceholder: 'Buscar por nome do comungante...',
        emptyMessage: 'Nenhum registro de 1ª Eucaristia encontrado.',
        icon: Award,
        iconColor: 'var(--accent)',
        iconBg: 'rgba(209, 168, 74, 0.1)',
        detailRows: [
            { label: 'Catequista', key: 'catechist' },
            { label: 'Padrinho/Madrinha', key: 'godfather' },
        ],
    },
    confirmation: {
        label: 'Crisma',
        description: 'Registros do Sacramento da Confirmação (Crisma).',
        searchPlaceholder: 'Buscar por nome do crismando...',
        emptyMessage: 'Nenhum registro de Crisma encontrado.',
        icon: Flame,
        iconColor: '#f59e0b',
        iconBg: 'rgba(245, 158, 11, 0.1)',
        detailRows: [
            { label: 'Padrinho/Madrinha', key: 'godfather' },
            { label: 'Bispo Celebrante', key: 'bishop' },
        ],
    },
    marriage: {
        label: 'Matrimônios',
        description: 'Gestão de processos e registros matrimoniais.',
        searchPlaceholder: 'Buscar por noivo ou noiva...',
        emptyMessage: 'Nenhum registro de matrimônio encontrado.',
        icon: Heart,
        iconColor: '#ec4899',
        iconBg: 'rgba(236, 72, 153, 0.1)',
        detailRows: [
            { label: 'Contraparte', key: 'spouse' },
            { label: 'Testemunha', key: 'witness1' },
        ],
    },
    anointing_of_sick: {
        label: 'Unção dos Enfermos',
        description: 'Registros do Sacramento da Unção dos Enfermos.',
        searchPlaceholder: 'Buscar por nome do fiel...',
        emptyMessage: 'Nenhum registro de Unção dos Enfermos encontrado.',
        icon: Droplets,
        iconColor: '#6366f1',
        iconBg: 'rgba(99, 102, 241, 0.1)',
        detailRows: [
            { label: 'Local', key: 'location' },
            { label: 'Observações', key: 'notes' },
        ],
    },
};

interface SacramentRegistryProps {
    tenantId: string;
    type: SacramentType;
}

export const SacramentRegistry: React.FC<SacramentRegistryProps> = ({ tenantId, type }) => {
    const [records, setRecords] = useState<Sacrament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'list' | 'form'>('list');
    const [selectedRecord, setSelectedRecord] = useState<Sacrament | null>(null);
    const [editingRecord, setEditingRecord] = useState<Sacrament | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const { activeTenant } = useTenant();

    const config = SACRAMENT_CONFIGS[type];
    const IconComponent = config.icon;

    useEffect(() => {
        fetchRecords();
    }, [tenantId, type]);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const data = await ignisApi.sacraments.getAll(tenantId);
            setRecords(data.filter((r: Sacrament) => r.type === type));
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await ignisApi.sacraments.search(tenantId, searchQuery);
            setRecords(data.filter((r: Sacrament) => r.type === type));
        } catch (error) {
            console.error(`Error searching ${type}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (record: Sacrament) => {
        setEditingRecord(record);
        setView('form');
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await ignisApi.sacraments.delete(id);
            setRecords(prev => prev.filter(r => r.id !== id));
            toast.success('Sacramento excluído com sucesso!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir sacramento');
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const formType = (type === 'first_communion' || type === 'anointing_of_sick')
        ? type as any
        : type as 'baptism' | 'marriage' | 'confirmation';

    const headerActions = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {view === 'list' ? (
                    <button className="btn-primary" onClick={() => { setEditingRecord(null); setView('form'); }}>
                        <Plus size={18} /> Novo Registro
                    </button>
                ) : (
                    <button className="btn-secondary" onClick={() => { setView('list'); setEditingRecord(null); }}>
                        <ArrowLeft size={18} /> Voltar para Lista
                    </button>
                )}
            </div>
            
            {view === 'list' && (
                <form onSubmit={handleSearch} className="search-bar" style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder={config.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px', width: '100%', height: '42px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <button type="submit" className="btn-secondary">
                        <Filter size={18} /> Filtrar
                    </button>
                </form>
            )}
        </div>
    );

    return (
        <div className="module-container fade-in">
            <ModuleHeader
                title={`Sacramenta: ${config.label}`}
                subtitle={config.description}
                icon={Scroll}
                actions={headerActions}
            />

            {view === 'list' ? (
                <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton glass" style={{ height: '140px', borderRadius: '12px' }}></div>)
                    ) : records.length > 0 ? (
                        records.map(record => (
                            <div key={record.id} className="record-card glass hover-effect" style={{ padding: '20px', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                                    <div className="avatar" style={{ width: '40px', height: '40px', backgroundColor: config.iconBg }}>
                                        <IconComponent size={20} style={{ color: config.iconColor }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>{record.subjectName}</h3>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', gap: '10px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={12} /> L{record.bookNumber} F{record.pageNumber}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(record.celebratoryDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} style={{ opacity: 0.3 }} />
                                </div>
                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                    {config.detailRows.map(row => (
                                        <div key={row.key} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                            <span style={{ opacity: 0.5 }}>{row.label}</span>
                                            <span>{record.details?.[row.key] || 'Não informado'}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                        onClick={() => handleEdit(record)}
                                        title="Editar"
                                    >
                                        <Pencil size={14} /> Editar
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                        onClick={() => setSelectedRecord(record)}
                                    >
                                        <Printer size={14} /> Certidão
                                    </button>
                                    {confirmDeleteId === record.id ? (
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>Confirmar?</span>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '6px 10px', fontSize: '0.75rem', backgroundColor: '#ef4444' }}
                                                onClick={() => handleDelete(record.id)}
                                                disabled={deletingId === record.id}
                                            >
                                                {deletingId === record.id ? <Loader2 size={14} className="animate-spin" /> : 'Sim'}
                                            </button>
                                            <button
                                                className="btn-secondary"
                                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                                onClick={() => setConfirmDeleteId(null)}
                                            >
                                                Não
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn-secondary"
                                            style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444' }}
                                            onClick={() => setConfirmDeleteId(record.id)}
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} /> Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state glass" style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            <FileText size={48} style={{ margin: '0 auto 16px' }} />
                            <p>{config.emptyMessage}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="form-container glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
                    <SacramentForm
                        tenantId={tenantId}
                        type={formType}
                        editData={editingRecord}
                        onCancel={() => { setView('list'); setEditingRecord(null); }}
                        onSuccess={() => {
                            setView('list');
                            setEditingRecord(null);
                            fetchRecords();
                            toast.success(editingRecord ? 'Sacramento atualizado com sucesso!' : 'Sacramento registrado com sucesso!');
                        }}
                    />
                </div>
            )}

            {selectedRecord && (
                <CertificatePreview
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    parishName={activeTenant?.name || 'Paróquia'}
                />
            )}
        </div>
    );
};
