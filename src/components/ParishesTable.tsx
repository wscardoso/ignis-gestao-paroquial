import React, { useEffect, useState } from 'react';
import { MoreVertical, CheckCircle, XCircle, Shield, Edit3 } from 'lucide-react';
import { ignisApi } from '../services/api';
import type { Tenant } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ModuleToggleModal } from './ModuleToggleModal';
import { GovernanceModal } from './Governance/GovernanceModal';
import { EditParishModal } from './EditParishModal';
import './ParishesTable.css';

export const ParishesTable: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
    const [parishes, setParishes] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { profile } = useAuth();

    // permissions check
    const canEdit = profile?.role === 'super_admin' || profile?.role === 'matriz_admin';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await ignisApi.tenants.getAll();
            if (data && data.length > 0) {
                setParishes(data);
            } else {
                // Mock data fallback
                setParishes([
                    { id: '1', name: 'Paróquia Santo Estevão', status: 'active' } as any,
                    { id: '2', name: 'Nossa Sra. Fátima', status: 'active' } as any
                ]);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [refreshTrigger, isModuleModalOpen]); // Refresh when modal closes

    if (isLoading) {
        return (
            <div className="table-container glass">
                <div className="table-header">
                    <h3 className="table-title">Paróquias Matrizes</h3>
                    <div className="skeleton" style={{ width: '80px', height: '32px' }}></div>
                </div>
                <table className="parishes-table">
                    <thead>
                        <tr>
                            <th>Paróquia</th>
                            <th>CNPJ</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3].map((i) => (
                            <tr key={i}>
                                <td>
                                    <div className="parish-info">
                                        <div className="skeleton-circle skeleton"></div>
                                        <div className="skeleton-text skeleton" style={{ width: '120px' }}></div>
                                    </div>
                                </td>
                                <td><div className="skeleton-text skeleton" style={{ width: '100px' }}></div></td>
                                <td><div className="skeleton-text skeleton" style={{ width: '60px' }}></div></td>
                                <td><div className="skeleton-circle skeleton" style={{ width: '16px', height: '16px' }}></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="table-container glass">
            <div className="table-header">
                <h3 className="table-title">Paróquias Matrizes</h3>
                <button className="btn-secondary">Ver todas</button>
            </div>
            <table className="parishes-table">
                <thead>
                    <tr>
                        <th>Paróquia</th>
                        <th>CNPJ</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {parishes.map((parish) => (
                        <tr key={parish.id}>
                            <td>
                                <div className="parish-info">
                                    <div className="parish-avatar">
                                        <Shield size={16} />
                                    </div>
                                    <span>{parish.name}</span>
                                </div>
                            </td>
                            <td>{parish.cnpj || '---'}</td>
                            <td>
                                <span className={`status-pill ${parish.status}`}>
                                    {parish.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                    {parish.status === 'active' ? 'Ativa' : 'Inativa'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {canEdit && (
                                        <button
                                            className="action-btn"
                                            onClick={() => {
                                                setSelectedTenant(parish);
                                                setIsEditModalOpen(true);
                                            }}
                                            title="Editar Paróquia"
                                            style={{ color: 'var(--accent)' }}
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn"
                                        onClick={() => {
                                            setSelectedTenant(parish);
                                            setIsModuleModalOpen(true);
                                        }}
                                        title="Gerenciar Módulos"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    <button
                                        className="action-btn"
                                        onClick={() => {
                                            setSelectedTenant(parish);
                                            setIsGovernanceModalOpen(true);
                                        }}
                                        title="Governança & Gestão"
                                        style={{ color: 'var(--accent-color)' }}
                                    >
                                        <Shield size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ModuleToggleModal
                isOpen={isModuleModalOpen}
                onClose={() => {
                    setIsModuleModalOpen(false);
                    setSelectedTenant(null);
                }}
                tenant={selectedTenant}
                onSuccess={() => {
                    // Refresh is handled by useEffect dependency
                }}
            />

            <GovernanceModal
                isOpen={isGovernanceModalOpen}
                onClose={() => {
                    setIsGovernanceModalOpen(false);
                    setSelectedTenant(null);
                }}
                tenant={selectedTenant}
            />

            {selectedTenant && (
                <EditParishModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedTenant(null);
                    }}
                    parishId={selectedTenant.id}
                />
            )}
        </div>
    );
};
