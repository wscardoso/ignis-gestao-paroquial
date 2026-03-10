import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { ignisApi } from '../services/api';
import './OnboardingModal.css';

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

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await ignisApi.tenants.create({
                name: formData.name,
                cnpj: formData.cnpj
            });

            // Show toast or feedback here in future
            alert("Paróquia criada com a graça de Deus! 🙏");

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            alert("Erro ao criar paróquia.");
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
                            />
                        </div>
                    </div>

                    <div className="section-divider">
                        <span>Configuração de Sistema</span>
                    </div>

                    <div className="form-group">
                        <label>Módulos Iniciais</label>
                        <div className="modules-selection">
                            {['Sacramenta', 'Missio', 'Pastoralis', 'Communio', 'Administratio'].map(mod => (
                                <label key={mod} className="checkbox-item">
                                    <input type="checkbox" defaultChecked={mod === 'Sacramenta'} />
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
