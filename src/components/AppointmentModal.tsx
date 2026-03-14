import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, FileText, Save, Loader2, Trash2, AlertTriangle, Repeat, MessageSquare, CheckCircle } from 'lucide-react';
import { format, setHours, setMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ignisApi } from '../services/api';
import type { Appointment } from '../services/api';
import { ModalCloseButton } from './ui/ModalCloseButton';
import './AppointmentModal.css';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    selectedHour?: number;
    selectedMinute?: number;
    selectedResourceId?: string;
    tenantId: string;
    subTenantId: string;
    onSuccess: () => void;
    initialData?: Appointment; // If present, we are in EDIT mode
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen, onClose, selectedDate, selectedHour = 8, selectedMinute = 0, selectedResourceId = '', tenantId, subTenantId, onSuccess, initialData
}) => {
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [serviceType, setServiceType] = useState('Conversa Pastoral');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [status, setStatus] = useState<Appointment['status']>('pending');
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [conflict, setConflict] = useState<string | null>(null);
    const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceRule, setRecurrenceRule] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');

    useEffect(() => {
        if (initialData) {
            setClientName(initialData.clientName);
            setClientPhone(initialData.clientPhone || '');
            setServiceType(initialData.serviceType);
            setStartTime(format(parseISO(initialData.startTime), "HH:mm"));
            setEndTime(format(parseISO(initialData.endTime), "HH:mm"));
            setStatus(initialData.status);
            setNotes(initialData.notes || '');
            setIsRecurring(!!initialData.isRecurring);
            setRecurrenceRule((initialData.recurrenceRule as any) || 'WEEKLY');
        } else {
            setClientName('');
            setClientPhone('');

            // Map resourceId to serviceType
            const resourceMap: Record<string, string> = {
                'bencao': 'Benção de Casas/Comércio',
                'confissao': 'Confissão',
                'direcao': 'Direção Espiritual',
                'visita': 'Visita aos Enfermos'
            };
            setServiceType(resourceMap[selectedResourceId] || 'Conversa Pastoral');

            const initialStart = setMinutes(setHours(selectedDate, selectedHour), selectedMinute);
            const initialEnd = setMinutes(setHours(selectedDate, selectedHour), selectedMinute + 30);

            setStartTime(format(initialStart, "HH:mm"));
            setEndTime(format(initialEnd, "HH:mm"));
            setStatus('pending');
            setNotes('');
            setIsRecurring(false);
            setRecurrenceRule('WEEKLY');
        }
    }, [initialData, selectedDate, selectedHour, selectedMinute, selectedResourceId, isOpen]);

    useEffect(() => {
        const checkConflicts = async () => {
            if (!isOpen || !tenantId || !subTenantId) return;

            try {
                const dayStart = startOfDay(selectedDate);
                const dayEnd = endOfDay(selectedDate);
                const existing = await ignisApi.appointments.getByDateRange(tenantId, subTenantId, dayStart, dayEnd);
                setExistingAppointments(existing);
            } catch (error) {
                console.error('Error preload for conflict check:', error);
            }
        };
        checkConflicts();
    }, [isOpen, selectedDate, tenantId, subTenantId]);

    useEffect(() => {
        if (!startTime || !endTime || existingAppointments.length === 0) {
            setConflict(null);
            return;
        }

        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startFull = setMinutes(setHours(selectedDate, startH), startM);
        const endFull = setMinutes(setHours(selectedDate, endH), endM);

        const hasOverlap = existingAppointments.some(app => {
            if (initialData && app.id === initialData.id) return false;
            if (app.status === 'cancelled') return false;

            const appStart = new Date(app.startTime);
            const appEnd = new Date(app.endTime);

            return (startFull < appEnd && endFull > appStart);
        });

        setConflict(hasOverlap ? 'Atenção: Este horário conflita com outro agendamento.' : null);
    }, [startTime, endTime, existingAppointments, initialData, selectedDate]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);

            const startFull = setMinutes(setHours(selectedDate, startH), startM);
            const endFull = setMinutes(setHours(selectedDate, endH), endM);

            // Fetch existing for conflict check
            const dayStart = startOfDay(selectedDate);
            const dayEnd = endOfDay(selectedDate);
            const existing = await ignisApi.appointments.getByDateRange(tenantId, subTenantId, dayStart, dayEnd);

            const hasOverlap = existing.some(app => {
                if (initialData && app.id === initialData.id) return false;
                if (app.status === 'cancelled') return false;

                const appStart = new Date(app.startTime);
                const appEnd = new Date(app.endTime);

                return (startFull < appEnd && endFull > appStart);
            });

            if (hasOverlap) {
                alert('Conflito de horário: Já existe um agendamento neste período.');
                setIsSaving(false);
                return;
            }

            const appointmentData = {
                tenantId,
                subTenantId,
                clientName,
                clientPhone,
                serviceType,
                startTime: startFull.toISOString(),
                endTime: endFull.toISOString(),
                status: status,
                notes,
                isRecurring,
                recurrenceRule: isRecurring ? recurrenceRule : undefined
            };

            if (initialData) {
                await ignisApi.appointments.update(initialData.id, appointmentData);
            } else {
                const newApp = await ignisApi.appointments.create({
                    ...appointmentData,
                    whatsappStatus: clientPhone ? 'pending' : 'none'
                });

                // Disparo automático para novos agendamentos
                if (clientPhone) {
                    try {
                        await ignisApi.notifications.sendWhatsAppConfirmation(newApp.id);
                    } catch (err) {
                        console.error('Falha no disparo automático:', err);
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving appointment:', error);
            alert('Erro ao salvar agendamento.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !window.confirm('Tem certeza que deseja excluir este agendamento?')) return;

        setIsDeleting(true);
        try {
            await ignisApi.appointments.delete(initialData.id);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir agendamento.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleResendWhatsApp = async () => {
        if (!initialData) return;
        setIsSaving(true);
        try {
            await ignisApi.notifications.sendWhatsAppConfirmation(initialData.id);
            alert('Notificação enviada com sucesso!');
            onSuccess();
        } catch (error) {
            console.error('Erro ao reenviar WhatsApp:', error);
            alert('Erro ao enviar notificação.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className={`drawer-modal ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h2>{initialData ? 'Detalhes do Agendamento' : 'Novo Agendamento'}</h2>
                        <p className="drawer-subtitle">Verifique e atualize os dados abaixo</p>
                    </div>
                    <ModalCloseButton onClose={onClose} />
                </div>

                <div className="drawer-content">
                    <div className="appointment-form">

                        {/* Status Block */}
                        {initialData && (
                            <div className="form-section" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <div className="form-group flex-1">
                                    <label><CheckCircle size={14} /> Status Atual</label>
                                    <select
                                        className="input-select"
                                        value={status}
                                        onChange={e => setStatus(e.target.value as any)}
                                        style={{ fontWeight: 'bold' }}
                                    >
                                        <option value="pending">Aguardando Confirmação</option>
                                        <option value="confirmed">Confirmado</option>
                                        <option value="completed">Celebrado (Concluído)</option>
                                        <option value="remarcado">Remarcado</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="form-section">
                            <h3 className="section-heading"><User size={16} /> Dados do Fiel</h3>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Maria Aparecida"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                />
                            </div>

                            {conflict && (
                                <div className="form-alert-warning">
                                    <AlertTriangle size={16} />
                                    <span>{conflict}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Phone size={14} /> Telefone (WhatsApp)
                                    </div>
                                    {initialData && initialData.whatsappStatus && initialData.whatsappStatus !== 'none' && (
                                        <div className={`whatsapp-status-badge status-${initialData.whatsappStatus}`} style={{
                                            fontSize: '0.7rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            background: initialData.whatsappStatus === 'sent' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                            color: initialData.whatsappStatus === 'sent' ? '#25D366' : 'inherit'
                                        }}>
                                            {initialData.whatsappStatus === 'sent' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                            {initialData.whatsappStatus === 'sent' ? 'Enviado' : initialData.whatsappStatus === 'pending' ? 'Pendente' : 'Erro'}
                                        </div>
                                    )}
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        style={{ flex: 1 }}
                                        value={clientPhone}
                                        onChange={e => setClientPhone(e.target.value)}
                                    />
                                    {initialData && (
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            title="Reenviar Confirmação no WhatsApp"
                                            onClick={handleResendWhatsApp}
                                            disabled={isSaving || !clientPhone}
                                        >
                                            <MessageSquare size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-heading"><Calendar size={16} /> Evento e Horário</h3>

                            <div className="form-group">
                                <label>Serviço / Sacramento</label>
                                <select
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

                            <div className="form-group recurrence-toggle" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isRecurring ? '15px' : '0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Repeat size={16} className={isRecurring ? 'text-accent' : 'opacity-50'} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Repetir Evento</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isRecurring}
                                        onChange={e => setIsRecurring(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                </div>

                                {isRecurring && (
                                    <div className="recurrence-options" style={{ display: 'flex', gap: '10px' }}>
                                        {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(rule => (
                                            <button
                                                key={rule}
                                                type="button"
                                                className={`btn-secondary ${recurrenceRule === rule ? 'active-rule' : ''}`}
                                                style={{
                                                    flex: 1,
                                                    fontSize: '0.75rem',
                                                    padding: '8px',
                                                    background: recurrenceRule === rule ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255,255,255,0.02)',
                                                    borderColor: recurrenceRule === rule ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                                    color: recurrenceRule === rule ? 'var(--accent-color)' : 'inherit'
                                                }}
                                                onClick={() => setRecurrenceRule(rule)}
                                            >
                                                {rule === 'DAILY' ? 'Diário' : rule === 'WEEKLY' ? 'Semanal' : 'Mensal'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-section">
                                <h3 className="section-heading"><FileText size={16} /> Observações</h3>
                                <div className="form-group">
                                    <textarea
                                        placeholder="Detalhes adicionais..."
                                        rows={3}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="drawer-footer" style={{ justifyContent: 'space-between' }}>
                        <div>
                            {initialData && (
                                <button
                                    className="btn-secondary text-danger"
                                    onClick={handleDelete}
                                    disabled={isSaving || isDeleting}
                                    style={{ borderColor: 'transparent' }}
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    <span style={{ marginLeft: '6px' }}>Excluir</span>
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" onClick={onClose} disabled={isSaving || isDeleting}>Cancelar</button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={isSaving || isDeleting || !clientName}
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span style={{ marginLeft: '6px' }}>{initialData ? 'Atualizar Agendamento' : 'Salvar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
