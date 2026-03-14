import React, { useState } from 'react';
import { Users, X, Info } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { PastoralGroup } from '../../services/api';

interface PastoralGroupFormProps {
    tenantId: string;
    group?: PastoralGroup;
    onClose: () => void;
    onSuccess: () => void;
}

export const PastoralGroupForm: React.FC<PastoralGroupFormProps> = ({ tenantId, group, onClose, onSuccess }) => {
    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');
    const [schedule, setSchedule] = useState(group?.schedule || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (group) {
                // await ignisApi.pastoralis.updateGroup(group.id, { name, description, schedule });
            } else {
                await ignisApi.people.createGroup({
                    tenantId: tenantId,
                    name,
                    description,
                    schedule
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
                    <Users size={24} style={{ color: 'var(--accent)' }}/>
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

                <div className="form-group">
                    <label className="form-label">Horário de Encontros</label>
                    <input 
                        type="text" 
                        value={schedule} 
                        onChange={e => setSchedule(e.target.value)} 
                        className="input-field"
                        placeholder="Ex: Terças-feiras às 19h30"
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
