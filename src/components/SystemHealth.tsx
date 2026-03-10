import React, { useState } from 'react';
import { Activity, ShieldAlert, Zap, Server } from 'lucide-react';
import './SystemHealth.css';

export const SystemHealth: React.FC = () => {
    const [isVigiliaMode, setIsVigiliaMode] = useState(false);

    return (
        <div className="health-container glass">
            <div className="health-grid">
                <div className="health-card">
                    <div className="health-header">
                        <Activity size={18} className="icon-pulse" />
                        <span>Saúde do Sistema</span>
                    </div>
                    <div className="health-status">Operacional</div>
                    <div className="health-metrics">
                        <div className="metric">
                            <span className="label">Uptime</span>
                            <span className="value">99.98%</span>
                        </div>
                        <div className="metric">
                            <span className="label">Latência API</span>
                            <span className="value">42ms</span>
                        </div>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-header">
                        <Server size={18} />
                        <span>Infraestrutura</span>
                    </div>
                    <div className="infra-status">
                        <div className="region-pill">US-EAST-1 (Ativo)</div>
                        <div className="region-pill">SA-EAST-1 (Backup)</div>
                    </div>
                    <div className="load-bar">
                        <div className="load-fill" style={{ width: '32%' }}></div>
                    </div>
                    <span className="load-text">Uso de CPU: 32%</span>
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
