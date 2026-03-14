import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Calendar,
  Info,
  Trash2,
  UserX,
  Search,
  Filter,
  Printer
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, isToday, isTomorrow, addWeeks, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ignisApi } from '../services/api';
import type { Appointment } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import { AppointmentModal } from './AppointmentModal';
import './PriestAgenda.css';

const SERVICE_LABELS: Record<string, string> = {
  confession: 'Confissão',
  mass: 'Missa',
  baptism: 'Batismo',
  marriage: 'Matrimônio',
  anointing: 'Unção dos Enfermos',
  counseling: 'Direção Espiritual',
  blessing: 'Bênção',
  first_communion: '1ª Eucaristia',
  confirmation: 'Crisma',
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  confirmed: { icon: <CheckCircle2 size={16} />, label: 'Confirmado', className: 'confirmed' },
  completed: { icon: <CheckCircle2 size={16} />, label: 'Realizado', className: 'completed' },
  pending: { icon: <Clock size={16} />, label: 'Pendente', className: 'pending' },
  cancelled: { icon: <Ban size={16} />, label: 'Cancelado', className: 'cancelled' },
  no_show: { icon: <UserX size={16} />, label: 'Faltou', className: 'no-show' },
  remarcado: { icon: <Clock size={16} />, label: 'Remarcado', className: 'pending' },
};

function generateTimeSlots(startHour = 6, endHour = 22, intervalMin = 30): string[] {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMin) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

export const PriestAgenda: React.FC = () => {
  const { activeTenant, activeSubTenant } = useTenant();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [selectedSubTenantId, setSelectedSubTenantId] = useState<string>('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const timeSlots = generateTimeSlots();

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => a.clientName.toLowerCase().includes(term));
    }
    return filtered;
  }, [appointments, statusFilter, searchTerm]);

  const getFilteredAppointmentForSlot = (time: string): Appointment | undefined => {
    return filteredAppointments.find(a => {
      const apptTime = new Date(a.startTime);
      const h = String(apptTime.getHours()).padStart(2, '0');
      const m = String(apptTime.getMinutes()).padStart(2, '0');
      return `${h}:${m}` === time;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Load communities
  useEffect(() => {
    if (!activeTenant) return;
    ignisApi.communities.getByTenant(activeTenant.id).then(comms => {
      setCommunities(comms.map(c => ({ id: c.id, name: c.name })));
      if (comms.length > 0 && !selectedSubTenantId) {
        setSelectedSubTenantId(activeSubTenant?.id || comms[0].id);
      }
    });
  }, [activeTenant?.id]);

  // Fetch appointments for selected date
  const fetchAppointments = useCallback(async () => {
    if (!activeTenant || !selectedSubTenantId) return;
    setIsLoading(true);
    try {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      const data = await ignisApi.appointments.getByDateRange(
        activeTenant.id, selectedSubTenantId, start, end
      );
      setAppointments(data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      toast.error('Erro ao carregar agenda');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant?.id, selectedSubTenantId, selectedDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Realtime subscription
  useRealtimeSubscription({
    table: 'appointments',
    filter: activeTenant ? `tenant_id=eq.${activeTenant.id}` : undefined,
    enabled: !!activeTenant,
    onInsert: (payload) => {
      const row = payload.new;
      toast.success(`📋 ${row.client_name} agendou ${SERVICE_LABELS[row.service_type] || row.service_type}`, { duration: 5000 });
      fetchAppointments();
    },
    onUpdate: () => fetchAppointments(),
    onDelete: () => fetchAppointments(),
  });

  // Quick actions
  const handleCheckIn = async (appointment: Appointment) => {
    try {
      await ignisApi.appointments.updateStatus(appointment.id, 'completed');
      toast.success(`✅ ${appointment.clientName} — Check-in realizado`);
      fetchAppointments();
      // Enviar notificação WhatsApp silenciosamente
      try {
        await ignisApi.notifications.sendWhatsAppConfirmation(appointment.id);
      } catch {
        // Falha no WhatsApp não bloqueia o check-in
        console.warn('WhatsApp notification failed for check-in:', appointment.id);
      }
    } catch {
      toast.error('Erro ao registrar check-in');
    }
  };

  const handleNoShow = async (appointment: Appointment) => {
    try {
      await ignisApi.appointments.updateStatus(appointment.id, 'cancelled');
      toast.success(`❌ ${appointment.clientName} — Marcado como falta`);
      fetchAppointments();
    } catch {
      toast.error('Erro ao registrar falta');
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    try {
      await ignisApi.appointments.updateStatus(appointment.id, 'cancelled');
      toast.success('Agendamento cancelado');
      fetchAppointments();
    } catch {
      toast.error('Erro ao cancelar');
    }
  };

  // Date navigation
  const navigateDate = (days: number) => setSelectedDate(prev => addDays(prev, days));
  const goToToday = () => setSelectedDate(new Date());
  const goToTomorrow = () => setSelectedDate(addDays(new Date(), 1));
  const goToNextWeek = () => setSelectedDate(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 }));

  const getQuickBtnActive = () => {
    if (isToday(selectedDate)) return 'today';
    if (isTomorrow(selectedDate)) return 'tomorrow';
    return '';
  };

  // KPIs based on filtered data
  const kpis = {
    total: filteredAppointments.length,
    confirmed: filteredAppointments.filter(a => a.status === 'confirmed').length,
    completed: filteredAppointments.filter(a => a.status === 'completed').length,
    pending: filteredAppointments.filter(a => a.status === 'pending').length,
    noShow: filteredAppointments.filter(a => a.status === 'cancelled').length,
  };

  const isFiltering = statusFilter !== 'todos' || searchTerm.trim() !== '';

  if (!activeTenant) {
    return <div className="agenda-empty"><Calendar size={32} /><span>Nenhuma paróquia ativa</span></div>;
  }

  return (
    <div className="agenda-print-wrapper" ref={printRef}>
      {/* Controls */}
      <div className="agenda-controls no-print">
        <div className="agenda-date-nav">
          <button onClick={() => navigateDate(-1)}><ChevronLeft size={18} /></button>
          <span className="agenda-date-label">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
          <button onClick={() => navigateDate(1)}><ChevronRight size={18} /></button>
        </div>

        <div className="agenda-quick-btns">
          <button className={getQuickBtnActive() === 'today' ? 'active' : ''} onClick={goToToday}>Hoje</button>
          <button className={getQuickBtnActive() === 'tomorrow' ? 'active' : ''} onClick={goToTomorrow}>Amanhã</button>
          <button onClick={goToNextWeek}>Próx. Semana</button>
        </div>

        {communities.length > 1 && (
          <select
            value={selectedSubTenantId}
            onChange={e => setSelectedSubTenantId(e.target.value)}
            className="agenda-community-select"
          >
            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {/* Filters Row */}
      <div className="agenda-filters no-print">
        <div className="agenda-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nome do fiel..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="agenda-status-filter">
          <Filter size={14} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="todos">Todos os status</option>
            <option value="confirmed">✅ Confirmado</option>
            <option value="pending">⏳ Pendente</option>
            <option value="completed">✔️ Realizado</option>
            <option value="cancelled">🚫 Cancelado</option>
          </select>
        </div>

        <button className="agenda-print-btn" onClick={handlePrint} title="Imprimir agenda">
          <Printer size={16} />
          <span>Imprimir</span>
        </button>
      </div>

      {/* Print Header */}
      <div className="print-only print-header">
        <h2>Agenda Paroquial</h2>
        <p>{format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        {communities.find(c => c.id === selectedSubTenantId) && (
          <p>{communities.find(c => c.id === selectedSubTenantId)!.name}</p>
        )}
      </div>

      {/* Main Layout */}
      <div className="priest-agenda">
        <div className="agenda-main">
          {isLoading ? (
            <div className="agenda-loading">
              <div className="spinner" />
              <span>Carregando agenda...</span>
            </div>
          ) : (
            <div className="agenda-slots">
              {timeSlots.map(time => {
                const appt = getFilteredAppointmentForSlot(time);
                if (isFiltering && !appt) return null;

                const endTime = (() => {
                  const [h, m] = time.split(':').map(Number);
                  const total = h * 60 + m + 30;
                  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
                })();

                const statusCfg = appt ? (STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending) : null;

                return (
                  <div key={time} className="agenda-slot">
                    <span className="slot-time">{time} – {endTime}</span>

                    {appt ? (
                      <>
                        <div className={`slot-status-icon ${statusCfg!.className}`}>
                          {statusCfg!.icon}
                        </div>
                        <div className="slot-info">
                          <div className="slot-client-name">{appt.clientName}</div>
                          <div className="slot-service-type">
                            {SERVICE_LABELS[appt.serviceType] || appt.serviceType}
                          </div>
                        </div>
                        <div className="slot-actions no-print">
                          {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                            <>
                              <button
                                className="slot-action-btn check-in"
                                title="Check-in"
                                onClick={() => handleCheckIn(appt)}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                className="slot-action-btn no-show"
                                title="Marcar falta"
                                onClick={() => handleNoShow(appt)}
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button
                            className="slot-action-btn"
                            title="Detalhes"
                            onClick={() => {
                              setEditingAppointment(appt);
                              setIsModalOpen(true);
                            }}
                          >
                            <Info size={16} />
                          </button>
                          {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                            <button
                              className="slot-action-btn cancel"
                              title="Cancelar"
                              onClick={() => handleCancel(appt)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="slot-status-icon available"><Clock size={14} /></div>
                    )}
                    {!appt && <span className="slot-empty">Disponível</span>}
                  </div>
                );
              })}
              {isFiltering && filteredAppointments.length === 0 && (
                <div className="agenda-empty">
                  <Search size={28} />
                  <span>Nenhum agendamento encontrado</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar KPIs */}
        <div className="agenda-sidebar">
          <div className="agenda-kpi-card">
            <div className="agenda-kpi-title">Resumo do Dia</div>
            <div className="agenda-kpi-list">
              <div className="kpi-row">
                <span className="kpi-label"><span className="kpi-dot total" /> Total</span>
                <span className="kpi-value">{kpis.total}</span>
              </div>
              <div className="kpi-row">
                <span className="kpi-label"><span className="kpi-dot confirmed" /> Confirmados</span>
                <span className="kpi-value">{kpis.confirmed}</span>
              </div>
              <div className="kpi-row">
                <span className="kpi-label"><span className="kpi-dot completed" /> Realizados</span>
                <span className="kpi-value">{kpis.completed}</span>
              </div>
              <div className="kpi-row">
                <span className="kpi-label"><span className="kpi-dot pending" /> Pendentes</span>
                <span className="kpi-value">{kpis.pending}</span>
              </div>
              <div className="kpi-row">
                <span className="kpi-label"><span className="kpi-dot no-show" /> Faltaram</span>
                <span className="kpi-value">{kpis.noShow}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && editingAppointment && activeTenant && selectedSubTenantId && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingAppointment(null); }}
          selectedDate={selectedDate}
          tenantId={activeTenant.id}
          subTenantId={selectedSubTenantId}
          onSuccess={fetchAppointments}
          initialData={editingAppointment}
        />
      )}
    </div>
  );
};
