import React, { useState } from 'react';
import { Calendar, Clock, Settings, Save, X, Info, Users, Plus, Trash2, Loader2 } from 'lucide-react';
import './UnitSettingsModal.css';
import type { Community } from '../services/api';
import { ignisApi } from '../services/api';
import { useTenant } from '../contexts/TenantContext';

interface UnitSettingsModalProps {
    onClose: () => void;
    unit: Community | null; // null means adding new
}

type Tab = 'data' | 'schedule' | 'rules' | 'users';

export const UnitSettingsModal: React.FC<UnitSettingsModalProps> = ({ onClose, unit }) => {
    const [activeTab, setActiveTab] = useState<Tab>(unit ? 'data' : 'data'); // Start on data for both
    const [name, setName] = useState(unit?.name || '');
    const [address, setAddress] = useState(unit?.address || '');
    const [isLoading, setIsLoading] = useState(false);
    const { activeTenant } = useTenant();

    const handleSave = async () => {
        if (!activeTenant) return;
        setIsLoading(true);
        try {
            if (unit) {
                // Update
                await ignisApi.communities.update(unit.id, { name, address });
            } else {
                // Create
                await ignisApi.communities.create({
                    tenantId: activeTenant.id,
                    name,
                    address,
                    status: 'active'
                });
            }
            onClose();
        } catch (error) {
            console.error('Error saving community:', error);
            alert('Erro ao salvar unidade.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="settings-modal glass">
                <div className="modal-header">
                    <div className="modal-title-row">
                        <Settings size={20} className="text-accent" />
                        <h2>{unit ? `Configurações - ${unit.name}` : 'Nova Unidade'}</h2>
                    </div>
                    <button onClick={onClose} className="btn-close"><X size={20} /></button>
                </div>

                <div className="settings-tabs">
                    <button className={`tab-item ${activeTab === 'data' ? 'active' : ''}`} onClick={() => setActiveTab('data')}>
                        <Info size={16} /> Dados
                    </button>
                    {unit && (
                        <>
                            <button className={`tab-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                                <Users size={16} /> Equipe
                            </button>
                            <button className={`tab-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                                <Calendar size={16} /> Horários
                            </button>
                            <button className={`tab-item ${activeTab === 'rules' ? 'active' : ''}`} onClick={() => setActiveTab('rules')}>
                                <Clock size={16} /> Regras
                            </button>
                        </>
                    )}
                </div>

                <div className="modal-body">
                    {activeTab === 'data' && (
                        <div className="data-tab">
                            <div className="form-group">
                                <label>Nome da Unidade</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Capela Santo Antônio"
                                    className="input-text"
                                />
                            </div>
                            <div className="form-group">
                                <label>Endereço</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Rua, Número, Bairro..."
                                    className="input-text"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="users-tab">
                            <div className="form-group">
                                <label>Responsável (Clero)</label>
                                <select className="input-select">
                                    <option>Selecionar Padre/Diácono...</option>
                                    <option>Pe. Carlos</option>
                                    <option>Pe. João</option>
                                    <option>Diác. José</option>
                                </select>
                            </div>

                            <div className="section-divider-small">
                                <span>Acesso Administrativo</span>
                                <button className="btn-small-add"><Plus size={12} /> Adicionar</button>
                            </div>

                            <div className="user-list-mini">
                                <div className="user-row">
                                    <div className="user-avatar-mini">M</div>
                                    <div className="user-info-mini">
                                        <span className="user-name">Maria Silva</span>
                                        <span className="user-role">Secretária</span>
                                    </div>
                                    <button className="btn-icon-mini"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="rules-grid">
                            <div className="form-group">
                                <label>Duração Padrão (Confissão)</label>
                                <div className="input-suffix">
                                    <input type="number" defaultValue={15} />
                                    <span>minutos</span>
                                </div>
                            </div>
                            {/* ... more rules ... */}
                            <p className="hint text-muted">Regras para agendamentos e atendimentos nesta unidade.</p>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="schedule-config">
                            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                                <div key={day} className="day-row">
                                    <div className="day-toggle">
                                        <label className="switch">
                                            <input type="checkbox" defaultChecked={day !== 'Sábado'} />
                                            <span className="slider round"></span>
                                        </label>
                                        <span className="day-name">{day}</span>
                                    </div>
                                    <div className="time-range">
                                        <input type="time" defaultValue="08:00" />
                                        <span>até</span>
                                        <input type="time" defaultValue="18:00" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-cancel" disabled={isLoading}>Cancelar</button>
                    <button className="btn-save" onClick={handleSave} disabled={isLoading || !name}>
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>{unit ? 'Salvar Alterações' : 'Criar Unidade'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
