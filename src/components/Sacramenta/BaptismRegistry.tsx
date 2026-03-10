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
    Printer
} from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Sacrament } from '../../services/api';
import { SacramentForm } from './SacramentForm';
import { CertificatePreview } from './CertificatePreview';
import { useTenant } from '../../contexts/TenantContext';
import '../MatrizDashboard.css'; // Reusing established card and grid styles

interface BaptismRegistryProps {
    tenantId: string;
}

export const BaptismRegistry: React.FC<BaptismRegistryProps> = ({ tenantId }) => {
    const [records, setRecords] = useState<Sacrament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState<'list' | 'form'>('list');
    const [selectedRecord, setSelectedRecord] = useState<Sacrament | null>(null);
    const { activeTenant } = useTenant();

    useEffect(() => {
        const fetchRecords = async () => {
            setIsLoading(true);
            try {
                const data = await ignisApi.sacraments.getAll(tenantId);
                setRecords(data.filter((r: Sacrament) => r.type === 'baptism'));
            } catch (error) {
                console.error('Error fetching sacraments:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [tenantId]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await ignisApi.sacraments.search(tenantId, searchQuery);
            setRecords(data.filter((r: Sacrament) => r.type === 'baptism'));
        } catch (error) {
            console.error('Error searching sacraments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="module-container">
            <header className="module-header glass" style={{ marginBottom: '24px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
                            <Scroll className="text-accent" /> Sacramenta: Batismos
                        </h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Gestão de registros históricos e novos batizados.</p>
                    </div>
                    {view === 'list' ? (
                        <button className="btn-primary" onClick={() => setView('form')}>
                            <Plus size={18} /> Novo Registro
                        </button>
                    ) : (
                        <button className="btn-secondary" onClick={() => setView('list')}>
                            <ArrowLeft size={18} /> Voltar para Lista
                        </button>
                    )}
                </div>

                {view === 'list' && (
                    <form onSubmit={handleSearch} className="search-bar" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="text"
                                placeholder="Buscar por nome do batizado..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '40px', width: '100%', height: '42px', backgroundColor: 'rgba(255,255,255,0.05)' }}
                            />
                        </div>
                        <button type="submit" className="btn-secondary">
                            <Filter size={18} /> Filtrar
                        </button>
                    </form>
                )}
            </header>

            {view === 'list' ? (
                <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="skeleton glass" style={{ height: '140px', borderRadius: '12px' }}></div>)
                    ) : records.length > 0 ? (
                        records.map(record => (
                            <div key={record.id} className="record-card glass hover-effect" style={{ padding: '20px', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                                    <div className="avatar" style={{ width: '40px', height: '40px', backgroundColor: 'var(--accent-color-bg)' }}>
                                        <Flame size={20} className="text-accent" />
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ opacity: 0.5 }}>Padrinho</span>
                                        <span>{record.details?.godfather || 'Não informado'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                        <span style={{ opacity: 0.5 }}>Madrinha</span>
                                        <span>{record.details?.godmother || 'Não informado'}</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                        onClick={() => setSelectedRecord(record)}
                                    >
                                        <Printer size={14} /> Gerar Certidão
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state glass" style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                            <FileText size={48} style={{ margin: '0 auto 16px' }} />
                            <p>Nenhum registro de batismo encontrado.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="form-container glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
                    <SacramentForm
                        tenantId={tenantId}
                        type="baptism"
                        onCancel={() => setView('list')}
                        onSuccess={() => {
                            setView('list');
                            // Refresh list (useEffect will trigger if we add a refresh state or just re-fetch)
                            window.location.reload(); // Simple refresh for now, could be improved with state
                        }}
                    />
                </div>
            )}

            {selectedRecord && (
                <CertificatePreview
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                    parishName={activeTenant?.name || 'Paróquia Santo Estevão'}
                />
            )}
        </div>
    );
};
