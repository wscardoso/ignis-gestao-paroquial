import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, AlignLeft, Calendar } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { PastoralGroup, PastoralGroupMember } from '../../services/api';

interface PastoralGroupsTabProps {
    tenantId: string;
}

export const PastoralGroupsTab: React.FC<PastoralGroupsTabProps> = ({ tenantId }) => {
    const [groups, setGroups] = useState<PastoralGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // In a complete implementation we'd have selectedGroup to show its members
    const [selectedGroup, setSelectedGroup] = useState<PastoralGroup | null>(null);
    const [groupMembers, setGroupMembers] = useState<PastoralGroupMember[]>([]);
    
    useEffect(() => {
        fetchGroups();
    }, [tenantId]);

    const fetchGroups = async () => {
        setIsLoading(true);
        try {
            const data = await ignisApi.people.getGroups(tenantId);
            setGroups(data);
        } catch (error) {
            console.error('Error fetching groups', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGroupClick = async (group: PastoralGroup) => {
        setSelectedGroup(group);
        try {
            const members = await ignisApi.people.getGroupMembers(group.id);
            setGroupMembers(members);
        } catch (error) {
            console.error(error);
        }
    };

    if (selectedGroup) {
        return (
            <div className="glass" style={{ padding: '24px', borderRadius: '16px', position: 'relative' }}>
                <button className="btn-secondary" style={{ position: 'absolute', top: '24px', right: '24px' }} onClick={() => setSelectedGroup(null)}>Voltar</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={24} style={{ color: 'var(--accent)' }}/>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{selectedGroup.name}</h2>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {selectedGroup.coordinatorName && <span>Coordenação: {selectedGroup.coordinatorName}</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Calendar size={14} /> 
                                {selectedGroup.meetingDay ? `${selectedGroup.meetingDay} às ${selectedGroup.meetingTime || '--:--'}` : (selectedGroup.schedule || 'Sem horário definido')}
                            </span>
                        </div>
                    </div>
                </div>

                {selectedGroup.description && (
                    <div style={{ marginBottom: '24px', opacity: 0.8 }}>
                        <AlignLeft size={16} style={{ display: 'inline', marginRight: '6px' }}/> {selectedGroup.description}
                    </div>
                )}

                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Membros ({groupMembers.length})</h3>
                
                <div className="grid-layout">
                    {groupMembers.map(member => (
                        <div key={member.personId} className="glass" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px' }}>
                            <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {member.person?.photoUrl ? (
                                    <img src={member.person.photoUrl} alt={member.person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    member.person?.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div>
                                <h4 style={{ margin: 0 }}>{member.person?.name}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{member.role}</span>
                            </div>
                        </div>
                    ))}
                    {groupMembers.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', opacity: 0.5 }}>
                            <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                            Ainda não há membros vinculados.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="people-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {isLoading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton glass" style={{ height: '140px', borderRadius: '15px' }}></div>)
            ) : groups.length > 0 ? (
                groups.map(group => (
                    <div
                        key={group.id}
                        className="glass hover-effect"
                        style={{ padding: '24px', position: 'relative', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '16px' }}
                        onClick={() => handleGroupClick(group)}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Users size={20} style={{ color: 'var(--accent)' }}/>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 4px 0' }}>{group.name}</h3>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {(group.meetingDay || group.schedule) && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Calendar size={12}/>
                                            {group.meetingDay ? `${group.meetingDay} às ${group.meetingTime || '--:--'}` : group.schedule}
                                        </span>
                                    )}
                                    {group.coordinatorName && <span style={{ color: 'var(--accent)' }}>Coord: {group.coordinatorName}</span>}
                                </div>
                            </div>
                        </div>
                        {group.description && (
                            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {group.description}
                            </p>
                        )}
                    </div>
                ))
            ) : (
                <div className="empty-state glass" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                    <ShieldAlert size={64} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
                    <h3>Nenhuma Pastoral Ativa</h3>
                    <p>Crie novas pastorais, ministérios ou movimentos para organizar seus fiéis.</p>
                </div>
            )}
        </div>
    );
};
