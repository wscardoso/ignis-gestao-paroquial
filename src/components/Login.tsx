import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Loader2, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [message, setMessage] = useState('');
    const { signInWithPassword, signUp, resetPassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            if (mode === 'signup') {
                await signUp(email, password, fullName);
                setMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar.');
            } else if (mode === 'forgot') {
                await resetPassword(email);
                setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
            } else {
                await signInWithPassword(email, password);
            }
        } catch (error: any) {
            setMessage(error.message || 'Erro ao processar. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="login-logo">
                        <Flame size={48} className="text-primary" />
                    </div>
                    <h1>IGNIS</h1>
                    <p className="login-subtitle">
                        Sistema de Gestão Paroquial
                    </p>
                </div>

                {message && (
                    <div className={`login-message ${message.toLowerCase().includes('erro') || message.toLowerCase().includes('invalid') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label>Nome Completo</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Seu nome completo"
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    {mode !== 'forgot' && (
                        <div className="form-group" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label>Senha</label>
                                {mode === 'login' && (
                                    <button 
                                        type="button" 
                                        onClick={() => setMode('forgot')}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-color, #ff4444)', fontSize: '0.8rem', cursor: 'pointer' }}
                                    >
                                        Esqueceu a senha?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted, #888)',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <button type="submit" className="btn-primary-action" disabled={isLoading} style={{ marginTop: '1rem' }}>
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            mode === 'login' ? (
                                <><LogIn size={18} /> Entrar</>
                            ) : mode === 'signup' ? (
                                <><UserPlus size={18} /> Criar Conta</>
                            ) : (
                                <><LogIn size={18} /> Recuperar Senha</>
                            )
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    {mode === 'login' ? (
                        <button className="btn-secondary" onClick={() => { setMode('signup'); setMessage(''); }}>
                            Não tem conta? Cadastre-se
                        </button>
                    ) : (
                        <button className="btn-secondary" onClick={() => { setMode('login'); setMessage(''); }}>
                            Voltar para o login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
