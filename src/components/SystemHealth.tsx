import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Zap, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../services/supabase';
import './SystemHealth.css';

export const SystemHealth: React.FC = () => {
    const [isVigiliaMode, setIsVigiliaMode] = useState(false);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [lastSync, setLastSync] = useState<string>('');
    const [latency, setLatency] = useState<number | null>(null);

    useEffect(() => {
        const checkConnection = async () => {
            const start = performance.now();
            try {
                const { error } = await supabase.from('tenants').select('id', { head: true, count: 'exact' });
                const elapsed = Math.round(performance.now() - start);
                setLatency(elapsed);
                setIsConnected(!error);
                setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            } catch {
                setIsConnected(false);
                setLatency(null);
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="health-container glass">
            <div className="health-grid">
                <div className="health-card">
                    <div className="health-header">
                        <Activity size={18} className={isConnected ? 'icon-pulse' : ''} />
                        <span>Saúde do Sistema</span>
                    </div>
                    <div className={`health-status ${isConnected === false ? 'health-error' : ''}`}>
                        {isConnected === null ? 'Verificando...' : isConnected ? 'Operacional' : 'Offline'}
                    </div>
                    <div className="health-metrics">
                        <div className="metric">
                            <span className="label">Conexão</span>
                            <span className="value">
                                {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                                {' '}{isConnected ? 'Supabase OK' : 'Sem conexão'}
                            </span>
                        </div>
                        <div className="metric">
                            <span className="label">Latência</span>
                            <span className="value">{latency !== null ? `${latency}ms` : '—'}</span>
                        </div>
                        <div className="metric">
                            <span className="label">Última Sync</span>
                            <span className="value">{lastSync || '—'}</span>
                        </div>
                    </div>
                </div>

                <div className="health-card vigilia-card">
                    <div className="health-header">
                        <ShieldAlert size={18} />
                        <span>Modo Vigília</span>
                    </div>
                    <p className="vigilia-desc">Desativa acessos públicos para manutenção profunda.</p>
                    <div className="vigilia-controls">
                        <button
                            className={`toggle-vigilia ${isVigiliaMode ? 'on' : 'off'}`}
                            onClick={() => setIsVigiliaMode(!isVigiliaMode)}
                        >
                            <Zap size={14} fill={isVigiliaMode ? 'currentColor' : 'none'} />
                            <span>{isVigiliaMode ? 'Modo Vigília Ativo' : 'Ativar Vigília'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
