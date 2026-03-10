import React, { useState } from 'react';
import {
    Save,
    Camera,
    MapPin,
    Phone,
    Mail,
    Calendar,
    Tag,
    Shield,
    Loader2
} from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Person } from '../../services/api';

interface PersonFormProps {
    tenantId: string;
    person?: Person;
    onSuccess: (data: Person) => void;
    onCancel: () => void;
}

export const PersonForm: React.FC<PersonFormProps> = ({
    tenantId, person, onSuccess, onCancel
}) => {
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState(person?.name || '');
    const [cpf, setCpf] = useState(person?.cpf || '');
    const [birthDate, setBirthDate] = useState(person?.birthDate || '');
    const [email, setEmail] = useState(person?.email || '');
    const [phone, setPhone] = useState(person?.phone || '');
    const [address, setAddress] = useState(person?.address || '');
    const [status, setStatus] = useState<Person['status']>(person?.status || 'active');
    const [groupInput, setGroupInput] = useState('');
    const [groups, setGroups] = useState<string[]>(person?.groups || []);

    const addGroup = () => {
        if (groupInput.trim() && !groups.includes(groupInput.trim())) {
            setGroups([...groups, groupInput.trim()]);
            setGroupInput('');
        }
    };

    const removeGroup = (tag: string) => {
        setGroups(groups.filter(g => g !== tag));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const data: any = {
                id: person?.id,
                tenantId,
                name,
                cpf,
                birthDate,
                email,
                phone,
                address,
                status,
                groups,
                sacramentsData: person?.sacramentsData || {}
            };

            const result = await ignisApi.people.upsert(data);
            onSuccess(result as Person);
        } catch (error) {
            console.error('Error saving person:', error);
            alert('Erro ao salvar cadastro.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="person-form">
            <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', alignItems: 'center' }}>
                <div className="photo-upload-container" style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontSize: '0.7rem'
                }}>
                    <Camera size={24} style={{ opacity: 0.5, marginBottom: '4px' }} />
                    <span style={{ opacity: 0.5 }}>Foto</span>
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Cadastro de Fiel</h3>
                    <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>Informações pessoais e vinculação pastoral.</p>
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title"><Shield size={16} /> Identificação Básica</h4>
                <div className="form-group">
                    <label>Nome Completo</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label>CPF (Opcional)</label>
                        <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div className="form-group flex-1">
                        <label><Calendar size={14} /> Data de Nascimento</label>
                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title"><Phone size={16} /> Contato e Localização</h4>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label><Phone size={14} /> WhatsApp / Telefone</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="form-group flex-1">
                        <label><Mail size={14} /> Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemplo@email.com" />
                    </div>
                </div>
                <div className="form-group">
                    <label><MapPin size={14} /> Endereço Completo</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade - UF" />
                </div>
            </div>

            <div className="form-section">
                <h4 className="section-title"><Tag size={16} /> Participação e Status</h4>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label>Situação na Paróquia</label>
                        <select value={status} onChange={e => setStatus(e.target.value as any)}>
                            <option value="active">Ativo / Frequentador</option>
                            <option value="inactive">Inativo / Afastado</option>
                            <option value="deceased">Falecido</option>
                        </select>
                    </div>
                    <div className="form-group flex-1">
                        <label>Pastorais / Grupos</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={groupInput}
                                onChange={e => setGroupInput(e.target.value)}
                                placeholder="Ex: ECC, Dizimista"
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addGroup())}
                            />
                            <button type="button" className="btn-secondary" onClick={addGroup} style={{ padding: '0 12px' }}>+</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                            {groups.map(tag => (
                                <span key={tag} className="badge-accent" style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    cursor: 'pointer'
                                }} onClick={() => removeGroup(tag)}>
                                    {tag} ✕
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '30px' }}>
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>{person ? 'Atualizar Cadastro' : 'Confirmar Cadastro'}</span>
                </button>
            </div>
        </form>
    );
};
