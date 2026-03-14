import React, { useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle, Flame } from 'lucide-react';
import './AnalyticsDashboard.css';

const dataOccupancy = [
    { name: 'Jan', rate: 72 },
    { name: 'Fev', rate: 78 },
    { name: 'Mar', rate: 85 },
    { name: 'Abr', rate: 82 },
    { name: 'Mai', rate: 88 },
    { name: 'Jun', rate: 91 },
    { name: 'Jul', rate: 87 },
    { name: 'Ago', rate: 93 },
    { name: 'Set', rate: 89 },
    { name: 'Out', rate: 94 },
    { name: 'Nov', rate: 91 },
    { name: 'Dez', rate: 96 },
];

const dataFaltas = [
    { name: 'Jan', rate: 12 },
    { name: 'Fev', rate: 10 },
    { name: 'Mar', rate: 8 },
    { name: 'Abr', rate: 5 },
    { name: 'Mai', rate: 4 },
    { name: 'Jun', rate: 6 },
    { name: 'Jul', rate: 3 },
    { name: 'Ago', rate: 4 },
    { name: 'Set', rate: 2 },
    { name: 'Out', rate: 3 },
    { name: 'Nov', rate: 5 },
    { name: 'Dez', rate: 2 },
];

const dataModalidades = [
    { name: 'Batismos', value: 45, color: '#c5a059' },
    { name: 'Matrimônios', value: 12, color: '#3b82f6' },
    { name: 'Crismas', value: 28, color: '#22c55e' },
    { name: 'Atendimentos', value: 156, color: '#6366f1' },
];

const weeklyHeatmap = [
    { day: 'Seg', '08h': 10, '10h': 40, '14h': 20, '18h': 80 },
    { day: 'Ter', '08h': 20, '10h': 30, '14h': 25, '18h': 75 },
    { day: 'Qua', '08h': 15, '10h': 45, '14h': 30, '18h': 90 },
    { day: 'Qui', '08h': 30, '10h': 50, '14h': 20, '18h': 85 },
    { day: 'Sex', '08h': 25, '10h': 40, '14h': 35, '18h': 95 },
    { day: 'Sáb', '08h': 60, '10h': 90, '14h': 40, '18h': 100 },
    { day: 'Dom', '08h': 100, '10h': 100, '14h': 10, '18h': 60 },
];

export const AnalyticsDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'ocupacao' | 'faltas' | 'modalidades' | 'calor'>('ocupacao');

    const renderContent = () => {
        switch (activeTab) {
            case 'ocupacao':
                return (
                    <div className="chart-container-main">
                        <div className="chart-header">
                            <h3><TrendingUp size={20} /> Evolução da Taxa de Ocupação</h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={dataOccupancy}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#ffffff60" tick={{ fill: '#ffffff60' }} />
                                    <YAxis stroke="#ffffff60" tick={{ fill: '#ffffff60' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rate"
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        dot={{ fill: '#22c55e', strokeWidth: 2 }}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'faltas':
                return (
                    <div className="chart-container-main">
                        <div className="chart-header">
                            <h3 style={{ color: '#f43f5e' }}><AlertTriangle size={20} /> Taxa de Faltas (No-Show)</h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={dataFaltas}>
                                    <defs>
                                        <linearGradient id="colorFaltas" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#ffffff60" />
                                    <YAxis stroke="#ffffff60" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                    />
                                    <Area type="monotone" dataKey="rate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFaltas)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'modalidades':
                return (
                    <div className="chart-container-main">
                        <div className="chart-header">
                            <h3 style={{ color: 'var(--accent-color)' }}><Flame size={20} /> Distribuição por Modalidade</h3>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={dataModalidades}
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {dataModalidades.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'calor':
                return (
                    <div className="chart-container-main">
                        <div className="chart-header">
                            <h3 style={{ color: 'var(--primary-light)' }}><Clock size={20} /> Mapa de Calor Semanal</h3>
                        </div>
                        <div className="heatmap-grid" style={{ marginTop: '20px' }}>
                            <div className="heatmap-labels" style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: '10px', marginBottom: '10px', opacity: 0.5, fontSize: '0.8rem' }}>
                                <div>Dia</div>
                                <div>08h</div>
                                <div>10h</div>
                                <div>14h</div>
                                <div>18h</div>
                            </div>
                            {weeklyHeatmap.map((item) => (
                                <div key={item.day} style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.day}</div>
                                    <div className="heat-cell" style={{ background: `rgba(163, 33, 33, ${0.15 + (item['08h'] / 100) * 0.85})`, height: '30px', borderRadius: '4px' }}></div>
                                    <div className="heat-cell" style={{ background: `rgba(163, 33, 33, ${0.15 + (item['10h'] / 100) * 0.85})`, height: '30px', borderRadius: '4px' }}></div>
                                    <div className="heat-cell" style={{ background: `rgba(163, 33, 33, ${0.15 + (item['14h'] / 100) * 0.85})`, height: '30px', borderRadius: '4px' }}></div>
                                    <div className="heat-cell" style={{ background: `rgba(163, 33, 33, ${0.15 + (item['18h'] / 100) * 0.85})`, height: '30px', borderRadius: '4px' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <div className="placeholder-chart">Selecione uma visualização</div>;
        }
    };

    return (
        <div className="analytics-dashboard glass">
            <div className="analytics-tabs">
                <button
                    className={`tab-btn ${activeTab === 'ocupacao' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ocupacao')}
                >
                    Ocupação
                </button>
                <button
                    className={`tab-btn ${activeTab === 'faltas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('faltas')}
                >
                    Faltas
                </button>
                <button
                    className={`tab-btn ${activeTab === 'modalidades' ? 'active' : ''}`}
                    onClick={() => setActiveTab('modalidades')}
                >
                    Modalidades
                </button>
                <button
                    className={`tab-btn ${activeTab === 'calor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calor')}
                >
                    Mapa de Calor
                </button>
            </div>

            <div className="analytics-content">
                <div className="analytics-main-col">
                    {renderContent()}
                </div>

                <div className="analytics-insights-col">
                    <h3 className="insights-title">Insights de Ocupação</h3>

                    <div className="insight-card positive">
                        <div className="insight-icon"><TrendingUp size={18} /></div>
                        <div>
                            <h4>Crescimento</h4>
                            <p>Taxa de ocupação cresceu <strong>24%</strong> nos últimos 12 meses.</p>
                        </div>
                    </div>

                    <div className="insight-card neutral">
                        <div className="insight-icon"><Clock size={18} /></div>
                        <div>
                            <h4>Horário Pico</h4>
                            <p>Maior ocupação entre <strong>18h-20h</strong> com 95% de utilização.</p>
                        </div>
                    </div>

                    <div className="insight-card warning">
                        <div className="insight-icon"><AlertTriangle size={18} /></div>
                        <div>
                            <h4>Oportunidade</h4>
                            <p>Horários entre <strong>14h-16h</strong> com apenas 45% de ocupação.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
