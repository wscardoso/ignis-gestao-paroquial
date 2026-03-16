import React, { useState, useEffect } from 'react';
import { Users, X, Info } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { PastoralGroup, Person } from '../../services/api';

interface PastoralGroupFormProps {
    tenantId: string;
    group?: PastoralGroup;
    onClose: () => void;
    onSuccess: () => void;
}

const DAYS_OF_WEEK = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
];

function parseSchedule(schedule?: string): { day: string; time: string } {
    if (!schedule) return { day: '', time: '' };
    // Tries to parse "Quarta-feira às 19:00"
    const match = schedule.match(/^(.+?)\s+às\s+(\d{2}:\d{2})$/);
    if (match) return { day: match[1], time: match[2] };
    return { day: schedule, time: '' };
}

export const PastoralGroupForm: React.FC<PastoralGroupFormProps> = ({ tenantId, group, onClose, onSuccess }) => {
    const parsed = parseSchedule(group?.schedule);

    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');
    const [meetingDay, setMeetingDay] = useState(parsed.day);
    const [meetingTime, setMeetingTime] = useState(parsed.time);
    const [coordinatorId, setCoordinatorId] = useState(group?.coordinatorId || '');
    const [viceCoordinatorId, setViceCoordinatorId] = useState(group?.viceCoordinatorId || '');
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        ignisApi.people.getAll(tenantId)
            .then(setPeople)
            .catch(() => setPeople([]));
    }, [tenantId]);

    const buildSchedule = () => {
        if (!meetingDay && !meetingTime) return '';
        if (meetingDay && meetingTime) return `${meetingDay} às ${meetingTime}`;
        return meetingDay || meetingTime;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const schedule = buildSchedule();

        try {
            if (group) {
                await ignisApi.people.updateGroup(group.id, {
                    name,
                    description,
                    schedule,
                    coordinatorId: coordinatorId || undefined,
                    viceCoordinatorId: viceCoordinatorId || undefined,
                });
            } else {
                await ignisApi.people.createGroup({
                    tenantId,
                    name,
                    description,
                    schedule,
                    coordinatorId: coordinatorId || undefined,
                    viceCoordinatorId: viceCoordinatorId || undefined,
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
        <form onSubmit={handleSubmit} className="fade-in glass" style={{ padding: '24px', borderRadius: '16px', position: 'relative' }}>
            <button type="button" className="btn-icon" style={{ position: 'absolute', top: '16px', right: '16px' }} onClick={onClose}>
                <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{group ? 'Editar Pastoral' : 'Nova Pastoral'}</h2>
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
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input-field"
                        placeholder="Ex: Pastoral do Dízimo"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="input-field"
                        placeholder="Objetivo principal deste grupo..."
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Coordenador</label>
                        <select
                            value={coordinatorId}
                            onChange={e => setCoordinatorId(e.target.value)}
                            className="input-field"
                        >
                            <option value="">— Selecionar pessoa —</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Vice-Coordenador</label>
                        <select
                            value={viceCoordinatorId}
                            onChange={e => setViceCoordinatorId(e.target.value)}
                            className="input-field"
                        >
                            <option value="">— Selecionar pessoa —</option>
                            {people.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Horário de Encontros</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                        <select
                            value={meetingDay}
                            onChange={e => setMeetingDay(e.target.value)}
                            className="input-field"
                        >
                            <option value="">— Dia da semana —</option>
                            {DAYS_OF_WEEK.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <input
                            type="time"
                            value={meetingTime}
                            onChange={e => setMeetingTime(e.target.value)}
                            className="input-field"
                            style={{ width: '130px' }}
                        />
                    </div>
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
