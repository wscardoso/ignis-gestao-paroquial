import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Users, MapPin, Search, TrendingUp } from 'lucide-react';
import { ignisApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './LocalGovernancePanel.css';

export const LocalGovernancePanel: React.FC = () => {
    const { profile } = useAuth();
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLocalStats = async () => {
            if (!profile?.tenant_id) return;
            setIsLoading(true);
            try {
                const data = await ignisApi.governance.getLocalStats(profile.tenant_id);
                setStats(data);
            } catch (error) {
                console.error('Error fetching local governance stats:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLocalStats();
    }, [profile?.tenant_id]);

    if (isLoading) {
        return (
            <div className="local-governance-container">
                <div className="loading-state glass">
                    <Shield className="animate-pulse text-accent" size={48} />
                    <p>Carregando Inteligência Pastoral...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="local-governance-container fade-in">
            <div className="governance-header">
                <div className="header-info">
                    <Shield className="text-accent" size={32} />
                    <div>
                        <h2>Estratégia Pastoral</h2>
                        <p>Análise de cobertura e eficiência territorial da Paróquia</p>
                    </div>
                </div>
                <div className="overall-efficiency glass">
                    <TrendingUp size={20} className="text-success" />
                    <div>
                        <span>Eficiência Global</span>
                        <strong>{Math.round(stats.reduce((acc, curr) => acc + curr.efficiency, 0) / (stats.length || 1))}%</strong>
                    </div>
                </div>
            </div>

            <div className="governance-grid">
                <div className="stats-sidebar glass">
                    <div className="sidebar-section-title">
                        <h3>Comunidades e Capelas</h3>
                        <span className="badge">{stats.length} Unidades</span>
                    </div>

                    <div className="stats-list">
                        {stats.map(c => (
                            <div key={c.id} className="community-stat-card glass-inner">
                                <div className="card-header">
                                    <strong>{c.name}</strong>
                                    <span className={`status-dot ${c.efficiency > 70 ? 'success' : c.efficiency > 40 ? 'warning' : 'critical'}`}></span>
                                </div>
                                <div className="card-metrics">
                                    <div className="metric">
                                        <Users size={14} />
                                        <span>{c.activeAppointments} Ativos</span>
                                    </div>
                                    <div className="metric">
                                        <span>{c.efficiency}% Eficiência</span>
                                    </div>
                                </div>
                                <div className="progress-mini">
                                    <div className="progress-fill" style={{ width: `${c.efficiency}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="strategic-map-view glass">
                    <div className="map-controls">
                        <div className="search-local glass">
                            <Search size={16} />
                            <input type="text" placeholder="Filtrar por nome ou região..." />
                        </div>
                        <div className="map-legend">
                            <div className="legend-item"><span className="dot critical"></span> Crítico</div>
                            <div className="legend-item"><span className="dot warning"></span> Atenção</div>
                            <div className="legend-item"><span className="dot success"></span> Ideal</div>
                        </div>
                    </div>

                    <div className="map-canvas-local">
                        {/* Mock map representation */}
                        <div className="map-grid-overlay"></div>
                        {stats.map((c, idx) => (
                            <div 
                                key={c.id} 
                                className={`map-marker ${c.efficiency < 50 ? 'pulse' : ''}`}
                                style={{ 
                                    top: `${20 + (idx * 15) % 60}%`, 
                                    left: `${15 + (idx * 25) % 70}%` 
                                }}
                            >
                                <MapPin size={24} className={c.efficiency > 70 ? 'text-success' : c.efficiency > 40 ? 'text-warning' : 'text-critical'} />
                                <div className="marker-label glass">{c.name}</div>
                            </div>
                        ))}
                    </div>

                    <div className="governance-insights">
                        <div className="insight-item glass-inner">
                            <AlertTriangle className="text-warning" size={20} />
                            <div>
                                <strong>Recomendação Estratégica</strong>
                                <p>A comunidade "{stats.find(s => s.efficiency < 50)?.name || 'Central'}" apresenta baixa eficiência de visitas. Considere reforçar a equipe pastoral nesta região.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
