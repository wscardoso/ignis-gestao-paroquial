import React from 'react';
import { Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import './LocalTriagem.css';

interface MissioTask {
    id: string;
    type: string;
    patient: string;
    location: string;
    time: string;
    urgency: 'high' | 'medium' | 'low';
}

const tasks: MissioTask[] = [
    { id: '1', type: 'Unção dos Enfermos', patient: 'Dona Maria Oliveira', location: 'Rua das Flores, 123', time: '14:30', urgency: 'high' },
    { id: '2', type: 'Bênção de Residência', patient: 'Família Silva', location: 'Av. Paulista, 1000', time: '16:00', urgency: 'medium' },
    { id: '3', type: 'Direção Espiritual', patient: 'Jovem Matheus', location: 'Gabinete Pastoral', time: '17:30', urgency: 'low' },
    { id: '4', type: 'Comunhão aos Enfermos', patient: 'Sr. José Santos', location: 'Rua Maranhão, 45', time: 'Amanhã 09:00', urgency: 'low' },
];

export const LocalTriagem: React.FC = () => {
    return (
        <div className="triagem-container">
            <div className="section-header">
                <h2 className="section-title">Triagem Missionária Local</h2>
                <div className="section-badge">IGNIS Missio</div>
            </div>

            <div className="tasks-list">
                {tasks.map((task) => (
                    <div key={task.id} className={`task-card glass urgency-${task.urgency}`}>
                        <div className="task-main">
                            <div className="task-type-header">
                                <span className="task-type">{task.type}</span>
                                {task.urgency === 'high' && <AlertCircle size={16} className="urgency-icon" />}
                            </div>
                            <h3 className="task-patient">{task.patient}</h3>
                            <div className="task-info">
                                <div className="info-item">
                                    <MapPin size={14} />
                                    <span>{task.location}</span>
                                </div>
                                <div className="info-item">
                                    <Clock size={14} />
                                    <span>{task.time}</span>
                                </div>
                            </div>
                        </div>

                        <div className="task-actions">
                            <button className="btn-assign">Designar Ministro</button>
                            <button className="btn-done">
                                <CheckCircle2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
