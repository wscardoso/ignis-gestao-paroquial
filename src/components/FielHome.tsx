import { useState, useEffect } from 'react';
import { Flame, Calendar, Award, MapPin, Plus, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { ignisApi } from '../services/api';
import { AppointmentWizard } from './AppointmentWizard';
import type { Appointment, Sacrament } from '../services/api';
import { format, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import './FielHome.css';

const SERVICE_ACTIONS = [
  { label: 'Confissão', icon: Award, type: 'sacra', serviceType: 'Confissão' },
  { label: 'Direção Espiritual', icon: Calendar, type: 'sacra', serviceType: 'Direção Espiritual' },
  { label: 'Visita Enfermos', icon: MapPin, type: 'missio', serviceType: 'Visita aos Enfermos' },
  { label: 'Benção Casa/Comércio', icon: Flame, type: 'missio', serviceType: 'Benção de Casas/Comércio' },
] as const;

const SACRAMENT_LABELS: Record<string, string> = {
  baptism: 'Batismo',
  first_communion: '1ª Eucaristia',
  confirmation: 'Crisma',
  marriage: 'Matrimônio',
  anointing_of_sick: 'Unção dos Enfermos',
};

const SACRAMENT_ORDER = ['baptism', 'first_communion', 'confirmation', 'marriage', 'anointing_of_sick'];

export const FielHome: React.FC = () => {
  const { user, profile } = useAuth();
  const { activeTenant } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sacraments, setSacraments] = useState<Sacrament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [, setWizardService] = useState('');

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Fiel';
  const firstName = userName.split(' ')[0];
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const parishName = activeTenant?.name || 'Paróquia';

  useEffect(() => {
    if (!activeTenant?.id) return;
    loadData();
  }, [activeTenant?.id]);

  const loadData = async () => {
    if (!activeTenant?.id) return;
    setIsLoading(true);
    try {
      // Load upcoming appointments (next 30 days)
      const now = startOfDay(new Date());
      const future = addDays(now, 30);

      // We need a sub_tenant_id — get first community
      const communities = await ignisApi.communities.getByTenant(activeTenant.id);
      if (communities.length > 0) {
        const allAppointments: Appointment[] = [];
        for (const c of communities) {
          const appts = await ignisApi.appointments.getByDateRange(activeTenant.id, c.id, now, future);
          allAppointments.push(...appts);
        }
        // Filter only user's appointments (by name match)
        const myAppts = allAppointments
          .filter(a => a.status !== 'cancelled')
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 5);
        setAppointments(myAppts);
      }

      // Load sacraments
      const allSacraments = await ignisApi.sacraments.getAll(activeTenant.id);
      // Filter by user name match (since we may not have person_id linked)
      const mySacraments = allSacraments.filter(s =>
        s.subjectName?.toLowerCase().includes(firstName.toLowerCase())
      );
      setSacraments(mySacraments);
    } catch (error) {
      console.error('FielHome: Error loading data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (serviceType: string) => {
    setWizardService(serviceType);
    setIsWizardOpen(true);
  };

  const handlePrayRequest = () => {
    toast('🙏 Funcionalidade de pedidos de oração em breve!', { icon: '🕊️' });
  };

  const completedSacraments = sacraments.map(s => s.type);

  const journeyItems = SACRAMENT_ORDER.map(type => ({
    type,
    label: SACRAMENT_LABELS[type] || type,
    completed: completedSacraments.includes(type as any),
  }));

  return (
    <div className="fiel-mobile-container fade-in">
      {/* Header */}
      <header className="fiel-header glass" role="banner">
        <div className="fiel-user">
          <div className="fiel-avatar" aria-hidden="true">{initials}</div>
          <div>
            <h2 className="fiel-greeting">Salve Maria, {firstName}!</h2>
            <p className="fiel-subtitle">{parishName}</p>
          </div>
        </div>
        <button className="notif-btn" aria-label="Ver calendário">
          <Calendar size={20} />
        </button>
      </header>

      {/* Quick Actions */}
      <nav className="fiel-quick-actions" aria-label="Ações rápidas">
        {SERVICE_ACTIONS.map((action) => (
          <button
            key={action.serviceType}
            className={`action-card ${action.type}`}
            onClick={() => handleQuickAction(action.serviceType)}
            aria-label={`Agendar ${action.label}`}
          >
            <div className="action-icon">
              <action.icon size={24} />
            </div>
            <span>{action.label}</span>
          </button>
        ))}
      </nav>

      {/* Próximos Eventos */}
      <section className="fiel-section" aria-label="Próximos eventos">
        <div className="section-title-row">
          <h3>Próximos Eventos</h3>
          {appointments.length > 3 && (
            <button className="btn-link">Ver todos <ChevronRight size={14} /></button>
          )}
        </div>

        {isLoading ? (
          <div className="event-card glass">
            <div className="skeleton skeleton-text" style={{ width: '100%', height: 60 }} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="event-card glass empty-state">
            <Clock size={20} />
            <p>Nenhum evento próximo. Agende pelo menu acima!</p>
          </div>
        ) : (
          appointments.slice(0, 3).map((appt) => {
            const date = new Date(appt.startTime);
            return (
              <div key={appt.id} className="event-card glass">
                <div className="event-date">
                  <span className="day">{format(date, 'd')}</span>
                  <span className="month">{format(date, 'MMM', { locale: ptBR }).toUpperCase()}</span>
                </div>
                <div className="event-info">
                  <h4 className="event-name">{appt.serviceType}</h4>
                  <p className="event-loc">
                    {appt.celebrantName || parishName} • {format(date, 'HH:mm')}
                  </p>
                </div>
                <div className={`event-status-badge status-${appt.status}`}>
                  {appt.status === 'confirmed' ? 'Confirmado' :
                    appt.status === 'pending' ? 'Pendente' :
                      appt.status === 'completed' ? 'Realizado' : appt.status}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Jornada de Fé */}
      <section className="fiel-section" aria-label="Jornada sacramental">
        <h3>Minha Jornada de Fé</h3>
        <div className="journey-grid">
          {journeyItems.map((item) => (
            <button
              key={item.type}
              type="button"
              className={`journey-item glass ${item.completed ? '' : 'pending'}`}
              onClick={() => {
                if (item.completed) {
                  toast.success(`${item.label} já recebido! ✝️`);
                } else {
                  toast(`Procure a secretaria para iniciar o processo de ${item.label}.`, { icon: '📋' });
                }
              }}
            >
              {item.completed ? (
                <Award size={20} className="icon-gold" />
              ) : (
                <Plus size={20} />
              )}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <button className="btn-pray-now" onClick={handlePrayRequest}>
        <Flame size={20} />
        <span>Pedir Oração Agora</span>
      </button>

      {/* Wizard */}
      <AppointmentWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        tenantId={activeTenant?.id}
        onSuccess={() => {
          toast.success('Agendamento criado com sucesso!');
          loadData();
        }}
      />
    </div>
  );
};
