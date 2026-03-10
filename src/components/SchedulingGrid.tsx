import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ignisApi } from '../services/api';
import type { Appointment, Community } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { AppointmentWizard } from './AppointmentWizard';
import { AppointmentModal } from './AppointmentModal';
import './SchedulingGrid.css';

interface Resource {
    id: string;
    name: string;
    icon: string;
}

const RESOURCES: Resource[] = [
    { id: 'bencao', name: '🏠 Bênção de Casas/Comércio', icon: '🏠' },
    { id: 'confissao', name: '💬 Confissão', icon: '💬' },
    { id: 'direcao', name: '👤 Direção Espiritual', icon: '👤' },
    { id: 'visita', name: '🕯️ Visita aos Enfermos', icon: '🕯️' },
];

const STATUS_MAP: Record<string, { label: string, badgeClass: string }> = {
    'confirmed': { label: '● Confirmado', badgeClass: 'slot-confirmado' },
    'pending': { label: '● Aguardando', badgeClass: 'slot-aguardando' },
    'completed': { label: '● Celebrado', badgeClass: 'slot-celebrado' },
    'cancelled': { label: '● Cancelado', badgeClass: 'slot-cancelado' },
    'remarcado': { label: '● Remarcado', badgeClass: 'slot-remarcado' }
};

export const SchedulingGrid: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedSubTenant, setSelectedSubTenant] = useState<string>('');
    const [_isLoading, setIsLoading] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState(8);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [_selectedResourceId, setSelectedResourceId] = useState<string>('');
    const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const { activeTenant } = useTenant();

    // Generate 30-minute intervals from 06:00 to 20:00 (following Missio reference)
    const timeSlots = [];
    for (let h = 6; h <= 20; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const fetchAppointments = async () => {
        if (activeTenant && selectedSubTenant) {
            setIsLoading(true);
            try {
                let start, end;
                if (viewMode === 'day') {
                    start = startOfDay(selectedDate);
                    end = endOfDay(selectedDate);
                } else if (viewMode === 'week') {
                    start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Domingo
                    end = endOfWeek(selectedDate, { weekStartsOn: 0 });
                } else {
                    start = startOfMonth(selectedDate);
                    end = endOfMonth(selectedDate);
                }

                const data = await ignisApi.appointments.getByDateRange(
                    activeTenant.id,
                    selectedSubTenant,
                    start,
                    end
                );

                // If no actual data, add some simulated ones for validation
                if (data.length === 0) {
                    const baseDate = startOfDay(selectedDate);
                    const simulated: Appointment[] = [
                        {
                            id: 'sim-1',
                            clientName: 'João Silva',
                            clientPhone: '(11) 99999-1111',
                            startTime: new Date(baseDate.getTime() + 9 * 60 * 60 * 1000).toISOString(),
                            endTime: new Date(baseDate.getTime() + 9.5 * 60 * 60 * 1000).toISOString(),
                            serviceType: 'Confissão',
                            status: 'confirmed',
                            tenantId: activeTenant.id,
                            subTenantId: selectedSubTenant
                        },
                        {
                            id: 'sim-2',
                            clientName: 'Maria Costa',
                            clientPhone: '(11) 98888-2222',
                            startTime: new Date(baseDate.getTime() + 10 * 60 * 60 * 1000).toISOString(),
                            endTime: new Date(baseDate.getTime() + 10.5 * 60 * 60 * 1000).toISOString(),
                            serviceType: 'Direção Espiritual',
                            status: 'pending',
                            tenantId: activeTenant.id,
                            subTenantId: selectedSubTenant
                        },
                        {
                            id: 'sim-3',
                            clientName: 'Pedro Santos',
                            clientPhone: '(11) 97777-3333',
                            startTime: new Date(baseDate.getTime() + 11.5 * 60 * 60 * 1000).toISOString(),
                            endTime: new Date(baseDate.getTime() + 12 * 60 * 60 * 1000).toISOString(),
                            serviceType: 'Bênção de Casas/Comércio',
                            status: 'completed',
                            tenantId: activeTenant.id,
                            subTenantId: selectedSubTenant
                        },
                        {
                            id: 'sim-4',
                            clientName: 'Ana Lima',
                            clientPhone: '(11) 96666-4444',
                            startTime: new Date(baseDate.getTime() + 13 * 60 * 60 * 1000).toISOString(),
                            endTime: new Date(baseDate.getTime() + 14 * 60 * 60 * 1000).toISOString(),
                            serviceType: 'Visita aos Enfermos',
                            status: 'remarcado',
                            tenantId: activeTenant.id,
                            subTenantId: selectedSubTenant
                        }
                    ];
                    setAppointments(simulated);
                } else {
                    setAppointments(data);
                }
            } catch (error) {
                console.error('Error fetching appointments:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const fetchBaseData = async () => {
            if (activeTenant) {
                const data = await ignisApi.communities.getByTenant(activeTenant.id);
                setCommunities(data);
                if (data.length > 0) setSelectedSubTenant(data[0].id);
            }
        };
        fetchBaseData();
    }, [activeTenant]);

    useEffect(() => {
        fetchAppointments();
    }, [activeTenant, selectedSubTenant, selectedDate, viewMode]);

    const navigateDate = (amount: number) => {
        if (viewMode === 'day') {
            setSelectedDate(prev => addDays(prev, amount));
        } else if (viewMode === 'week') {
            setSelectedDate(prev => addWeeks(prev, amount));
        } else {
            setSelectedDate(prev => addMonths(prev, amount));
        }
    };

    const formatCurrentDateLabel = () => {
        if (viewMode === 'day') return format(selectedDate, "dd 'de' MMM", { locale: ptBR });
        if (viewMode === 'week') {
            const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
            return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM", { locale: ptBR })}`;
        }
        return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
    };

    const getAppointmentForSlot = (time: string, resourceId: string) => {
        return appointments.find(app => {
            const appTime = format(new Date(app.startTime), 'HH:mm');

            // Map resourceId to serviceType for matching. Updated names.
            const resourceToService: Record<string, string> = {
                'bencao': 'Bênção de Casas/Comércio',
                'confissao': 'Confissão',
                'direcao': 'Direção Espiritual',
                'visita': 'Visita aos Enfermos'
            };

            const targetService = resourceToService[resourceId];
            return appTime === time && app.serviceType === targetService;
        });
    };

    const getAppointmentsForWeekSlot = (time: string, date: Date) => {
        return appointments.filter(app => {
            const appTime = format(new Date(app.startTime), 'HH:mm');
            return appTime === time && isSameDay(new Date(app.startTime), date);
        });
    };

    const getAppointmentsForDay = (date: Date) => {
        return appointments.filter(app => isSameDay(new Date(app.startTime), date));
    };

    const handleSlotClick = (time: string, resourceId: string) => {
        const [h, m] = time.split(':').map(Number);
        setSelectedHour(h);
        setSelectedMinute(m);
        setSelectedResourceId(resourceId);
        setEditingAppointment(undefined);
        setIsModalOpen(true); // Can also map to Wizard if preferred later
    };

    const handleAppointmentClick = (app: Appointment) => {
        setEditingAppointment(app);
        setIsModalOpen(true);
    };

    return (
        <div className="scheduling-grid-container">
            <div className="grid-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h2 className="section-title">Gestão de atendimentos e sacramentos no SaaS Paroquial</h2>
                    {communities.length > 0 && (
                        <select
                            className="community-filter"
                            value={selectedSubTenant}
                            onChange={e => setSelectedSubTenant(e.target.value)}
                        >
                            {communities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="view-switcher">
                        <button className={`view-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Dia</button>
                        <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Semana</button>
                        <button className={`view-btn ${viewMode === 'month' ? 'active' : ''}`} onClick={() => setViewMode('month')}>Mês</button>
                    </div>

                    <div className="grid-day-selector">
                        <button className="btn-icon" onClick={() => navigateDate(-1)}>
                            <ChevronLeft size={16} />
                        </button>
                        <div className="date-picker-wrapper">
                            <span className="current-date">
                                {formatCurrentDateLabel()}
                            </span>
                            <input
                                type="date"
                                className="hidden-date-input"
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                            />
                        </div>
                        <button className="btn-icon" onClick={() => navigateDate(1)}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <button className="btn-primary" onClick={() => setIsWizardOpen(true)}>
                        <Plus size={16} />
                        <span>Novo Agendamento</span>
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="grid-legend">
                <div className="legend-item"><div className="status-dot dot-confirmado"></div> Confirmado</div>
                <div className="legend-item"><div className="status-dot dot-aguardando"></div> Aguardando</div>
                <div className="legend-item"><div className="status-dot dot-celebrado"></div> Celebrado</div>
                <div className="legend-item"><div className="status-dot dot-cancelado"></div> Cancelado</div>
                <div className="legend-item"><div className="status-dot dot-remarcado"></div> Remarcado</div>
            </div>

            {viewMode === 'day' && (
                <div className="schedule-table">
                    <div className="table-header">
                        <div className="th">Horário</div>
                        {RESOURCES.map((res) => (
                            <div key={res.id} className="th">
                                {res.name}
                            </div>
                        ))}
                    </div>

                    <div className="grid-body">
                        {timeSlots.map((time) => (
                            <div key={time} className="table-row">
                                <div className="td-time">{time}</div>
                                {RESOURCES.map((res) => {
                                    const app = getAppointmentForSlot(time, res.id);
                                    return (
                                        <div key={res.id} className="td-slot">
                                            {app ? (
                                                <div
                                                    className={`slot-badge ${STATUS_MAP[app.status]?.badgeClass || 'slot-aguardando'}`}
                                                    title={`${STATUS_MAP[app.status]?.label?.replace('● ', '')}: ${app.clientName} - ${app.clientPhone || 'Sem telefone'}`}
                                                    onClick={() => handleAppointmentClick(app)}
                                                >
                                                    <div className="slot-client-name">{app.clientName.split(' ')[0]}</div>
                                                    {app.clientPhone && (
                                                        <small className="slot-client-phone">{app.clientPhone}</small>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    className="slot-disponivel"
                                                    onClick={() => handleSlotClick(time, res.id)}
                                                >
                                                    Disponível
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'week' && (
                <div className="schedule-table week-view">
                    <div className="table-header week-header">
                        <div className="th">Horário</div>
                        {eachDayOfInterval({ start: startOfWeek(selectedDate, { weekStartsOn: 0 }), end: endOfWeek(selectedDate, { weekStartsOn: 0 }) }).map(date => (
                            <div key={date.toString()} className="th" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.95rem' }}>{format(date, 'EEEE', { locale: ptBR })}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isSameDay(date, new Date()) ? 'var(--accent)' : 'inherit' }}>
                                    {format(date, 'dd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid-body week-body">
                        {timeSlots.map(time => (
                            <div key={time} className="table-row week-row">
                                <div className="td-time">{time}</div>
                                {eachDayOfInterval({ start: startOfWeek(selectedDate, { weekStartsOn: 0 }), end: endOfWeek(selectedDate, { weekStartsOn: 0 }) }).map(date => {
                                    const slotApps = getAppointmentsForWeekSlot(time, date);
                                    return (
                                        <div key={date.toString()} className="td-slot week-slot">
                                            <div className="slot-items">
                                                {slotApps.map(app => (
                                                    <div
                                                        key={app.id}
                                                        className={`slot-badge ${STATUS_MAP[app.status]?.badgeClass || 'slot-aguardando'}`}
                                                        title={`${app.serviceType}: ${app.clientName}`}
                                                        onClick={() => handleAppointmentClick(app)}
                                                    >
                                                        <div className="slot-client-name">{app.clientName.split(' ')[0]}</div>
                                                        <small className="slot-client-phone" style={{ fontSize: '0.6rem' }}>{app.serviceType.split(' ')[0]}</small>
                                                    </div>
                                                ))}
                                                {slotApps.length === 0 && (
                                                    <button
                                                        className="slot-disponivel"
                                                        onClick={() => {
                                                            setSelectedDate(date);
                                                            handleSlotClick(time, 'conversapastoral');
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {viewMode === 'month' && (
                <div className="schedule-table month-view">
                    <div className="month-grid-header">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="month-dow">{day}</div>
                        ))}
                    </div>
                    <div className="month-grid-body">
                        {eachDayOfInterval({ start: startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 }) }).map((date, i) => {
                            const dayApps = getAppointmentsForDay(date);
                            const isCurrentMonth = isSameMonth(date, selectedDate);
                            const isToday = isSameDay(date, new Date());

                            return (
                                <div key={i} className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}>
                                    <div className="month-cell-header">
                                        <span className={`date-num ${isToday ? 'bg-accent' : ''}`}>{format(date, 'd')}</span>
                                        <button className="add-btn-tiny" onClick={() => {
                                            setSelectedDate(date);
                                            handleSlotClick('08:00', 'conversapastoral');
                                        }}><Plus size={12} /></button>
                                    </div>
                                    <div className="month-cell-content">
                                        {dayApps.map(app => (
                                            <div
                                                key={app.id}
                                                className={`month-pill ${STATUS_MAP[app.status]?.badgeClass || 'slot-aguardando'}`}
                                                onClick={() => handleAppointmentClick(app)}
                                                title={`${format(new Date(app.startTime), 'HH:mm')} - ${app.clientName}`}
                                            >
                                                <span className="pill-time">{format(new Date(app.startTime), 'HH:mm')}</span> {app.clientName.split(' ')[0]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modals */}
            <AppointmentWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={fetchAppointments}
                tenantId={activeTenant?.id}
            />

            {isModalOpen && activeTenant && (
                <AppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    selectedHour={selectedHour}
                    selectedMinute={selectedMinute}
                    tenantId={activeTenant.id}
                    subTenantId={selectedSubTenant || ''}
                    onSuccess={fetchAppointments}
                    initialData={editingAppointment}
                />
            )}
        </div>
    );
};
