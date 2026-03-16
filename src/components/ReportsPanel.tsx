import React, { useState, useCallback } from 'react';
import {
    Printer,
    FileText,
    Users,
    Calendar,
    Download,
    ChevronRight,
    Search,
    ArrowLeft,
    BarChart3,
    Loader2,
    FileDown
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ignisApi } from '../services/api';
import type { Sacrament, Appointment, Person } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';
import './ReportsPanel.css';

type ReportId = 'sacramentos' | 'agendamentos' | 'fieis' | 'estatisticas';

interface ReportType {
    id: ReportId;
    title: string;
    description: string;
    icon: React.ElementType;
    category: 'pastoral' | 'sacramental' | 'administrativo';
}

const reportTypes: ReportType[] = [
    {
        id: 'sacramentos',
        title: 'Relatório de Sacramentos',
        description: 'Listagem completa de batismos, matrimônios e confirmações por período.',
        icon: FileText,
        category: 'sacramental'
    },
    {
        id: 'agendamentos',
        title: 'Relatório de Agendamentos',
        description: 'Lista de atendimentos e celebrações com filtro por status e período.',
        icon: Calendar,
        category: 'pastoral'
    },
    {
        id: 'fieis',
        title: 'Diretório de Fiéis',
        description: 'Lista de membros ativos com contatos e grupos pastorais.',
        icon: Users,
        category: 'pastoral'
    },
    {
        id: 'estatisticas',
        title: 'Estatísticas Gerais',
        description: 'Visão consolidada com gráficos de sacramentos e agendamentos.',
        icon: BarChart3,
        category: 'administrativo'
    }
];

const SACRAMENT_LABELS: Record<string, string> = {
    baptism: 'Batismo',
    marriage: 'Matrimônio',
    confirmation: 'Confirmação',
    first_communion: 'Primeira Comunhão',
    anointing_of_sick: 'Unção dos Enfermos'
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
    remarcado: 'Remarcado'
};

const CHART_COLORS = ['#c5a059', '#3b82f6', '#22c55e', '#ef4444', '#a855f7'];

export const ReportsPanel: React.FC<{ tenantId: string }> = ({ tenantId }) => {
    const { activeTenant } = useTenant();
    const [activeReport, setActiveReport] = useState<ReportId | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Data
    const [sacraments, setSacraments] = useState<Sacrament[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [people, setPeople] = useState<Person[]>([]);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Preview
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const loadReportData = useCallback(async (reportId: ReportId) => {
        setIsLoading(true);
        try {
            if (reportId === 'sacramentos' || reportId === 'estatisticas') {
                const data = await ignisApi.sacraments.getAll(tenantId);
                setSacraments(data);
            }
            if (reportId === 'agendamentos' || reportId === 'estatisticas') {
                // Load all appointments (wide range)
                const start = new Date('2020-01-01');
                const end = new Date('2030-12-31');
                // We need sub_tenants to load appointments
                const communities = await ignisApi.communities.getByTenant(tenantId);
                let allApps: Appointment[] = [];
                for (const c of communities) {
                    const apps = await ignisApi.appointments.getByDateRange(tenantId, c.id, start, end);
                    allApps = allApps.concat(apps);
                }
                setAppointments(allApps);
            }
            if (reportId === 'fieis' || reportId === 'estatisticas') {
                const data = await ignisApi.people.getAll(tenantId);
                setPeople(data);
            }
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            toast.error('Erro ao carregar dados do relatório.');
        } finally {
            setIsLoading(false);
        }
    }, [tenantId]);

    const handleOpenReport = (id: ReportId) => {
        setActiveReport(id);
        setDateFrom('');
        setDateTo('');
        setFilterType('all');
        setFilterStatus('all');
        setSearchQuery('');
        loadReportData(id);
    };

    // Filtered data
    const filteredSacraments = sacraments.filter(s => {
        if (filterType !== 'all' && s.type !== filterType) return false;
        if (dateFrom && s.celebratoryDate < dateFrom) return false;
        if (dateTo && s.celebratoryDate > dateTo) return false;
        if (searchQuery && !s.subjectName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const filteredAppointments = appointments.filter(a => {
        if (filterStatus !== 'all' && a.status !== filterStatus) return false;
        const aDate = a.startTime.split('T')[0];
        if (dateFrom && aDate < dateFrom) return false;
        if (dateTo && aDate > dateTo) return false;
        if (searchQuery && !a.clientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const filteredPeople = people.filter(p => {
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Stats for summary
    const sacramentsByType = Object.entries(
        filteredSacraments.reduce((acc, s) => {
            acc[s.type] = (acc[s.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: SACRAMENT_LABELS[name] || name, value }));

    const appointmentsByStatus = Object.entries(
        filteredAppointments.reduce((acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name: STATUS_LABELS[name] || name, value }));

    // CSV export
    const exportCSV = (headers: string[], rows: string[][], filename: string) => {
        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleExportCSV = () => {
        if (activeReport === 'sacramentos') {
            exportCSV(
                ['Tipo', 'Data', 'Pessoa', 'Livro', 'Página', 'Registro'],
                filteredSacraments.map(s => [SACRAMENT_LABELS[s.type] || s.type, s.celebratoryDate, s.subjectName, s.bookNumber, s.pageNumber, s.entryNumber]),
                'sacramentos'
            );
        } else if (activeReport === 'agendamentos') {
            exportCSV(
                ['Data', 'Hora', 'Pessoa', 'Tipo', 'Status', 'Padre'],
                filteredAppointments.map(a => [
                    format(new Date(a.startTime), 'dd/MM/yyyy'),
                    format(new Date(a.startTime), 'HH:mm'),
                    a.clientName, a.serviceType,
                    STATUS_LABELS[a.status] || a.status,
                    a.celebrantName || ''
                ]),
                'agendamentos'
            );
        } else if (activeReport === 'fieis') {
            exportCSV(
                ['Nome', 'Email', 'Telefone', 'Grupos', 'Status'],
                filteredPeople.map(p => [p.name, p.email || '', p.phone || '', (p.groups || []).join('; '), p.status]),
                'fieis'
            );
        }
        toast.success('CSV exportado com sucesso!');
    };

    const handlePrint = () => {
        setIsPreviewOpen(true);
        setTimeout(() => window.print(), 300);
    };

    // Stats for estatisticas report
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const last30Str = last30Days.toISOString().split('T')[0];

    const statsData = {
        totalPeople: people.length,
        sacraments30d: sacraments.filter(s => s.celebratoryDate >= last30Str).length,
        appointments30d: appointments.filter(a => a.startTime >= last30Days.toISOString()).length,
    };

    // Monthly appointments for line chart
    const monthlyAppointments = (() => {
        const months: Record<string, number> = {};
        appointments.forEach(a => {
            const key = format(new Date(a.startTime), 'yyyy-MM');
            months[key] = (months[key] || 0) + 1;
        });
        return Object.entries(months)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12)
            .map(([month, count]) => ({ month: format(new Date(month + '-01'), 'MMM/yy'), count }));
    })();

    const renderFilters = () => {
        if (!activeReport || activeReport === 'estatisticas') return null;
        return (
            <div className="report-filters">
                <div className="filter-row">
                    <div className="filter-group">
                        <label>De</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div className="filter-group">
                        <label>Até</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                    {activeReport === 'sacramentos' && (
                        <div className="filter-group">
                            <label>Tipo</label>
                            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                                <option value="all">Todos</option>
                                {Object.entries(SACRAMENT_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeReport === 'agendamentos' && (
                        <div className="filter-group">
                            <label>Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">Todos</option>
                                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="filter-group search-filter">
                        <label>Buscar</label>
                        <div className="search-input-wrap">
                            <Search size={14} />
                            <input type="text" placeholder="Nome..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSacramentosReport = () => (
        <div className="report-data-section">
            <div className="report-summary-cards">
                {sacramentsByType.map((s, i) => (
                    <div key={s.name} className="summary-card" style={{ borderLeftColor: CHART_COLORS[i % CHART_COLORS.length] }}>
                        <span className="summary-value">{s.value}</span>
                        <span className="summary-label">{s.name}</span>
                    </div>
                ))}
                <div className="summary-card total">
                    <span className="summary-value">{filteredSacraments.length}</span>
                    <span className="summary-label">Total</span>
                </div>
            </div>
            <table className="report-table">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Data</th>
                        <th>Pessoa</th>
                        <th>Livro/Pág/Reg</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSacraments.map(s => (
                        <tr key={s.id}>
                            <td><span className={`type-badge ${s.type}`}>{SACRAMENT_LABELS[s.type] || s.type}</span></td>
                            <td>{format(new Date(s.celebratoryDate), 'dd/MM/yyyy')}</td>
                            <td>{s.subjectName}</td>
                            <td>{[s.bookNumber, s.pageNumber, s.entryNumber].filter(Boolean).join(' / ') || '—'}</td>
                        </tr>
                    ))}
                    {filteredSacraments.length === 0 && (
                        <tr><td colSpan={4} className="empty-row">Nenhum sacramento encontrado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderAgendamentosReport = () => (
        <div className="report-data-section">
            <div className="report-summary-cards">
                {appointmentsByStatus.map((s, i) => (
                    <div key={s.name} className="summary-card" style={{ borderLeftColor: CHART_COLORS[i % CHART_COLORS.length] }}>
                        <span className="summary-value">{s.value}</span>
                        <span className="summary-label">{s.name}</span>
                    </div>
                ))}
                <div className="summary-card total">
                    <span className="summary-value">{filteredAppointments.length}</span>
                    <span className="summary-label">Total</span>
                </div>
            </div>
            <table className="report-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Pessoa</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Padre</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAppointments.map(a => (
                        <tr key={a.id}>
                            <td>{format(new Date(a.startTime), 'dd/MM/yyyy')}</td>
                            <td>{format(new Date(a.startTime), 'HH:mm')}</td>
                            <td>{a.clientName}</td>
                            <td>{a.serviceType}</td>
                            <td><span className={`status-badge ${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                            <td>{a.celebrantName || '—'}</td>
                        </tr>
                    ))}
                    {filteredAppointments.length === 0 && (
                        <tr><td colSpan={6} className="empty-row">Nenhum agendamento encontrado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderFieisReport = () => (
        <div className="report-data-section">
            <div className="report-summary-cards">
                <div className="summary-card total">
                    <span className="summary-value">{filteredPeople.length}</span>
                    <span className="summary-label">Total de Fiéis</span>
                </div>
            </div>
            <table className="report-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Grupos</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPeople.map(p => (
                        <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>{p.email || '—'}</td>
                            <td>{p.phone || '—'}</td>
                            <td>{(p.groups || []).join(', ') || '—'}</td>
                            <td><span className={`status-badge ${p.status}`}>{p.status === 'active' ? 'Ativo' : p.status}</span></td>
                        </tr>
                    ))}
                    {filteredPeople.length === 0 && (
                        <tr><td colSpan={5} className="empty-row">Nenhum fiel encontrado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderEstatisticas = () => (
        <div className="report-data-section stats-section">
            <div className="report-summary-cards">
                <div className="summary-card">
                    <span className="summary-value">{statsData.totalPeople}</span>
                    <span className="summary-label">Fiéis Cadastrados</span>
                </div>
                <div className="summary-card">
                    <span className="summary-value">{statsData.sacraments30d}</span>
                    <span className="summary-label">Sacramentos (30d)</span>
                </div>
                <div className="summary-card">
                    <span className="summary-value">{statsData.appointments30d}</span>
                    <span className="summary-label">Agendamentos (30d)</span>
                </div>
            </div>
            <div className="charts-grid">
                <div className="chart-card glass">
                    <h3>Sacramentos por Tipo</h3>
                    {sacramentsByType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={sacramentsByType} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {sacramentsByType.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="no-data-chart">Sem dados</p>}
                </div>
                <div className="chart-card glass">
                    <h3>Agendamentos por Mês</h3>
                    {monthlyAppointments.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={monthlyAppointments}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Line type="monotone" dataKey="count" stroke="#c5a059" strokeWidth={2} dot={{ fill: '#c5a059' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <p className="no-data-chart">Sem dados</p>}
                </div>
            </div>
        </div>
    );

    const renderReportContent = () => {
        if (isLoading) {
            return (
                <div className="report-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Carregando dados...</p>
                </div>
            );
        }
        switch (activeReport) {
            case 'sacramentos': return renderSacramentosReport();
            case 'agendamentos': return renderAgendamentosReport();
            case 'fieis': return renderFieisReport();
            case 'estatisticas': return renderEstatisticas();
            default: return null;
        }
    };

    // Print preview content
    const renderPrintContent = () => {
        const reportTitle = reportTypes.find(r => r.id === activeReport)?.title || '';
        return (
            <div className="report-content-paper" id="printable-report">
                <div className="print-header">
                    <div className="parish-logo">🔥</div>
                    <div className="parish-info">
                        <h2>{(activeTenant?.name || 'PARÓQUIA').toUpperCase()}</h2>
                        <p>{activeTenant?.city ? `${activeTenant.city} - ${activeTenant.state}` : ''}</p>
                        <p className="report-name-print">{reportTitle.toUpperCase()}</p>
                    </div>
                    <div className="print-date">Data: {new Date().toLocaleDateString()}</div>
                </div>
                <div className="print-body">
                    {renderReportContent()}
                </div>
                <footer className="print-footer">
                    <p>Gerado automaticamente por IGNIS - Sistema de Gestão Paroquial</p>
                    <p>Página 1 de 1</p>
                </footer>
            </div>
        );
    };

    // Main grid view
    if (!activeReport) {
        return (
            <div className="reports-panel">
                <header className="reports-header glass">
                    <div className="header-info">
                        <h1>Central de Relatórios</h1>
                        <p>Relatórios com dados reais da paróquia {activeTenant?.name || ''}.</p>
                    </div>
                </header>
                <div className="reports-grid">
                    {reportTypes.map((report) => (
                        <div key={report.id} className="report-card glass clickable" onClick={() => handleOpenReport(report.id)}>
                            <div className={`report-icon-wrapper ${report.category}`}>
                                <report.icon size={24} />
                            </div>
                            <div className="report-info">
                                <h3>{report.title}</h3>
                                <p>{report.description}</p>
                            </div>
                            <ChevronRight className="arrow" size={20} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Detail view
    return (
        <div className="reports-panel">
            <header className="reports-header glass">
                <div className="header-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-icon" onClick={() => setActiveReport(null)} title="Voltar">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>{reportTypes.find(r => r.id === activeReport)?.title}</h1>
                        <p>{activeTenant?.name || ''}</p>
                    </div>
                </div>
                <div className="header-actions">
                    {activeReport !== 'estatisticas' && (
                        <button className="btn-secondary" onClick={handleExportCSV}>
                            <FileDown size={16} /> CSV
                        </button>
                    )}
                    <button className="btn-primary" onClick={handlePrint}>
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
            </header>

            {renderFilters()}
            {renderReportContent()}

            {isPreviewOpen && (
                <div className="report-preview-overlay glass-heavy" onClick={() => setIsPreviewOpen(false)}>
                    <div className="report-preview-modal glass" onClick={e => e.stopPropagation()}>
                        <header className="preview-header">
                            <div className="preview-title">
                                <Printer size={20} />
                                <h2>Visualização de Impressão</h2>
                            </div>
                            <div className="preview-actions">
                                <button className="btn-secondary" onClick={() => setIsPreviewOpen(false)}>Fechar</button>
                                <button className="btn-primary" onClick={() => window.print()}>
                                    <Download size={18} /> Imprimir / PDF
                                </button>
                            </div>
                        </header>
                        {renderPrintContent()}
                    </div>
                </div>
            )}
        </div>
    );
};
