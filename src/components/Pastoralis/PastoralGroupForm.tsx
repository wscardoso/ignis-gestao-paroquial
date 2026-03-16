import React, { useState, useEffect } from 'react';
import { Users, X, Info, UserCheck, CalendarDays, Clock } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { PastoralGroup, Person } from '../../services/api';

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
    const [coordinatorId, setCoordinatorId] = useState(group?.coordinatorId || '');
    const [viceId, setViceId] = useState(group?.viceCoordinatorId || '');
    
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const data = await ignisApi.people.getAll(tenantId);
                setPeople(data);
            } catch (err) {
                console.error('Erro ao carregar pessoas:', err);
            }
        };
        fetchPeople();
    }, [tenantId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (group) {
                // Implement update if needed
                // await ignisApi.people.updateGroup(group.id, { ... });
            } else {
                await ignisApi.people.createGroup({
                    tenantId,
                    name,
                    description,
                    coordinatorId: coordinatorId || undefined,
                    viceCoordinatorId: viceId || undefined,
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
                <div className="form-group">
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
                        <select value={coordinatorId} onChange={e => setCoordinatorId(e.target.value)} className="input-field">
                            <option value="">Selecionar...</option>
                            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Vice-Coordenador</label>
                        <select value={viceId} onChange={e => setViceId(e.target.value)} className="input-field">
                            <option value="">Selecionar...</option>
                            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
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

                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <textarea 
                        rows={2} value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        className="input-field" placeholder="Objetivo principal..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Salvar Pastoral'}
                    </button>
                </div>
            </div>
        </form>
    );
};
