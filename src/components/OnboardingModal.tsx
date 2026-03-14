import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import './OnboardingModal.css';

const ALL_MODULES = ['Sacramenta', 'Missio', 'Pastoralis', 'Communio', 'Administratio'];
const MODULE_IDS: Record<string, string> = {
    Sacramenta: 'sacramenta',
    Missio: 'missio',
    Pastoralis: 'pastoralis',
    Communio: 'communio',
    Administratio: 'administratio',
};

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        diocese: '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
    });
    const [selectedModules, setSelectedModules] = useState<string[]>(['sacramenta']);

    if (!isOpen) return null;

    const toggleModule = (mod: string) => {
        const id = MODULE_IDS[mod];
        setSelectedModules(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-parish-admin', {
                body: {
                    name: formData.name,
                    cnpj: formData.cnpj,
                    diocese: formData.diocese,
                    adminName: formData.adminName,
                    adminEmail: formData.adminEmail,
                    adminPassword: formData.adminPassword,
                    modules: selectedModules,
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            toast.success('Paróquia criada com a graça de Deus! 🙏');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao criar paróquia.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <div className="modal-header">
                    <h2 className="modal-title">Novo Onboarding de Paróquia</h2>
                    <button className="close-btn" onClick={onClose} disabled={isLoading}>
                        <X size={24} />
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nome da Paróquia</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text"
                            placeholder="Ex: Paróquia São Judas Tadeu"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>CNPJ</label>
                            <input
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                type="text"
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        <div className="form-group">
                            <label>Diocese</label>
                            <input
                                name="diocese"
                                value={formData.diocese}
                                onChange={handleChange}
                                type="text"
                                placeholder="Ex: Arquidiocese de São Paulo"
                            />
                        </div>
                    </div>

                    <div className="section-divider">
                        <span>Dados do Administrador</span>
                    </div>

                    <div className="form-group">
                        <label>Nome do Pároco/Gestor</label>
                        <input
                            name="adminName"
                            value={formData.adminName}
                            onChange={handleChange}
                            type="text"
                            placeholder="Ex: Pe. João Silva"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email Corporativo</label>
                            <input
                                name="adminEmail"
                                value={formData.adminEmail}
                                onChange={handleChange}
                                type="email"
                                placeholder="paroco@diocese.org"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Senha Provisória</label>
                            <input
                                name="adminPassword"
                                value={formData.adminPassword}
                                onChange={handleChange}
                                type="password"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="section-divider">
                        <span>Configuração de Sistema</span>
                    </div>

                    <div className="form-group">
                        <label>Módulos Iniciais</label>
                        <div className="modules-selection">
                            {ALL_MODULES.map(mod => (
                                <label key={mod} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedModules.includes(MODULE_IDS[mod])}
                                        onChange={() => toggleModule(mod)}
                                    />
                                    <span>{mod}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>Cancelar</button>
                        <button type="submit" className="btn-submit" disabled={isLoading}>
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            <span>{isLoading ? 'Criando...' : 'Concluir Onboarding'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
