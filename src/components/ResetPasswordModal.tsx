import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import './UserProfileModal.css'; // Reusing some premium styles

export const ResetPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'As senhas não coincidem.' });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            setStatus({ type: 'success', message: 'Senha atualizada com sucesso!' });
            setTimeout(() => {
                onClose();
                // We might want to clear the recovery state or just let the app reload
                window.location.reload(); 
            }, 2000);
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || 'Erro ao atualizar senha.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass" style={{ maxWidth: '400px', width: '90%' }}>
                <div className="modal-header">
                    <div className="modal-icon-wrapper">
                        <Lock size={20} className="text-primary" />
                    </div>
                    <div>
                        <h2>Nova Senha</h2>
                        <p className="modal-subtitle">Defina sua nova credencial de acesso</p>
                    </div>
                </div>

                <form onSubmit={handleReset} className="modal-form" style={{ marginTop: '1.5rem' }}>
                    <div className="form-group">
                        <label>Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            required
                            minLength={6}
                        />
                    </div>

                    {status && (
                        <div className={`status-message ${status.type}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', backgroundColor: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: status.type === 'success' ? '#22c55e' : '#ef4444' }}>
                            {status.type === 'success' ? <CheckCircle size={16} /> : null}
                            {status.message}
                        </div>
                    )}

                    <button type="submit" className="btn-primary-action" disabled={isLoading} style={{ width: '100%' }}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Atualizar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};
