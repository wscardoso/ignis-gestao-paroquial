import React from 'react';
import { Flame, Calendar, Award, MapPin, Plus } from 'lucide-react';
import './FielHome.css';

export const FielHome: React.FC = () => {
    return (
        <div className="fiel-mobile-container">
            <header className="fiel-header glass">
                <div className="fiel-user">
                    <div className="fiel-avatar">WC</div>
                    <div>
                        <h2 className="fiel-greeting">Salve Maria, Weyner!</h2>
                        <p className="fiel-subtitle">Paróquia Santo Estevão</p>
                    </div>
                </div>
                <button className="notif-btn">
                    <Calendar size={20} />
                </button>
            </header>

            <div className="fiel-quick-actions">
                <button className="action-card sacra">
                    <div className="action-icon"><Award size={24} /></div>
                    <span>Confissão</span>
                </button>
                <button className="action-card sacra">
                    <div className="action-icon"><Calendar size={24} /></div>
                    <span>Direção Espiritual</span>
                </button>
                <button className="action-card missio">
                    <div className="action-icon"><MapPin size={24} /></div>
                    <span>Visita Enfermos</span>
                </button>
                <button className="action-card missio">
                    <div className="action-icon"><Flame size={24} /></div>
                    <span>Benção Casa/Comércio</span>
                </button>
            </div>

            <section className="fiel-section">
                <div className="section-title-row">
                    <h3>Próximos Eventos</h3>
                    <button className="btn-link">Ver todos</button>
                </div>
                <div className="event-card glass">
                    <div className="event-date">
                        <span className="day">15</span>
                        <span className="month">FEV</span>
                    </div>
                    <div className="event-info">
                        <h4 className="event-name">Missa do Crisma</h4>
                        <p className="event-loc">Catedral da Sé • 19:00</p>
                    </div>
                </div>
            </section>

            <section className="fiel-section">
                <h3>Minha Jornada de Fé</h3>
                <div className="journey-grid">
                    <div className="journey-item glass">
                        <Award size={20} className="icon-gold" />
                        <span>Batismo</span>
                    </div>
                    <div className="journey-item glass">
                        <Award size={20} className="icon-gold" />
                        <span>1ª Eucaristia</span>
                    </div>
                    <div className="journey-item glass pending">
                        <Plus size={20} />
                        <span>Crisma</span>
                    </div>
                </div>
            </section>

            <button className="btn-pray-now">
                <Flame size={20} />
                <span>Pedir Oração Agora</span>
            </button>
        </div>
    );
};
