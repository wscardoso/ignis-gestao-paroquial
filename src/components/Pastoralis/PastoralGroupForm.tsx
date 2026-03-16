import React, { useState } from 'react';
import { Users, X, Info, UserCheck, CalendarDays, Clock, UserRound } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { PastoralGroup } from '../../services/api';

interface PastoralGroupFormProps {
    tenantId: string;
    group?: PastoralGroup;
    onClose: () => void;
    onSuccess: () => void;
}

const DIAS_SEMANA = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 
    'Sexta-feira', 'Sábado', 'Domingo'
];

export const PastoralGroupForm: React.FC<PastoralGroupFormProps> = ({ tenantId, group, onClose, onSuccess }) => {
    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');
    const [meetingDay, setMeetingDay] = useState(group?.meetingDay || '');
    const [meetingTime, setMeetingTime] = useState(group?.meetingTime || '');
    const [coordinatorName, setCoordinatorName] = useState(group?.coordinatorName || '');
    const [viceName, setViceName] = useState(group?.viceCoordinatorName || '');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (group) {
                // Implement update if needed
            } else {
                await ignisApi.people.createGroup({
                    tenantId,
                    name,
                    description,
                    coordinatorName,
                    viceCoordinatorName: viceName,
                    meetingDay,
                    meetingTime
                });
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar grupo pastoral.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="fade-in glass" style={{ padding: '24px', borderRadius: '16px', position: 'relative', maxWidth: '600px', width: '100%' }}>
            <button type="button" className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={onClose}>
                <X size={20} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} style={{ color: 'var(--accent)' }}/>
                </div>
                <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#fff' }}>{group ? 'Editar Pastoral' : 'Nova Pastoral'}</h2>
                    <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Informe os detalhes do novo grupo, ministério ou pastoral.</span>
                </div>
            </div>

            {error && (
                <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,0,0,0.1)', color: '#ffaaaa', borderRadius: '8px', marginBottom: '20px' }}>
                    <Info size={16} /> {error}
                </div>
            )}

            <div style={{ display: 'grid', gap: '20px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nome da Pastoral <span style={{ color: 'var(--accent)' }}>*</span></label>
                    <input 
                        type="text" required value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="input-field" placeholder="Ex: Pastoral do Dízimo"
                    />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label"><UserCheck size={14} style={{ marginRight: '4px' }}/> Coordenador</label>
                        <input 
                            type="text" value={coordinatorName} 
                            onChange={e => setCoordinatorName(e.target.value)} 
                            className="input-field" placeholder="Nome do coordenador"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label"><UserRound size={14} style={{ marginRight: '4px' }}/> Vice-Coordenador</label>
                        <input 
                            type="text" value={viceName} 
                            onChange={e => setViceName(e.target.value)} 
                            className="input-field" placeholder="Nome do vice"
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label"><CalendarDays size={14} style={{ marginRight: '4px' }}/> Dia do Encontro</label>
                        <select value={meetingDay} onChange={e => setMeetingDay(e.target.value)} className="input-field">
                            <option value="">Selecione o dia...</option>
                            {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label"><Clock size={14} style={{ marginRight: '4px' }}/> Horário</label>
                        <input 
                            type="time" value={meetingTime} 
                            onChange={e => setMeetingTime(e.target.value)} 
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Descrição</label>
                    <textarea 
                        rows={2} value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="input-field" placeholder="Objetivo principal..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', gridColumn: 'span 2' }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Pastoral'}
                    </button>
                </div>
            </div>
        </form>
    );
};
