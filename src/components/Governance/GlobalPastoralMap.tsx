import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Users, MapPin, Search } from 'lucide-react';
import { ignisApi } from '../../services/api';
import './GlobalPastoralMap.css';

export const GlobalPastoralMap: React.FC = () => {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await ignisApi.governance.getGlobalStats();
                if (data && data.length > 0) {
                    setStats(data);
                } else {
                    // Fallback to mock data for demo/verification
                    setStats([
                        { id: '1', name: 'Paróquia Santo Estevão', communitiesCount: 8, activeAppointments: 45, totalAppointments: 50 },
                        { id: '2', name: 'Nossa Sra. Fátima', communitiesCount: 3, activeAppointments: 12, totalAppointments: 40 },
                        { id: '3', name: 'São José Operário', communitiesCount: 6, activeAppointments: 30, totalAppointments: 35 }
                    ]);
                }
            } catch (error) {
                console.error('Error fetching global stats:', error);
            } finally {
                // setIsLoading(false); // Removed as state was removed
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="global-map-container">
            <div className="map-sidebar glass">
                <div className="sidebar-header">
                    <Shield className="text-accent" />
                    <h3>Análise de Cobertura</h3>
                </div>

                <div className="stats-list">
                    {stats.map(p => (
                        <div key={p.id} className="parish-stat-card glass-inner">
                            <div className="card-top">
                                <strong>{p.name}</strong>
                                <span className={`coverage-badge ${p.communitiesCount > 5 ? 'good' : 'low'}`}>
                                    {p.communitiesCount > 5 ? 'Alta' : 'Baixa'} Cobertura
                                </span>
                            </div>
                            <div className="card-metrics">
                                <div className="metric">
                                    <MapPin size={14} />
                                    <span>{p.communitiesCount} Unidades</span>
                                </div>
                                <div className="metric">
                                    <Users size={14} />
                                    <span>{p.activeAppointments} Atend. Ativos</span>
                                </div>
                            </div>
                            <div className="progress-container">
                                <div className="progress-label">
                                    <span>Eficiência Pastoral</span>
                                    <span>{Math.round((p.activeAppointments / (p.totalAppointments || 1)) * 100)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(p.activeAppointments / (p.totalAppointments || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="map-view glass">
                <div className="map-overlay-controls">
                    <div className="search-box glass">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar região ou paróquia..." />
                    </div>
                    <div className="legend glass">
                        <div className="legend-item"><span className="dot critical"></span> Deserto Pastoral</div>
                        <div className="legend-item"><span className="dot warning"></span> Cobertura Médio</div>
                        <div className="legend-item"><span className="dot success"></span> Cobertura Ideal</div>
                    </div>
                </div>

                {/* Mock Visual representation of a map with heatmap dots */}
                <div className="map-canvas">
                    <div className="heatmap-dot critical" style={{ top: '30%', left: '40%' }}>
                        <div className="dot-ripple"></div>
                        <div className="tooltip">Deserto Pastoral: Jd. Oliveiras (Alta Demanda / Baixa Visita)</div>
                    </div>
                    <div className="heatmap-dot warning" style={{ top: '60%', left: '20%' }}>
                        <div className="dot-ripple"></div>
                    </div>
                    <div className="heatmap-dot success" style={{ top: '45%', left: '70%' }}>
                        <div className="dot-ripple"></div>
                    </div>
                    <div className="heatmap-dot warning" style={{ top: '20%', left: '80%' }}>
                        <div className="dot-ripple"></div>
                    </div>

                    <div className="map-background-mock">
                        <MapPin className="pin" style={{ top: '32%', left: '42%', color: 'var(--accent-color)' }} />
                        <div className="landmark-label" style={{ top: '15%', left: '60%', position: 'absolute' }}>Paróquia Santo Estevão</div>
                    </div>
                </div>

                <div className="map-footer glass">
                    <div className="insight-card">
                        <AlertTriangle className="text-warning" />
                        <div>
                            <strong>Insight de Governança:</strong>
                            <p>O "Jd. Oliveiras" está a 8km da Matriz atual. Recomendado transferir a gestão para a Paróquia vizinha para otimizar visitas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
