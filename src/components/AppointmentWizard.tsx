import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, User, Phone } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { ignisApi } from '../services/api';
import type { Community } from '../services/api';
import { ModalCloseButton } from './ui/ModalCloseButton';
import './AppointmentWizard.css';

interface AppointmentWizardProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId?: string;
    onSuccess?: () => void;
}

type ServiceType = 'Benção de Casas/Comércio' | 'Confissão' | 'Direção Espiritual' | 'Visita aos Enfermos';

const serviceTypes: { name: ServiceType; duration: number; }[] = [
    { name: 'Benção de Casas/Comércio', duration: 30 },
    { name: 'Confissão', duration: 15 },
    { name: 'Direção Espiritual', duration: 45 },
    { name: 'Visita aos Enfermos', duration: 60 }
];

// Simple Phone Mask function for (##) #####-####
const applyPhoneMask = (value: string) => {
    const raw = value.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 0) formatted = `(${raw.substring(0, 2)}`;
    if (raw.length > 2) formatted += `) ${raw.substring(2, 7)}`;
    if (raw.length > 7) formatted += `-${raw.substring(7, 11)}`;
    return formatted;
};

export const AppointmentWizard: React.FC<AppointmentWizardProps> = ({ isOpen, onClose, tenantId, onSuccess }) => {
    const [communities, setCommunities] = useState<Community[]>([]);

    // Form State
    const [selectedCommunity, setSelectedCommunity] = useState<string>('');
    const [selectedService, setSelectedService] = useState<ServiceType | ''>('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [celebrantName, setCelebrantName] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchCommunities = async () => {
            if (tenantId) {
                try {
                    const data = await ignisApi.communities.getByTenant(tenantId);
                    setCommunities(data);
                    if (data.length > 0) {
                        setSelectedCommunity(data[0].id);
                    }
                } catch (error) {
                    console.error('Error fetching communities:', error);
                }
            }
        };
        if (isOpen) {
            fetchCommunities();
            // Reset form on open
            setClientName('');
            setClientPhone('');
            setCelebrantName('');
            setNotes('');
            setSelectedService('');
            setSelectedTime('');
        }
    }, [isOpen, tenantId]);

    const timeSlots = Array.from({ length: 29 }, (_, i) => {
        const hour = Math.floor(i / 2) + 6; // 6h to 20h
        const min = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${min}`;
    });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setClientPhone(applyPhoneMask(e.target.value));
    };

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommunity || !selectedService || !selectedTime || !tenantId || !clientName) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        setIsLoading(true);
        try {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            // Parse local date strictly avoiding timezone shift 
            const dateObj = new Date(selectedDate + 'T00:00:00');
            const startTime = setMinutes(setHours(dateObj, hours), minutes);

            const serviceDuration = serviceTypes.find(s => s.name === selectedService)?.duration || 30;
            const endTime = new Date(startTime.getTime() + serviceDuration * 60000);

            await ignisApi.appointments.create({
                tenantId,
                subTenantId: selectedCommunity,
                clientName: clientName,
                clientPhone: clientPhone,
                celebrantName: celebrantName,
                serviceType: selectedService,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                notes: notes,
                status: 'confirmed'
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            const errorMsg = error.message || 'Erro desconhecido';
            alert(`Erro ao criar agendamento: ${errorMsg}.`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className={`drawer-modal ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h2>Novo Agendamento</h2>
                        <p className="drawer-subtitle">Preencha os dados abaixo para confirmar o agendamento</p>
                    </div>
                    <ModalCloseButton onClose={onClose} />
                </div>

                <div className="drawer-content">
                    <form onSubmit={handleConfirm} className="appointment-form">

                        {/* Fiel Info */}
                        <div className="form-section">
                            <h3 className="section-heading"><User size={16} /> Dados do Fiel</h3>
                            <div className="form-group">
                                <label>Nome Completo *</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    placeholder="Ex: Maria Aparecida"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>WhatsApp</label>
                                <div className="input-icon-wrapper">
                                    <Phone size={16} className="input-icon" />
                                    <input
                                        type="text"
                                        value={clientPhone}
                                        onChange={handlePhoneChange}
                                        placeholder="(11) 90000-0000"
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Event Info */}
                        <div className="form-section">
                            <h3 className="section-heading"><Sparkles size={16} /> Modalidade</h3>

                            <div className="form-group">
                                <label>Unidade *</label>
                                <select
                                    value={selectedCommunity}
                                    onChange={(e) => setSelectedCommunity(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Selecione a Unidade</option>
                                    {communities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Serviço *</label>
                                <select
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                                    required
                                >
                                    <option value="" disabled>Selecione a Modalidade</option>
                                    {serviceTypes.map(s => (
                                        <option key={s.name} value={s.name}>{s.name} ({s.duration} min)</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Celebrante (Padre)</label>
                                <input
                                    type="text"
                                    value={celebrantName}
                                    onChange={e => setCelebrantName(e.target.value)}
                                    placeholder="Deixe em branco se não houver preferência"
                                />
                            </div>
                        </div>

                        {/* Datetime */}
                        <div className="form-section">
                            <h3 className="section-heading"><Calendar size={16} /> Data e Horário</h3>
                            <div className="datetime-row">
                                <div className="form-group flex-1">
                                    <label>Data *</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Horário *</label>
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Selecione</option>
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Obseravations */}
                        <div className="form-section">
                            <h3 className="section-heading">Observações</h3>
                            <div className="form-group">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notas adicionais sobre o agendamento..."
                                    rows={3}
                                />
                            </div>
                        </div>

                    </form>
                </div>

                <div className="drawer-footer">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" onClick={handleConfirm} disabled={isLoading}>
                        {isLoading ? 'Salvando...' : 'Confirmar Agendamento'}
                    </button>
                </div>
            </div>
        </div>
    );
};
