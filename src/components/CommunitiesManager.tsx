import React, { useEffect, useState } from 'react';
import { Plus, Settings, Trash2, Edit2, Users } from 'lucide-react';
import { UnitSettingsModal } from './UnitSettingsModal';
import { ignisApi } from '../services/api';
import type { Community } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import './CommunitiesManager.css';

export const CommunitiesManager: React.FC = () => {
    const [selectedUnit, setSelectedUnit] = useState<Community | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { activeTenant } = useTenant();

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

    if (isLoading) {
        // ... loading state same ...
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
                                        <button className="action-btn" onClick={() => setSelectedUnit(community)}>
                                            <Settings size={18} />
                                        </button>
                                        <button className="action-btn">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="action-btn delete">
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
        </div>
    );
};
