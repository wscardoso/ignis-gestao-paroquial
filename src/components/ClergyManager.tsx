import React, { useState } from 'react';
import { Calendar, User, Clock, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import './ClergyManager.css';

interface ClergyMember {
    id: string;
    name: string;
    role: 'Padre' | 'Diácono';
    status: 'available' | 'busy' | 'off';
    nextEvent?: string;
    workload: number;
}

const clergy: ClergyMember[] = [
    { id: '1', name: 'Pe. João Silva', role: 'Padre', status: 'available', workload: 32, nextEvent: 'Confissão (14:00)' },
    { id: '2', name: 'Pe. Carlos Souza', role: 'Padre', status: 'busy', workload: 45, nextEvent: 'Missa na Matriz (Agora)' },
    { id: '3', name: 'Diác. Marcos', role: 'Diácono', status: 'off', workload: 12, nextEvent: 'Folga Semanal' },
];

const scheduleMock = [
    { day: 'Seg', events: [{ time: '08:00', title: 'Missa Matriz', staff: 'Pe. João' }] },
    { day: 'Ter', events: [{ time: '19:00', title: 'Grupo Oração', staff: 'Diác. Marcos' }] },
    { day: 'Qua', events: [{ time: '15:00', title: 'Confissões', staff: 'Pe. Carlos' }, { time: '15:00', title: 'Visita Hospital', staff: 'Pe. Carlos', conflict: true }] },
];

export const ClergyManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'list' | 'schedule'>('list');

    return (
        <div className="clergy-container">
            <div className="section-header">
                <h2 className="section-title">Gestão do Clero</h2>
                <div className="header-actions">
                    <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>Equipe</button>
                    <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>Escala Semanal</button>
                </div>
            </div>

            {activeTab === 'list' ? (
                <div className="clergy-list">
                    {clergy.map((member) => (
                        <div key={member.id} className={`clergy-card ${member.status}`}>
                            <div className="clergy-info">
                                <div className="clergy-avatar"><User size={20} /></div>
                                <div>
                                    <h4 className="clergy-name">{member.name}</h4>
                                    <p className="clergy-role">{member.role}</p>
                                </div>
                            </div>
                            <div className="clergy-metrics">
                                <div className="metric">
                                    <span className="label">Carga</span>
                                    <div className="progress-bar-mini">
                                        <div className={`fill ${member.workload > 40 ? 'warning' : ''}`} style={{ width: `${Math.min(member.workload, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="clergy-status">
                                <div className="status-indicator">
                                    {member.status === 'busy' ? <Clock size={14} /> : <CheckCircle size={14} />}
                                    <span>{member.status === 'busy' ? 'Ocupado' : member.status === 'available' ? 'Disponível' : 'Folga'}</span>
                                </div>
                                {member.nextEvent && <p className="next-event">{member.nextEvent}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="schedule-view">
                    <div className="schedule-header">
                        <button className="nav-btn"><ChevronLeft size={16} /></button>
                        <span>Semana 12-18 Fev</span>
                        <button className="nav-btn"><ChevronRight size={16} /></button>
                    </div>
                    <div className="schedule-grid">
                        {scheduleMock.map((day) => (
                            <div key={day.day} className="day-column">
                                <div className="day-header">{day.day}</div>
                                <div className="day-events">
                                    {day.events.map((event, idx) => (
                                        <div key={idx} className={`event-card ${event.conflict ? 'conflict' : ''}`}>
                                            <span className="event-time">{event.time}</span>
                                            <span className="event-title">{event.title}</span>
                                            <span className="event-staff">{event.staff}</span>
                                            {event.conflict && (
                                                <div className="conflict-badge">
                                                    <AlertTriangle size={12} />
                                                    <span>Bilocação!</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
