import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../services/supabase';
import './OnboardingModal.css'; // Reusing modal styles

interface ModuleToggleModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: { id: string; name: string; active_modules?: string[] } | null;
    onSuccess: () => void;
}

const ALL_MODULES = [
    { id: 'sacramenta', label: 'Sacramenta', description: 'Gestão de Sacramentos e Liturgia' },
    { id: 'missio', label: 'Missio', description: 'Operação e Grade de Agendamentos' },
    { id: 'pastoralis', label: 'Pastoralis', description: 'Gestão de Pessoas e Clero' },
    { id: 'communio', label: 'Communio', description: 'Comunicação e Engajamento' },
    { id: 'administratio', label: 'Administratio', description: 'Governança e Configurações' },
];

export const ModuleToggleModal: React.FC<ModuleToggleModalProps> = ({
    isOpen, onClose, tenant, onSuccess
}) => {
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (tenant) {
            setSelectedModules(tenant.active_modules || ALL_MODULES.map(m => m.id));
        }
    }, [tenant, isOpen]);

    if (!isOpen || !tenant) return null;

    const toggleModule = (moduleId: string) => {
        setSelectedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .update({ active_modules: selectedModules })
                .eq('id', tenant.id);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating modules:', error);
            alert('Erro ao atualizar módulos.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="onboarding-modal-overlay" onClick={onClose}>
            <div className="onboarding-modal glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-content-inner">
                    <div className="modal-header-row">
                        <h2>Gerenciar Módulos</h2>
                        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                    </div>

                    <p className="section-description" style={{ marginBottom: '20px' }}>
                        Selecione quais módulos estarão ativos para <strong>{tenant.name}</strong>.
                    </p>

                    <div className="modules-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {ALL_MODULES.map(module => (
                            <div
                                key={module.id}
                                className={`module-toggle-item ${selectedModules.includes(module.id) ? 'active' : ''}`}
                                onClick={() => toggleModule(module.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    border: '1px solid transparent',
                                    borderColor: selectedModules.includes(module.id) ? 'var(--accent-color)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {selectedModules.includes(module.id) ? (
                                    <CheckSquare size={20} className="text-accent" />
                                ) : (
                                    <Square size={20} style={{ opacity: 0.3 }} />
                                )}
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{module.label}</div>
                                    <div style={{ fontSize: '12px', opacity: 0.6 }}>{module.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="modal-actions" style={{ marginTop: '30px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ minWidth: '120px' }}
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Salvar Configuração</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
