import React, { useState, useEffect } from 'react';
import {
    Flame,
    Heart,
    Award,
    Calendar,
    BookOpen,
    Users,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Sacrament } from '../../services/api';

interface SacramentalHistoryProps {
    tenantId: string;
    personId: string;
}

export const SacramentalHistory: React.FC<SacramentalHistoryProps> = ({ tenantId, personId }) => {
    const [history, setHistory] = useState<Sacrament[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const data = await ignisApi.sacraments.getByPerson(tenantId, personId);
                setHistory(data);
            } catch (error) {
                console.error('Error fetching sacramental history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [tenantId, personId]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'baptism': return <Flame size={18} className="text-accent" />;
            case 'marriage': return <Heart size={18} style={{ color: '#ec4899' }} />;
            case 'confirmation': return <Award size={18} style={{ color: '#f59e0b' }} />;
            default: return <BookOpen size={18} />;
        }
    };

    const getLabel = (type: string) => {
        switch (type) {
            case 'baptism': return 'Batismo';
            case 'marriage': return 'Matrimônio';
            case 'confirmation': return 'Crisma';
            default: return type;
        }
    };

    if (isLoading) {
        return (
            <div className="history-loading">
                {[1, 2].map(i => (
                    <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px', marginBottom: '12px', opacity: 0.1 }}></div>
                ))}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="empty-history glass" style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>
                <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.9rem' }}>Nenhum registro sacramental vinculado a este fiel.</p>
            </div>
        );
    }

    return (
        <div className="sacramental-history-timeline">
            {history.map((record, index) => (
                <div key={record.id} className="timeline-item" style={{ position: 'relative', paddingLeft: '40px', marginBottom: '25px' }}>
                    {/* Timeline vertical line */}
                    {index !== history.length - 1 && (
                        <div style={{
                            position: 'absolute',
                            left: '18px',
                            top: '40px',
                            bottom: '-25px',
                            width: '2px',
                            backgroundColor: 'rgba(255,255,255,0.05)'
                        }}></div>
                    )}

                    {/* Timeline Node */}
                    <div style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                    }}>
                        {getIcon(record.type)}
                    </div>

                    <div className="record-details glass" style={{
                        padding: '16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: expandedItem === record.id ? '1px solid var(--accent-color)' : '1px solid transparent'
                    }} onClick={() => setExpandedItem(expandedItem === record.id ? null : record.id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ margin: '0', fontSize: '1rem', fontWeight: '600' }}>{getLabel(record.type)}</h4>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', gap: '15px', marginTop: '4px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(record.celebratoryDate).toLocaleDateString()}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={12} /> L{record.bookNumber} F{record.pageNumber}</span>
                                </div>
                            </div>
                            {expandedItem === record.id ? <ChevronUp size={18} opacity={0.3} /> : <ChevronDown size={18} opacity={0.3} />}
                        </div>

                        {expandedItem === record.id && (
                            <div className="expanded-content" style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.85rem',
                                animation: 'fadeIn 0.3s ease-out'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="info-box">
                                        <span style={{ opacity: 0.4, display: 'block', fontSize: '0.7rem' }}>Participação</span>
                                        <span style={{ fontWeight: '500' }}>{record.subjectId === personId ? 'Sujeito (Recebeu)' : 'Vínculo Familiar/Madrinha'}</span>
                                    </div>
                                    <div className="info-box">
                                        <span style={{ opacity: 0.4, display: 'block', fontSize: '0.7rem' }}>Termo/Registro</span>
                                        <span style={{ fontWeight: '500' }}>#{record.entryNumber}</span>
                                    </div>
                                    <div className="info-box" style={{ gridColumn: '1 / -1' }}>
                                        <span style={{ opacity: 0.4, display: 'block', fontSize: '0.7rem' }}><Users size={10} /> Personagens Internos</span>
                                        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            {record.details?.father && <div>Pai: {record.details.father}</div>}
                                            {record.details?.mother && <div>Mãe: {record.details.mother}</div>}
                                            {record.details?.godfather && <div>Padrinho: {record.details.godfather}</div>}
                                            {record.details?.godmother && <div>Madrinha: {record.details.godmother}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
