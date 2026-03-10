import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { ignisApi } from '../services/api';
import type { Appointment } from '../services/api';
import './MonthCalendar.css';

interface MonthCalendarProps {
    tenantId: string;
    subTenantId: string;
    onDayClick: (date: Date) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
    tenantId, subTenantId, onDayClick
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchMonthAppointments();
    }, [tenantId, subTenantId, currentMonth]);

    const fetchMonthAppointments = async () => {
        if (!tenantId || !subTenantId) return;
        setIsLoading(true);
        try {
            const start = startOfMonth(currentMonth);
            const end = endOfMonth(currentMonth);
            const data = await ignisApi.appointments.getByDateRange(tenantId, subTenantId, start, end);
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching month appointments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => (
        <div className="calendar-header">
            <div className="current-month">
                <CalendarIcon size={20} className="text-accent" />
                <h2>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
            </div>
            <div className="calendar-nav">
                <button className="btn-icon glass" onClick={prevMonth}><ChevronLeft size={20} /></button>
                <button className="btn-secondary glass" onClick={() => setCurrentMonth(new Date())}>Hoje</button>
                <button className="btn-icon glass" onClick={nextMonth}><ChevronRight size={20} /></button>
            </div>
        </div>
    );

    const renderDays = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
            <div className="calendar-week-days">
                {days.map(day => <div key={day} className="week-day-label">{day}</div>)}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="calendar-grid">
                {calendarDays.map(day => {
                    const dayAppointments = appointments.filter(app => isSameDay(new Date(app.startTime), day));
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toISOString()}
                            className={`calendar-cell glass ${!isCurrentMonth ? 'other-month' : ''} ${isToday(day) ? 'is-today' : ''} hover-effect`}
                            onClick={() => onDayClick(day)}
                        >
                            <span className="day-number">{format(day, 'd')}</span>

                            <div className="cell-content">
                                {dayAppointments.length > 0 && (
                                    <div className="appointment-indicators">
                                        {dayAppointments.slice(0, 3).map(app => (
                                            <div
                                                key={app.id}
                                                className={`appointment-dot ${app.status}`}
                                                title={`${app.clientName} - ${app.serviceType}`}
                                            >
                                                <span className="dot-label">{app.serviceType.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <span className="more-count">+{dayAppointments.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="month-calendar-container">
            {isLoading && (
                <div className="calendar-loading">
                    <Loader2 className="animate-spin text-accent" size={32} />
                </div>
            )}
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
};
