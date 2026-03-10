import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Loader2, Mail } from 'lucide-react';
import './Login.css';

import { useTenant } from '../contexts/TenantContext';

export const Login: React.FC = () => {
    const { activeTenant } = useTenant();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { signIn, devBypass } = useAuth(); // Assuming we add devBypass to useAuth

    const handleDevBypass = () => {
        if (devBypass) {
            devBypass('w.cardoso@digitallforce.com.br');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signIn(email);
            setSent(true);
        } catch (error) {
            alert('Erro ao enviar link de acesso. O limite do Supabase foi atingido. Tente novamente em alguns minutos ou use o bypass (clicando no logo).');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="login-logo" onClick={handleDevBypass} style={{ cursor: 'pointer' }} title="Dev Bypass">
                        <Flame size={48} className="text-primary" />
                    </div>
                    <h1>IGNIS</h1>
                    <p className="login-subtitle">
                        {activeTenant?.slogan || 'Sistema de Gestão Pastoral'}
                    </p>
                </div>

                {sent ? (
                    <div className="login-success">
                        <div className="success-icon">
                            <Mail size={32} />
                        </div>
                        <h3>Verifique seu email</h3>
                        <p>Enviamos um link mágico de acesso para <strong>{email}</strong></p>
                        <button className="btn-secondary" onClick={() => setSent(false)}>
                            Voltar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>Email Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary-action" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar com Link Mágico'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
