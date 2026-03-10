import React from 'react';
import { Printer, X, Landmark, Scroll } from 'lucide-react';
import type { Sacrament } from '../../services/api';
import './CertificatePreview.css';

interface CertificatePreviewProps {
    record: Sacrament;
    onClose: () => void;
    parishName: string;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({ record, onClose, parishName }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="certificate-overlay no-print" onClick={onClose}>
            <div className="certificate-modal glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header-row no-print">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Scroll size={20} className="text-accent" />
                        <h2 style={{ fontSize: '1.2rem' }}>Visualizar Certidão</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" onClick={handlePrint}>
                            <Printer size={18} /> Imprimir
                        </button>
                        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="certificate-paper" id="printable-certificate">
                    {/* Decorative Border */}
                    <div className="certificate-border">
                        <div className="certificate-content">
                            <div className="certificate-header">
                                <Landmark size={48} style={{ marginBottom: '10px', opacity: 0.8 }} />
                                <h3>DIOCESE DE IGNIS</h3>
                                <h4>{parishName.toUpperCase()}</h4>
                                <div className="divider-floral">❦</div>
                            </div>

                            <div className="certificate-body">
                                <h1 className="certificate-title">Lembrança de Batismo</h1>

                                <p className="cert-text">
                                    Certificamos que, para a glória de Deus e alegria da Igreja, aos
                                    <strong> {new Date(record.celebratoryDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>,
                                    nesta Paróquia, recebeu o sacramento do Batismo a criança:
                                </p>

                                <h2 className="subject-name">{record.subjectName.toUpperCase()}</h2>

                                <div className="details-grid">
                                    <div className="detail-item">
                                        <label>Nascido(a) em:</label>
                                        <span>{record.details?.birthDate ? new Date(record.details.birthDate).toLocaleDateString() : '---'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Local:</label>
                                        <span>{record.details?.birthPlace || '---'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Pai:</label>
                                        <span>{record.details?.father || '---'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Mãe:</label>
                                        <span>{record.details?.mother || '---'}</span>
                                    </div>
                                    <div className="detail-item full">
                                        <label>Padrinho / Testemunha:</label>
                                        <span>{record.details?.godfather || '---'}</span>
                                    </div>
                                    <div className="detail-item full">
                                        <label>Madrinha / Testemunha:</label>
                                        <span>{record.details?.godmother || '---'}</span>
                                    </div>
                                </div>

                                <div className="registration-info">
                                    <span>LIVRO: <strong>{record.bookNumber}</strong></span>
                                    <span>FOLHA: <strong>{record.pageNumber}</strong></span>
                                    <span>TERMO: <strong>{record.entryNumber}</strong></span>
                                </div>

                                <div className="certificate-footer">
                                    <div className="signature-area">
                                        <div className="signature-line"></div>
                                        <span>Pároco / Celebrante</span>
                                    </div>
                                    <div className="date-place">
                                        {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </div>

                            <div className="watermark">IGNIS</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
