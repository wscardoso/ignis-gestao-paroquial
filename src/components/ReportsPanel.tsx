import React, { useState } from 'react';
import {
    Printer,
    FileText,
    Users,
    Calendar,
    Download,
    ChevronRight,
    Search
} from 'lucide-react';
import './ReportsPanel.css';

interface ReportType {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    category: 'pastoral' | 'sacramental' | 'administrativo';
}

const reportTypes: ReportType[] = [
    {
        id: 'agenda-semanal',
        title: 'Agenda Semanal',
        description: 'Lista completa de atendimentos, confissões e celebrações da semana.',
        icon: Calendar,
        category: 'pastoral'
    },
    {
        id: 'resumo-sacramental',
        title: 'Resumo Sacramental',
        description: 'Estatísticas e listagem de batismos e matrimônios por período.',
        icon: FileText,
        category: 'sacramental'
    },
    {
        id: 'lista-fieis',
        title: 'Diretório de Fiéis',
        description: 'Lista de membros ativos com contatos e status sacramental.',
        icon: Users,
        category: 'pastoral'
    },
    {
        id: 'financeiro-simples',
        title: 'Extrato de Intenções',
        description: 'Resumo de intenções de missa e contribuições vinculadas.',
        icon: FileText,
        category: 'administrativo'
    }
];

export const ReportsPanel: React.FC<{ tenantId: string }> = ({ }) => {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleGenerate = (id: string) => {
        setSelectedReport(id);
        setIsPreviewOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="reports-panel">
            <header className="reports-header glass">
                <div className="header-info">
                    <h1>Central de Relatórios</h1>
                    <p>Gere documentos profissionais e listas operacionais para a paróquia.</p>
                </div>
                <div className="header-actions">
                    <div className="search-bar glass-inner">
                        <Search size={18} />
                        <input type="text" placeholder="Buscar relatório..." />
                    </div>
                </div>
            </header>

            <div className="reports-grid">
                {reportTypes.map((report) => (
                    <div key={report.id} className="report-card glass clickable" onClick={() => handleGenerate(report.id)}>
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

            {isPreviewOpen && (
                <div className="report-preview-overlay glass-heavy">
                    <div className="report-preview-modal glass">
                        <header className="preview-header">
                            <div className="preview-title">
                                <Printer size={20} />
                                <h2>Visualização de Impressão</h2>
                            </div>
                            <div className="preview-actions">
                                <button className="btn-secondary" onClick={() => setIsPreviewOpen(false)}>Fechar</button>
                                <button className="btn-primary" onClick={handlePrint}>
                                    <Download size={18} /> Imprimir / PDF
                                </button>
                            </div>
                        </header>

                        <div className="report-content-paper" id="printable-report">
                            {/* Mock of the printable content */}
                            <div className="print-header">
                                <div className="parish-logo">🔥</div>
                                <div className="parish-info">
                                    <h2>PARÓQUIA SANTO ESTEVÃO</h2>
                                    <p>Diocese de São José dos Campos</p>
                                    <p className="report-name-print">{reportTypes.find(r => r.id === selectedReport)?.title.toUpperCase()}</p>
                                </div>
                                <div className="print-date">
                                    Data: {new Date().toLocaleDateString()}
                                </div>
                            </div>

                            <div className="print-body">
                                <table className="print-table">
                                    <thead>
                                        <tr>
                                            <th>Data/Hora</th>
                                            <th>Descrição / Nome</th>
                                            <th>Local / Contato</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                            <tr key={i}>
                                                <td>15/02/2026 - 09:00</td>
                                                <td>Atendimento: Weyner Cardozo (Dúvidas Batismo)</td>
                                                <td>Secretaria Paroquial</td>
                                                <td>Confirmado</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <footer className="print-footer">
                                <p>Gerado automaticamente por IGNIS - Sistema de Gestão Pastoral</p>
                                <p>Página 1 de 1</p>
                            </footer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
