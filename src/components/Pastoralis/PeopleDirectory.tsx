import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    User,
    Users,
    Filter,
    ChevronRight,
    Phone,
    Mail,
    Tag,
    UserPlus
} from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Person } from '../../services/api';
import { PersonForm } from './PersonForm';
import { PersonDetails } from './PersonDetails';
import { PastoralGroupForm } from './PastoralGroupForm';
import { ModuleHeader } from '../ui/ModuleHeader';
import { PastoralGroupsTab } from './PastoralGroupsTab';
import './Pastoralis.css';

interface PeopleDirectoryProps {
    tenantId: string;
}

export const PeopleDirectory: React.FC<PeopleDirectoryProps> = ({ tenantId }) => {
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [mainTab, setMainTab] = useState<'people' | 'groups'>('people');
    const [view, setView] = useState<'grid' | 'form' | 'detail' | 'groupForm'>('grid');
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    useEffect(() => {
        fetchPeople();
    }, [tenantId]);

    const fetchPeople = async () => {
        setIsLoading(true);
        try {
            const data = await ignisApi.people.getAll(tenantId);
            setPeople(data);
        } catch (error) {
            console.error('Error fetching people:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await ignisApi.people.search(tenantId, searchQuery);
            setPeople(data);
        } catch (error) {
            console.error('Error searching people:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'var(--success-color)';
            case 'inactive': return 'var(--warning-color)';
            case 'deceased': return '#9ca3af';
            default: return 'var(--accent-color)';
        }
    };

    const handlePersonClick = (person: Person) => {
        setSelectedPerson(person);
        setView('detail');
    };

    const handleEdit = () => {
        setView('form');
    };

    const headerActions = (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="sub-nav glass" style={{ padding: '6px', display: 'flex', gap: '4px', borderRadius: '12px' }}>
                <button 
                    className={`btn-secondary ${mainTab === 'people' ? 'active-tab' : ''}`}
                    onClick={() => { setMainTab('people'); setView('grid'); }}
                    style={{ flex: 1, color: mainTab === 'people' ? 'var(--accent-color)' : 'inherit', padding: '6px 12px' }}
                >
                    <User size={16} /> Fiéis
                </button>
                <button 
                    className={`btn-secondary ${mainTab === 'groups' ? 'active-tab' : ''}`}
                    onClick={() => setMainTab('groups')}
                    style={{ flex: 1, color: mainTab === 'groups' ? 'var(--accent-color)' : 'inherit', padding: '6px 12px' }}
                >
                    <Users size={16} /> Pastorais
                </button>
            </div>
            {mainTab === 'people' && view === 'grid' && (
                <button
                    className="btn-primary-action"
                    onClick={() => {
                        setSelectedPerson(null);
                        setView('form');
                    }}
                >
                    <UserPlus size={18} />
                    <span>Novo Fiel</span>
                </button>
            )}
            {mainTab === 'groups' && view !== 'groupForm' && (
                <button
                    className="btn-primary-action"
                    onClick={() => setView('groupForm')}
                >
                    <Plus size={18} />
                    <span>Nova Pastoral</span>
                </button>
            )}
            {mainTab === 'people' && view === 'grid' && (
                <form onSubmit={handleSearch} className="search-bar" style={{ display: 'flex', gap: '10px' }}>
                    <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '40px', width: '100%', height: '42px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <button type="submit" className="btn-secondary">
                        <Filter size={18} /> Filtrar
                    </button>
                </form>
            )}
        </div>
    );

    return (
        <div className="module-container fade-in">
            <ModuleHeader
                title="IGNIS Pastoralis"
                subtitle="Gestão centralizada do diretório de fiéis e pastorais."
                icon={Users}
                actions={headerActions}
            />

            {view === 'groupForm' ? (
                <div className="form-container glass" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <PastoralGroupForm 
                        tenantId={tenantId}
                        onClose={() => setView('grid')}
                        onSuccess={() => {
                            setView('grid');
                            // Em um fluxo real, PastoralGroupsTab deveria ter reload
                            // Para simplificar, quando voltar pra grid, o mainTab=='groups' renderizará novo Mount()
                        }}
                    />
                </div>
            ) : mainTab === 'groups' ? (
                <PastoralGroupsTab tenantId={tenantId} />
            ) : (
                <>
                    {view === 'grid' ? (
                        <div className="people-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {isLoading ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="skeleton glass" style={{ height: '180px', borderRadius: '15px' }}></div>)
                            ) : people.length > 0 ? (
                                people.map(person => (
                                    <div
                                        key={person.id}
                                        className="person-card glass hover-effect"
                                        style={{ padding: '20px', position: 'relative', cursor: 'pointer' }}
                                        onClick={() => handlePersonClick(person)}
                                    >
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                                    <div className="avatar" style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        {person.photoUrl ? (
                                            <img src={person.photoUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={30} style={{ opacity: 0.2 }} />
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: getStatusColor(person.status)
                                            }}></div>
                                            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>
                                                {person.status}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '4px 0' }}>{person.name}</h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', opacity: 0.6 }}>
                                            {person.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> {person.phone}</span>}
                                            {person.email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {person.email}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {(person.groups || []).slice(0, 2).map(tag => (
                                        <span key={tag} style={{
                                            backgroundColor: 'rgba(197, 160, 89, 0.1)',
                                            color: 'var(--accent-color)',
                                            fontSize: '0.7rem',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <Tag size={10} /> {tag}
                                        </span>
                                    ))}
                                    {(person.groups || []).length > 2 && <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>+{person.groups!.length - 2}</span>}
                                </div>

                                <div style={{
                                    marginTop: '15px',
                                    paddingTop: '15px',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.4 }}>Membro desde {new Date(person.createdAt || '').getFullYear() || '2024'}</span>
                                    <ChevronRight size={18} style={{ opacity: 0.2 }} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state glass" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                            <Users size={64} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                            <h3>Nenhum fiel encontrado</h3>
                            <p>Comece cadastrando os membros da sua paróquia.</p>
                            <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setView('form')}>
                                <Plus size={18} /> Novo Cadastro
                            </button>
                        </div>
                    )}
                </div>
            ) : view === 'form' ? (
                <div className="form-container glass" style={{ maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
                    <PersonForm
                        tenantId={tenantId}
                        person={selectedPerson || undefined}
                        onCancel={() => setView('grid')}
                        onSuccess={() => {
                            fetchPeople();
                            setView('grid');
                        }}
                    />
                </div>
            ) : (
                selectedPerson && (
                    <PersonDetails
                        tenantId={tenantId}
                        person={selectedPerson}
                        onClose={() => setView('grid')}
                        onEdit={handleEdit}
                    />
                )
            )}
            </>
            )}
        </div>
    );
};
