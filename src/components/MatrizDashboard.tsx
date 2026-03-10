import React from 'react';
import { Map, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { CommunitiesManager } from './CommunitiesManager';
import { SchedulingGrid } from './SchedulingGrid';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import './MatrizDashboard.css';

export const MatrizDashboard: React.FC = () => {
    return (
        <div className="matriz-dashboard">
            <div className="strategic-grid">
                <div className="strategy-card warning">
                    <div className="card-header">
                        <AlertTriangle size={20} className="icon-warning" />
                        <h3>Desertos Pastorais</h3>
                    </div>
                    <p className="card-metric">2 Áreas Críticas</p>
                    <p className="card-sub">Jd. Oliveiras & Pq. Industrial</p>
                    <div className="progress-bar">
                        <div className="progress-fill low" style={{ width: '30%' }}></div>
                    </div>
                    <span className="progress-label">Cobertura de Visitas: 30%</span>
                </div>

                <div className="strategy-card success">
                    <div className="card-header">
                        <TrendingUp size={20} className="icon-success" />
                        <h3>Movimento Pastoral</h3>
                    </div>
                    <div className="card-stats-grid">
                        <div className="stat-mini">
                            <span>Confissões</span>
                            <strong>142</strong>
                        </div>
                        <div className="stat-mini">
                            <span>Direções</span>
                            <strong>45</strong>
                        </div>
                        <div className="stat-mini">
                            <span>Visitas</span>
                            <strong>28</strong>
                        </div>
                        <div className="stat-mini">
                            <span>Bençãos</span>
                            <strong>12</strong>
                        </div>
                    </div>
                </div>

                <div className="strategy-card info">
                    <div className="card-header">
                        <Users size={20} className="icon-info" />
                        <h3>Clero Disponível</h3>
                    </div>
                    <p className="card-metric">85% Alocado</p>
                    <p className="card-sub">3 Padres / 2 Diáconos ativos</p>
                </div>
            </div>

            <AnalyticsDashboard />

            <SchedulingGrid />

            <div className="map-placeholder glass">
                <Map size={48} />
                <p>Mapa de Calor Territorial (IGNIS Maps Integration)</p>
            </div>

            <CommunitiesManager />
        </div>
    );
};
