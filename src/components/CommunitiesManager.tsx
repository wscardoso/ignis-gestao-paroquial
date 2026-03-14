import React, { useEffect, useState } from 'react';
import { Plus, Settings, Trash2, Edit2, Users, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { UnitSettingsModal } from './UnitSettingsModal';
import { GovernanceModal } from './Governance/GovernanceModal';
import { ignisApi } from '../services/api';
import type { Community, Tenant } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './CommunitiesManager.css';

export const CommunitiesManager: React.FC = () => {
    const [selectedUnit, setSelectedUnit] = useState<Community | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { activeTenant } = useTenant();
    const { profile } = useAuth();
    
    // Governance state
    const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);
    const [governanceTenant, setGovernanceTenant] = useState<Tenant | null>(null);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<Community | null>(null);
    const [deleteLinkedCount, setDeleteLinkedCount] = useState(0);
    const [isCheckingLinks, setIsCheckingLinks] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCommunities = async () => {
        if (activeTenant) {
            setIsLoading(true);
            const data = await ignisApi.communities.getByTenant(activeTenant.id);
            setCommunities(data);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, [activeTenant]);

    const handleDeleteClick = async (community: Community) => {
        setDeleteTarget(community);
        setIsCheckingLinks(true);
        try {
            const counts = await ignisApi.communities.getLinkedCounts(community.id);
            setDeleteLinkedCount(counts.appointments);
        } catch {
            setDeleteLinkedCount(0);
        } finally {
            setIsCheckingLinks(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await ignisApi.communities.delete(deleteTarget.id);
            setCommunities(prev => prev.filter(c => c.id !== deleteTarget.id));
            toast.success('Comunidade deletada com sucesso.');
            setDeleteTarget(null);
        } catch (err: any) {
            toast.error(err?.message || 'Erro ao deletar comunidade.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="communities-container">
                <div className="section-header">
                    <div>
                        <div className="skeleton-title skeleton" style={{ width: '200px' }}></div>
                        <div className="skeleton-text skeleton" style={{ width: '300px' }}></div>
                    </div>
                </div>
                <div className="units-table-container glass">
                    <table className="units-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Endereço</th>
                                <th>Métricas</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4].map((i) => (
                                <tr key={i}>
                                    <td><div className="skeleton-text skeleton" style={{ width: '120px' }}></div></td>
                                    <td><div className="skeleton-text skeleton" style={{ width: '180px' }}></div></td>
                                    <td><div className="skeleton-text skeleton" style={{ width: '100px' }}></div></td>
                                    <td><div className="skeleton-text skeleton" style={{ width: '60px' }}></div></td>
                                    <td><div className="skeleton-text skeleton" style={{ width: '80px' }}></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="communities-container">
            <div className="section-header">
                <div>
                    <h2 className="section-title">Gestão de Comunidades e Capelas</h2>
                    <p className="section-subtitle">Gerencie todas as capelas e comunidades da rede IGNIS</p>
                </div>
                <button className="btn-add-community" onClick={() => setIsAddingNew(true)}>
                    <Plus size={18} />
                    <span>Nova Comunidade/Capela</span>
                </button>
            </div>

            <div className="units-table-container glass">
                <table className="units-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Endereço</th>
                            <th>Métricas (Batismos)</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {communities.map((community) => (
                            <tr key={community.id}>
                                <td className="unit-name-cell">
                                    <strong>{community.name}</strong>
                                </td>
                                <td className="unit-address">
                                    {community.address}
                                </td>
                                <td>
                                    <div className="unit-metrics">
                                        <Users size={14} /> {community.members}
                                        <span className="separator">•</span>
                                        <span>{community.metrics}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={`status-toggle ${community.status}`}>
                                        <div className="toggle-indicator"></div>
                                        <span>{community.status === 'active' ? 'Ativa' : 'Inativa'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button className="action-btn" onClick={() => setSelectedUnit(community)} title="Configurações da Unidade">
                                            <Settings size={18} />
                                        </button>
                                        {(profile?.role === 'super_admin') && (
                                            <button 
                                                className="action-btn" 
                                                onClick={() => {
                                                    setGovernanceTenant(activeTenant as unknown as Tenant);
                                                    setIsGovernanceOpen(true);
                                                }}
                                                title="Governança e Remanejamento"
                                                style={{ color: 'var(--accent-color)' }}
                                            >
                                                <Shield size={18} />
                                            </button>
                                        )}
                                        <button className="action-btn delete" onClick={() => handleDeleteClick(community)} title="Excluir Unidade">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(selectedUnit || isAddingNew) && (
                <UnitSettingsModal
                    unit={selectedUnit}
                    onClose={() => {
                        setSelectedUnit(null);
                        setIsAddingNew(false);
                        fetchCommunities();
                    }}
                />
            )}

            <GovernanceModal
                key={governanceTenant?.id || 'none'}
                isOpen={isGovernanceOpen}
                onClose={() => {
                    setIsGovernanceOpen(false);
                    setGovernanceTenant(null);
                    fetchCommunities();
                }}
                tenant={governanceTenant}
            />

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="delete-modal-overlay" onClick={() => !isDeleting && setDeleteTarget(null)}>
                    <div className="delete-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <AlertTriangle size={32} />
                        </div>
                        <h3>Deletar Comunidade</h3>
                        {isCheckingLinks ? (
                            <div className="delete-loading">
                                <Loader2 className="spin" size={20} />
                                <p>Verificando vínculos...</p>
                            </div>
                        ) : (
                            <>
                                <p className="delete-message">
                                    Tem certeza que deseja deletar a comunidade <strong>{deleteTarget.name}</strong>? Esta ação não pode ser desfeita.
                                </p>
                                {deleteLinkedCount > 0 && (
                                    <div className="delete-warning">
                                        <AlertTriangle size={16} />
                                        <span>Esta comunidade tem <strong>{deleteLinkedCount}</strong> agendamento(s) vinculado(s). Eles serão removidos junto.</span>
                                    </div>
                                )}
                                <div className="delete-modal-actions">
                                    <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                                        Cancelar
                                    </button>
                                    <button className="btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                                        {isDeleting ? <><Loader2 className="spin" size={16} /> Deletando...</> : 'Deletar'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
