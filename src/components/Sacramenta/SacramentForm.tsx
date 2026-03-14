import React, { useState, useEffect } from 'react';
import {
    Save,
    Loader2,
    Users,
    Book,
    Calendar as CalendarIcon,
    Baby,
    Building
} from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Sacrament } from '../../services/api';
import { PersonSearch } from '../common/PersonSearch';
import './Sacramenta.css';

interface SacramentFormProps {
    tenantId: string;
    type: 'baptism' | 'marriage' | 'confirmation' | 'first_communion' | 'anointing_of_sick';
    onSuccess: (data: Sacrament) => void;
    onCancel: () => void;
    editData?: Sacrament | null;
}

export const SacramentForm: React.FC<SacramentFormProps> = ({
    tenantId, type, onSuccess, onCancel, editData
}) => {
    const [isSaving, setIsSaving] = useState(false);

    // Core Fields
    const [subjectName, setSubjectName] = useState('');
    const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
    const [celebratoryDate, setCelebratoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookNumber, setBookNumber] = useState('');
    const [pageNumber, setPageNumber] = useState('');
    const [entryNumber, setEntryNumber] = useState('');

    // Baptism Specific Details
    const [father, setFather] = useState('');
    const [mother, setMother] = useState('');
    const [godfather, setGodfather] = useState('');
    const [godmother, setGodmother] = useState('');
    const [fatherId, setFatherId] = useState<string | undefined>(undefined);
    const [motherId, setMotherId] = useState<string | undefined>(undefined);
    const [godfatherId, setGodfatherId] = useState<string | undefined>(undefined);
    const [godmotherId, setGodmotherId] = useState<string | undefined>(undefined);
    const [birthDate, setBirthDate] = useState('');
    const [birthPlace, setBirthPlace] = useState('');

    // Marriage Specific
    const [spouse, setSpouse] = useState('');
    const [spouseId, setSpouseId] = useState<string | undefined>(undefined);
    const [witness1, setWitness1] = useState('');
    const [witness2, setWitness2] = useState('');

    // Populate form when editing
    useEffect(() => {
        if (editData) {
            setSubjectName(editData.subjectName || '');
            setSubjectId(editData.subjectId || undefined);
            setCelebratoryDate(editData.celebratoryDate || new Date().toISOString().split('T')[0]);
            setBookNumber(editData.bookNumber || '');
            setPageNumber(editData.pageNumber || '');
            setEntryNumber(editData.entryNumber || '');
            const d = editData.details || {};
            setFather(d.father || '');
            setMother(d.mother || '');
            setGodfather(d.godfather || '');
            setGodmother(d.godmother || '');
            setFatherId(d.fatherId || undefined);
            setMotherId(d.motherId || undefined);
            setGodfatherId(d.godfatherId || undefined);
            setGodmotherId(d.godmotherId || undefined);
            setBirthDate(d.birthDate || '');
            setBirthPlace(d.birthPlace || '');
            setSpouse(d.spouse || '');
            setSpouseId(d.spouseId || undefined);
            setWitness1(d.witness1 || '');
            setWitness2(d.witness2 || '');
        }
    }, [editData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const details = {
                father, mother, godfather, godmother,
                fatherId, motherId, godfatherId, godmotherId,
                birthDate, birthPlace, spouse, spouseId,
                witness1, witness2
            };

            if (editData?.id) {
                await ignisApi.sacraments.update(editData.id, {
                    type,
                    subjectName,
                    subjectId,
                    celebratoryDate,
                    bookNumber,
                    pageNumber,
                    entryNumber,
                    details
                });
                onSuccess({ ...editData, subjectName, subjectId, celebratoryDate, bookNumber, pageNumber, entryNumber, details });
            } else {
                const formData: Omit<Sacrament, 'id' | 'createdAt'> = {
                    tenantId, type, subjectName, subjectId,
                    celebratoryDate, bookNumber, pageNumber, entryNumber,
                    details
                };
                const result = await ignisApi.sacraments.create(formData);
                onSuccess(result as Sacrament);
            }
        } catch (error: any) {
            console.error('Error saving sacrament:', error);
            alert(`Erro ao salvar registro: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sacrament-form">
            <div className="form-section">
                <h3 className="section-title"><Book size={18} /> Dados do Livro de Tombo</h3>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label>Livro</label>
                        <input className="input-text" type="text" value={bookNumber} onChange={e => setBookNumber(e.target.value)} required placeholder="Ex: 05-B" />
                    </div>
                    <div className="form-group flex-1">
                        <label>Folha</label>
                        <input className="input-text" type="text" value={pageNumber} onChange={e => setPageNumber(e.target.value)} required placeholder="Ex: 42v" />
                    </div>
                    <div className="form-group flex-1">
                        <label>Termo</label>
                        <input className="input-text" type="text" value={entryNumber} onChange={e => setEntryNumber(e.target.value)} required placeholder="Ex: 156" />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title"><Baby size={18} /> {type === 'baptism' ? 'Dados do Batizado' : type === 'first_communion' ? 'Dados do Comungante' : type === 'confirmation' ? 'Dados do Crismando' : type === 'anointing_of_sick' ? 'Dados do Fiel' : 'Dados do Sujeito'}</h3>
                <div className="form-group">
                    <PersonSearch
                        tenantId={tenantId}
                        label="Nome do Fiel"
                        placeholder="Pesquisar fiel cadastrado..."
                        onSelect={(person) => {
                            if (person) {
                                setSubjectName(person.name);
                                setSubjectId(person.id);
                                if (person.birthDate) setBirthDate(person.birthDate);
                            } else {
                                setSubjectId(undefined);
                            }
                        }}
                    />
                    {!subjectId && (
                        <div style={{ marginTop: '8px' }}>
                            <label style={{ fontSize: '0.75rem', opacity: 0.6 }}>Ou digite o nome se não estiver cadastrado:</label>
                            <input
                                className="input-text"
                                type="text"
                                value={subjectName}
                                onChange={e => setSubjectName(e.target.value)}
                                required={!subjectId}
                                style={{ width: '100%', marginTop: '4px' }}
                            />
                        </div>
                    )}
                </div>
                <div className="form-row">
                    <div className="form-group flex-1">
                        <label><CalendarIcon size={14} /> Data da Celebração</label>
                        <input className="input-text" type="date" value={celebratoryDate} onChange={e => setCelebratoryDate(e.target.value)} required />
                    </div>
                    <div className="form-group flex-1">
                        <label><CalendarIcon size={14} /> Data de Nascimento</label>
                        <input className="input-text" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                    </div>
                </div>
                <div className="form-group">
                    <label><Building size={14} /> Naturalidade / Local de Nascimento</label>
                    <input className="input-text" type="text" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="Ex: São Paulo - SP" />
                </div>
            </div>

            {type === 'baptism' && (
                <div className="form-section">
                    <h3 className="section-title"><Users size={18} /> Filiação e Padrinhos</h3>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Nome do Pai" onSelect={(p) => { setFather(p?.name || ''); setFatherId(p?.id); }} />
                            {!fatherId && <input className="input-text" type="text" value={father} onChange={e => setFather(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Nome da Mãe" onSelect={(p) => { setMother(p?.name || ''); setMotherId(p?.id); }} />
                            {!motherId && <input className="input-text" type="text" value={mother} onChange={e => setMother(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Padrinho / Testemunha" onSelect={(p) => { setGodfather(p?.name || ''); setGodfatherId(p?.id); }} />
                            {!godfatherId && <input className="input-text" type="text" value={godfather} onChange={e => setGodfather(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Madrinha / Testemunha" onSelect={(p) => { setGodmother(p?.name || ''); setGodmotherId(p?.id); }} />
                            {!godmotherId && <input className="input-text" type="text" value={godmother} onChange={e => setGodmother(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                    </div>
                </div>
            )}

            {(type === 'first_communion' || type === 'confirmation') && (
                <div className="form-section">
                    <h3 className="section-title"><Users size={18} /> {type === 'first_communion' ? 'Catequese e Padrinhos' : 'Crisma — Padrinho e Bispo'}</h3>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label={type === 'first_communion' ? 'Catequista' : 'Padrinho/Madrinha de Crisma'} onSelect={(p) => { setGodfather(p?.name || ''); setGodfatherId(p?.id); }} />
                            {!godfatherId && <input className="input-text" type="text" value={godfather} onChange={e => setGodfather(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                        {type === 'confirmation' && (
                            <div className="form-group flex-1">
                                <label>Bispo Celebrante</label>
                                <input className="input-text" type="text" value={witness1} onChange={e => setWitness1(e.target.value)} placeholder="Ex: Dom João da Silva" />
                            </div>
                        )}
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Nome do Pai" onSelect={(p) => { setFather(p?.name || ''); setFatherId(p?.id); }} />
                            {!fatherId && <input className="input-text" type="text" value={father} onChange={e => setFather(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Nome da Mãe" onSelect={(p) => { setMother(p?.name || ''); setMotherId(p?.id); }} />
                            {!motherId && <input className="input-text" type="text" value={mother} onChange={e => setMother(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                    </div>
                </div>
            )}

            {type === 'anointing_of_sick' && (
                <div className="form-section">
                    <h3 className="section-title"><Users size={18} /> Detalhes da Unção</h3>
                    <div className="form-group">
                        <label>Local da Celebração</label>
                        <input className="input-text" type="text" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="Ex: Hospital São Lucas, Residência..." style={{ width: '100%' }} />
                    </div>
                    <div className="form-group">
                        <label>Observações / Condição do Fiel</label>
                        <input className="input-text" type="text" value={witness1} onChange={e => setWitness1(e.target.value)} placeholder="Ex: Enfermo em estado grave, pré-operatório..." style={{ width: '100%' }} />
                    </div>
                </div>
            )}

            {type === 'marriage' && (
                <div className="form-section">
                    <h3 className="section-title"><Users size={18} /> Cônjuges e Testemunhas</h3>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <PersonSearch tenantId={tenantId} label="Contraparte (Cônjuge)" onSelect={(p) => { setSpouse(p?.name || ''); setSpouseId(p?.id); }} />
                            {!spouseId && <input className="input-text" type="text" value={spouse} onChange={e => setSpouse(e.target.value)} placeholder="Ou digite o nome" style={{ marginTop: '8px' }} />}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label>Testemunha 1</label>
                            <input className="input-text" type="text" value={witness1} onChange={e => setWitness1(e.target.value)} />
                        </div>
                        <div className="form-group flex-1">
                            <label>Testemunha 2</label>
                            <input className="input-text" type="text" value={witness2} onChange={e => setWitness2(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    <span>{editData ? 'Atualizar Registro' : 'Salvar Registro'}</span>
                </button>
            </div>
        </form>
    );
};
