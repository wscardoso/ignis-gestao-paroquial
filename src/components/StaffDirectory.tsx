import React from 'react';
import { Shield, Smartphone } from 'lucide-react';
import './StaffDirectory.css';

interface StaffMember {
    id: string;
    name: string;
    role: 'Secretária' | 'Ministro' | 'Catequista';
    accessLevel: 'Full' | 'Restricted' | 'Read-Only';
    contact: string;
}

const staff: StaffMember[] = [
    { id: '1', name: 'Ana Souza', role: 'Secretária', accessLevel: 'Full', contact: '(11) 99999-9999' },
    { id: '2', name: 'Roberto Lima', role: 'Ministro', accessLevel: 'Restricted', contact: '(11) 98888-8888' },
    { id: '3', name: 'Carla Dias', role: 'Catequista', accessLevel: 'Read-Only', contact: 'carla@email.com' },
];

export const StaffDirectory: React.FC = () => {
    return (
        <div className="staff-container glass">
            <div className="section-header">
                <h2 className="section-title">Diretório de Staff</h2>
                <span className="staff-count">{staff.length} Membros</span>
            </div>

            <div className="staff-grid">
                {staff.map((member) => (
                    <div key={member.id} className="staff-card">
                        <div className="staff-header">
                            <div className="staff-avatar">{member.name.charAt(0)}</div>
                            <div className={`access-badge ${member.accessLevel.toLowerCase()}`}>
                                <Shield size={10} />
                                {member.accessLevel}
                            </div>
                        </div>

                        <h4 className="staff-name">{member.name}</h4>
                        <p className="staff-role">{member.role}</p>

                        <div className="staff-contact">
                            <div className="contact-item">
                                <Smartphone size={12} />
                                <span>{member.contact}</span>
                            </div>
                        </div>

                        <button className="btn-manage">Gerenciar Acesso</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
