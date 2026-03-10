import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ignisApi, type Appointment, type Community } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import { AppointmentWizard } from './AppointmentWizard';
import { AppointmentModal } from './AppointmentModal';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

// PALETA OFICIAL IGNIS
const IGNIS = {
    red: "#A32121",
    gold: "#D1A84A",
    white: "#FAFAF7",
    green: "#2F6F4E",
    graphite: "#2A2A2A",
    redDark: "#3B0A0A",
    goldDark: "#3D2C0A",
    greenDark: "#0D2318",
    bgMain: "#1A1410",
    bgSidebar: "#151210",
    bgCard: "#201A14",
    border: "#382E22",
    borderMid: "#4A3C2A",
    textMuted: "#897560",
    textFaint: "#564637",
};

const STATUS_CONFIG: Record<string, any> = {
    confirmed: { label: "Confirmado", bg: IGNIS.greenDark, border: IGNIS.green, dot: "#4CAF82", text: "#C8EDDA" },
    pending: { label: "Pendente", bg: IGNIS.goldDark, border: IGNIS.gold, dot: IGNIS.gold, text: "#F0DFA0" },
    completed: { label: "Celebrado", bg: "#1E1030", border: "#7C3AED", dot: "#A78BFA", text: "#DDD6FE" },
    noshow: { label: "No-show", bg: IGNIS.redDark, border: IGNIS.red, dot: "#E05555", text: "#F5C0C0" },
    cancelled: { label: "Cancelado", bg: "#1A1A1A", border: "#444444", dot: "#666666", text: "#999999" },
};

const RESOURCES = [
    { id: "bencao", name: "Bênção de Casas/Comércio", icon: "🏠" },
    { id: "confissao", name: "Confissão", icon: "🗨️" },
    { id: "direcao", name: "Direção Espiritual", icon: "👥" },
    { id: "visita", name: "Visita aos Enfermos", icon: "🕊️" },
];

function generateTimeSlots() {
    const s = [];
    for (let h = 6; h <= 22; h++) {
        s.push(`${String(h).padStart(2, "0")}:00`);
        s.push(`${String(h).padStart(2, "0")}:30`);
    }
    return s;
}

export const ParishSchedulerGrid: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState(8);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedSubTenant, setSelectedSubTenant] = useState<string>('');
    const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
    const { activeTenant } = useTenant();

    const fetchAppointments = async () => {
        if (activeTenant && selectedSubTenant) {
            try {
                const start = startOfDay(selectedDate);
                const end = endOfDay(selectedDate);
                const data = await ignisApi.appointments.getByDateRange(
                    activeTenant.id,
                    selectedSubTenant,
                    start,
                    end
                );
                setAppointments(data);
            } catch (error) {
                console.error('Error fetching appointments:', error);
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
    }, [activeTenant, selectedSubTenant, selectedDate]);

    const timeSlots = useMemo(() => generateTimeSlots(), []);

    const getAppointmentForSlot = (time: string, resourceId: string) => {
        return appointments.find(app => {
            const appTime = format(new Date(app.startTime), 'HH:mm');
            const resourceToService: Record<string, string> = {
                'bencao': 'Benção de Casas/Comércio',
                'confissao': 'Confissão',
                'direcao': 'Direção Espiritual',
                'visita': 'Visita aos Enfermos'
            };
            return appTime === time && app.serviceType === resourceToService[resourceId];
        });
    };

    const handleSlotClick = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        setSelectedHour(h);
        setSelectedMinute(m);
        setEditingAppointment(undefined);
        setIsModalOpen(true);
    };

    const handleAppointmentClick = (app: Appointment) => {
        setEditingAppointment(app);
        setIsModalOpen(true);
    };

    const navigateDate = (amount: number) => {
        setSelectedDate(prev => addDays(prev, amount));
    };

    // Componentes Internos com Estilos Reais
    const AppointmentCard = ({ appt }: { appt: Appointment }) => {
        const statusKey = (appt.status as string) === 'no-show' ? 'noshow' : appt.status;
        const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
        return (
            <button
                onClick={() => handleAppointmentClick(appt)}
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
                className="w-full min-h-[52px] rounded-lg flex items-center justify-between px-3 py-2 gap-2 hover:brightness-125 hover:scale-[1.02] transition-all duration-150 cursor-pointer text-left"
            >
                <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-sm leading-tight truncate">{appt.clientName}</span>
                    <span className="text-xs opacity-60 truncate">{appt.serviceType}</span>
                </div>
                <span style={{ background: cfg.dot }} className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
            </button>
        );
    };

    const AvailableSlot = ({ time }: { time: string, resourceId: string }) => {
        const [hov, setHov] = useState(false);
        return (
            <button
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                onClick={() => handleSlotClick(time)}
                style={{
                    borderColor: hov ? IGNIS.gold : IGNIS.border,
                    color: hov ? IGNIS.gold : IGNIS.textFaint,
                    background: hov ? "rgba(209,168,74,0.06)" : "transparent",
                }}
                className="w-full min-h-[52px] rounded-lg border border-dashed flex items-center justify-center text-sm font-medium transition-all duration-150 cursor-pointer"
            >
                <span className="flex items-center gap-1.5"><span className="text-lg">+</span> Disponível</span>
            </button>
        );
    };

    const ExpandedCalendar = () => {
        const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        // Simple day grid for the sidebar
        const currentMonth = format(selectedDate, 'MMMM yyyy', { locale: ptBR });


        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button onClick={() => navigateDate(-30)} style={{ background: IGNIS.graphite, color: IGNIS.textMuted }} className="p-1 rounded hover:text-white transition-colors">‹</button>
                        <button onClick={() => navigateDate(30)} style={{ background: IGNIS.graphite, color: IGNIS.textMuted }} className="p-1 rounded hover:text-white transition-colors">›</button>
                    </div>
                    <div className="text-right">
                        <div style={{ color: IGNIS.white }} className="font-bold capitalize">{currentMonth}</div>
                        <div style={{ color: IGNIS.textMuted }} className="text-xs">{format(selectedDate, 'EEEE', { locale: ptBR })}</div>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {daysOfWeek.map(d => <div key={d} style={{ color: IGNIS.textFaint }} className="text-[10px] font-semibold text-center uppercase">{d}</div>)}
                    {Array.from({ length: 35 }, (_, i) => {
                        const day = addDays(startOfDay(addDays(selectedDate, -selectedDate.getDate() + 1)), i - (new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay()));
                        const isSelected = isSameDay(day, selectedDate);
                        const isCurrentMonth = day.getMonth() === selectedDate.getMonth();

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                style={{
                                    background: isSelected ? IGNIS.red : 'transparent',
                                    color: isSelected ? IGNIS.white : (isCurrentMonth ? IGNIS.textMuted : IGNIS.textFaint),
                                    opacity: isCurrentMonth ? 1 : 0.3
                                }}
                                className="h-8 w-full rounded-lg text-xs font-medium flex flex-col items-center justify-center hover:brightness-125 transition-all"
                            >
                                <span>{format(day, 'd')}</span>
                                {isSelected && <div style={{ background: IGNIS.white }} className="w-1 h-1 rounded-full mt-0.5" />}
                            </button>
                        );
                    })}
                </div>

                {communities.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <div style={{ color: IGNIS.textFaint }} className="text-[10px] font-bold uppercase tracking-wider">Unidade Pastoral</div>
                        <select
                            value={selectedSubTenant}
                            onChange={(e) => setSelectedSubTenant(e.target.value)}
                            style={{ background: IGNIS.bgCard, border: `1px solid ${IGNIS.border}`, color: IGNIS.white }}
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none focus:border-[#D1A84A]"
                        >
                            {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <div style={{ color: IGNIS.textFaint }} className="text-[10px] font-bold uppercase">Resumo</div>
                    <div className="grid gap-2">
                        <div style={{ background: IGNIS.graphite, border: `1px solid ${IGNIS.border}` }} className="px-3 py-2 rounded-xl flex justify-between items-center text-xs">
                            <span style={{ color: IGNIS.textMuted }}>Agendamentos hoje</span>
                            <span style={{ color: IGNIS.gold }} className="font-bold">{appointments.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ background: IGNIS.bgMain, borderRadius: '24px' }} className="flex flex-col overflow-hidden h-[800px] border border-[#382E22]">
            <div style={{ background: `linear-gradient(90deg, ${IGNIS.red}, ${IGNIS.gold}, ${IGNIS.green})`, height: "3px" }} />

            <header style={{ background: IGNIS.bgCard, borderBottom: `1px solid ${IGNIS.border}` }} className="px-6 py-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span style={{ color: IGNIS.red }} className="text-xl">🔥</span>
                        <span style={{ color: IGNIS.white }} className="text-xl font-bold tracking-tight sora">IGNIS</span>
                        <span style={{ color: IGNIS.textMuted }} className="text-sm">· Agenda Paroquial</span>
                    </div>
                    <span style={{ color: IGNIS.textMuted }} className="text-[10px] uppercase font-medium mt-0.5">
                        {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[#151210] rounded-xl border border-[#382E22] overflow-hidden">
                        <button onClick={() => navigateDate(-1)} className="p-2 hover:text-white text-[#897560]"><ChevronLeft size={18} /></button>
                        <button onClick={() => setSelectedDate(new Date())} className="px-3 text-xs font-bold text-[#D1A84A] hover:brightness-125 border-x border-[#382E22]">HOJE</button>
                        <button onClick={() => navigateDate(1)} className="p-2 hover:text-white text-[#897560]"><ChevronRight size={18} /></button>
                    </div>
                    <button
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        style={{ border: `1px solid ${isCalendarOpen ? IGNIS.gold : IGNIS.border}`, color: isCalendarOpen ? IGNIS.gold : IGNIS.textMuted }}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        {isCalendarOpen ? 'Ocultar Calendário' : 'Ver Calendário'}
                    </button>
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        style={{ background: IGNIS.red, color: IGNIS.white }}
                        className="px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-900/20 hover:scale-105 transition-all"
                    >
                        + Novo Agendamento
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {isCalendarOpen && (
                    <aside style={{ width: '288px', background: IGNIS.bgSidebar, borderRight: `1px solid ${IGNIS.border}` }} className="flex-shrink-0 overflow-y-auto px-6 py-6 custom-scrollbar">
                        <ExpandedCalendar />
                    </aside>
                )}

                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 bg-[rgba(0,0,0,0.2)] flex items-center justify-between">
                        <div style={{ background: IGNIS.bgCard, border: `1px solid ${IGNIS.border}` }} className="rounded-2xl px-6 py-2.5 flex items-center gap-6">
                            <span style={{ color: IGNIS.textFaint }} className="text-[10px] font-bold uppercase tracking-widest">Legenda:</span>
                            <div className="flex gap-4 overflow-x-auto no-scrollbar">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <div key={key} className="flex items-center gap-2 whitespace-nowrap">
                                        <div style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full" />
                                        <span style={{ color: IGNIS.textMuted }} className="text-[10px] font-medium">{cfg.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar px-4 pb-4">
                        <div style={{ minWidth: '800px', borderColor: IGNIS.border }} className="rounded-2xl overflow-hidden border">
                            <table className="w-full border-collapse">
                                <thead style={{ background: IGNIS.bgCard, position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr style={{ borderBottom: `1px solid ${IGNIS.borderMid}` }}>
                                        <th style={{ width: '80px', color: IGNIS.textFaint }} className="px-4 py-4 text-[10px] font-bold uppercase text-left">
                                            <div className="flex items-center gap-2"><Clock size={12} /><span>Horário</span></div>
                                        </th>
                                        {RESOURCES.map(res => (
                                            <th key={res.id} style={{ borderLeft: `1px solid ${IGNIS.border}`, color: IGNIS.white }} className="px-4 py-4 text-xs font-semibold text-left">
                                                <div className="flex items-center gap-2"><span>{res.icon}</span> {res.name}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((time) => {
                                        const isFullHour = time.endsWith(":00");
                                        return (
                                            <tr key={time} style={{ background: isFullHour ? "rgba(42,30,18,0.5)" : "rgba(26,20,16,0.4)", borderBottom: `1px solid ${IGNIS.border}` }} className="hover:bg-[rgba(209,168,74,0.04)] transition-colors">
                                                <td className="px-4 py-3 text-center">
                                                    <span style={{ color: isFullHour ? IGNIS.textMuted : IGNIS.textFaint }} className="text-xs font-mono font-medium">{time}</span>
                                                </td>
                                                {RESOURCES.map(res => {
                                                    const app = getAppointmentForSlot(time, res.id);
                                                    return (
                                                        <td key={res.id} style={{ borderLeft: `1px solid ${IGNIS.border}`, width: '23%' }} className="px-1.5 py-1.5 h-[64px]">
                                                            {app ? <AppointmentCard appt={app} /> : <AvailableSlot time={time} resourceId={res.id} />}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            <AppointmentWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={fetchAppointments}
                tenantId={activeTenant?.id}
            />

            {isModalOpen && activeTenant && selectedSubTenant && (
                <AppointmentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    selectedHour={selectedHour}
                    selectedMinute={selectedMinute}
                    tenantId={activeTenant.id}
                    subTenantId={selectedSubTenant}
                    onSuccess={fetchAppointments}
                    initialData={editingAppointment}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1A1410; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #382E22; border-radius: 3px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .sora { font-family: 'Sora', sans-serif; }
            `}} />
        </div>
    );
};

export default ParishSchedulerGrid;
