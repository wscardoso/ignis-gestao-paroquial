import React, { useState } from 'react';
import { X, Calendar, Clock, User, Phone, FileText, Save, Loader2 } from 'lucide-react';
import { format, setHours, setMinutes } from 'date-fns';
import { ignisApi } from '../services/api';
import './NewAppointmentModal.css';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    selectedHour: number;
    tenantId: string;
    subTenantId: string;
    onSuccess: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
    isOpen, onClose, selectedDate, selectedHour, tenantId, subTenantId, onSuccess
}) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [serviceType, setServiceType] = useState('Conversa Pastoral');
    const [startTime, setStartTime] = useState(format(setMinutes(setHours(selectedDate, selectedHour), 0), "HH:mm"));
    const [endTime, setEndTime] = useState(format(setMinutes(setHours(selectedDate, selectedHour + 1), 0), "HH:mm"));
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [sendWhatsApp, setSendWhatsApp] = useState(true);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);

            const startFull = setMinutes(setHours(selectedDate, startH), startM);
            const endFull = setMinutes(setHours(selectedDate, endH), endM);

            const newAppointment = await ignisApi.appointments.create({
                tenantId,
                subTenantId,
                clientName,
                clientPhone,
                serviceType,
                startTime: startFull.toISOString(),
                endTime: endFull.toISOString(),
                status: 'pending',
                notes,
                whatsappStatus: sendWhatsApp ? 'pending' : 'none'
            });

            if (sendWhatsApp && clientPhone) {
                try {
                    await ignisApi.notifications.sendWhatsAppConfirmation(newAppointment.id);
                } catch (notiError) {
                    console.error('Falha ao disparar notificação automática:', notiError);
                    // Não travamos o fluxo se a notificação falhar
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert('Erro ao criar agendamento.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="appointment-modal-overlay" onClick={onClose}>
            <div className="appointment-modal glass" onClick={e => e.stopPropagation()}>
                <div className="modal-content-inner">
                    <div className="modal-header-row">
                        <h2>
                            <Calendar size={22} className="text-accent" />
                            Novo Agendamento
                        </h2>
                        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label><User size={14} /> Fiel / Cliente</label>
                            <input
                                type="text"
                                className="input-text"
                                placeholder="Nome completo"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label><Phone size={14} /> Telefone (WhatsApp)</label>
                            <input
                                type="text"
                                className="input-text"
                                placeholder="(00) 00000-0000"
                                value={clientPhone}
                                onChange={e => setClientPhone(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label><Clock size={14} /> Serviço / Sacramento</label>
                            <select
                                className="input-select"
                                value={serviceType}
                                onChange={e => setServiceType(e.target.value)}
                            >
                                <option>Conversa Pastoral</option>
                                <option>Confissão</option>
                                <option>Direção Espiritual</option>
                                <option>Bênção de Objetos</option>
                                <option>Assinatura de Documentos</option>
                                <option>Outros</option>
                            </select>
                        </div>

                        <div className="time-inputs">
                            <div className="form-group">
                                <label>Início</label>
                                <input
                                    type="time"
                                    className="input-text"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Término</label>
                                <input
                                    type="time"
                                    className="input-text"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label><FileText size={14} /> Notas / Observações</label>
                            <textarea
                                className="input-textarea"
                                placeholder="Detalhes adicionais..."
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="checkbox"
                                id="sendWhatsApp"
                                checked={sendWhatsApp}
                                onChange={e => setSendWhatsApp(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="sendWhatsApp" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Enviar confirmação automática via WhatsApp
                            </label>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={isSaving || !clientName}
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>Salvar Agendamento</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
