import React, { useState, useEffect } from 'react';
import { ArrowRight, Home, Landmark, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Tenant, Community } from '../../services/api';
import './GovernanceModal.css';

interface GovernanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant | null;
}

export const GovernanceModal: React.FC<GovernanceModalProps> = ({ isOpen, onClose, tenant }) => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [allTenants, setAllTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [transferringId, setTransferringId] = useState<string | null>(null);
    const [targetTenantId, setTargetTenantId] = useState<string>('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (isOpen && tenant) {
            fetchData();
        }
    }, [isOpen, tenant]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [cData, tData] = await Promise.all([
                ignisApi.communities.getByTenant(tenant!.id),
                ignisApi.tenants.getAll()
            ]);
            setCommunities(cData);
            setAllTenants(tData.filter(t => t.id !== tenant!.id));
        } catch (error) {
            console.error('Error fetching governance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async (communityId: string) => {
        if (!targetTenantId) return;

        setIsLoading(true);
        try {
            await ignisApi.governance.transferCommunity(communityId, targetTenantId);
            setStatus({ type: 'success', message: 'Unidade transferida com sucesso!' });
            fetchData();
            setTransferringId(null);
            setTargetTenantId('');
        } catch (error) {
            setStatus({ type: 'error', message: 'Erro ao transferir unidade.' });
        } finally {
            setIsLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    if (!isOpen || !tenant) return null;

    return (
        <div className="modal-overlay">
            <div className="governance-modal glass">
                <header className="modal-header">
                    <div className="header-title">
                        <Landmark className="text-accent" />
                        <div>
                            <h2>Governança: {tenant.name}</h2>
                            <p>Gestão de comunidades e remanejamento pastoral</p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </header>

                <div className="modal-body">
                    {status && (
                        <div className={`status-banner ${status.type}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    <section className="communities-section">
                        <h3>Comunidades Vinculadas ({communities.length})</h3>
                        <div className="communities-list">
                            {isLoading && communities.length === 0 ? (
                                <div className="loading-spinner">Carregando unidades...</div>
                            ) : communities.map(c => (
                                <div key={c.id} className="community-transfer-card glass-inner">
                                    <div className="community-info">
                                        <Home size={18} />
                                        <div>
                                            <span className="name">{c.name}</span>
                                            <span className="address">{c.address}</span>
                                        </div>
                                    </div>

                                    {transferringId === c.id ? (
                                        <div className="transfer-actions">
                                            <select
                                                value={targetTenantId}
                                                onChange={(e) => setTargetTenantId(e.target.value)}
                                                className="glass-select"
                                            >
                                                <option value="">Transferir para...</option>
                                                {allTenants.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn-primary sm"
                                                disabled={!targetTenantId || isLoading}
                                                onClick={() => handleTransfer(c.id)}
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                className="btn-secondary sm"
                                                onClick={() => setTransferringId(null)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn-transfer"
                                            onClick={() => setTransferringId(c.id)}
                                        >
                                            Remanejar <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
