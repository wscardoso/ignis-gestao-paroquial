import React from 'react';
import {
    X,
    User,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Shield,
    History,
    Edit2
} from 'lucide-react';
import type { Person } from '../../services/api';
import { SacramentalHistory } from './SacramentalHistory';

interface PersonDetailsProps {
    tenantId: string;
    person: Person;
    onClose: () => void;
    onEdit: () => void;
}

export const PersonDetails: React.FC<PersonDetailsProps> = ({
    tenantId, person, onClose, onEdit
}) => {
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Ativo';
            case 'inactive': return 'Inativo';
            case 'deceased': return 'Falecido';
            default: return status;
        }
    };

    return (
        <div className="person-details-overlay glass-heavy" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="person-details-modal glass" style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Modal Header */}
                <header style={{
                    padding: '25px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)'
                }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '2px solid rgba(255,255,255,0.1)'
                        }}>
                            {person.photoUrl ? (
                                <img src={person.photoUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <User size={40} style={{ opacity: 0.2 }} />
                            )}
                        </div>
                        <div>
                            <h2 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '700' }}>{person.name}</h2>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <span className="badge-status" style={{
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    opacity: 0.7
                                }}>{getStatusLabel(person.status)}</span>
                                {person.groups?.map(g => (
                                    <span key={g} style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--accent-color)',
                                        backgroundColor: 'rgba(197, 160, 89, 0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={onEdit} className="btn-icon" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <Edit2 size={18} />
                        </button>
                        <button onClick={onClose} className="btn-icon" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <X size={18} />
                        </button>
                    </div>
                </header>

                {/* Modal Body */}
                <div style={{ padding: '25px' }}>
                    <div className="details-section" style={{ marginBottom: '30px' }}>
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', marginBottom: '20px', color: 'var(--accent-color)' }}>
                            <Shield size={18} /> Perfil do Fiel
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <InfoItem icon={<Calendar size={14} />} label="Nascimento" value={person.birthDate ? new Date(person.birthDate).toLocaleDateString() : 'N/A'} />
                            <InfoItem icon={<Shield size={14} />} label="CPF" value={person.cpf || 'N/A'} />
                            <InfoItem icon={<Phone size={14} />} label="WhatsApp" value={person.phone || 'N/A'} />
                            <InfoItem icon={<Mail size={14} />} label="Email" value={person.email || 'N/A'} />
                            <InfoItem icon={<MapPin size={14} />} label="Endereço" value={person.address || 'Não informado'} fullWidth />
                        </div>
                    </div>

                    <div className="details-section">
                        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', marginBottom: '20px', color: 'var(--accent-color)' }}>
                            <History size={18} /> Vida Sacramental
                        </h3>
                        <SacramentalHistory tenantId={tenantId} personId={person.id} />
                    </div>
                </div>

                {/* Modal Footer */}
                <footer style={{ padding: '20px 25px', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.3 }}>ID Global: {person.id}</p>
                </footer>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value, fullWidth = false }: { icon: any, label: string, value: string, fullWidth?: boolean }) => (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', marginBottom: '4px' }}>
            {icon} {label}
        </span>
        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{value}</span>
    </div>
);
