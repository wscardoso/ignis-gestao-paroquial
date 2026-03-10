import React from 'react';
import {
  Home,
  ScrollText,
  MapPin,
  Users,
  Heart,
  Wallet,
  Settings,
  Flame,
  FileBarChart,
  Globe
} from 'lucide-react';
import './Sidebar.css';

import { useTenant } from '../contexts/TenantContext';

const navItems = [
  { icon: Home, label: 'Início', id: 'home' },
  { icon: ScrollText, label: 'Sacramenta', id: 'sacramenta' },
  { icon: MapPin, label: 'Missio', id: 'missio' },
  { icon: Users, label: 'Pastoralis', id: 'pastoralis' },
  { icon: Heart, label: 'Communio', id: 'communio' },
  { icon: Wallet, label: 'Administratio', id: 'administratio' },
  { icon: FileBarChart, label: 'Relatórios', id: 'reports' },
  { icon: Globe, label: 'Mapa Global', id: 'global-map' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userLevel?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, userLevel }) => {
  const { activeTenant } = useTenant();

  // If active_modules is present, filter. Otherwise show all (default for MVP)
  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'home') return true; // Always show home
    if (item.id === 'global-map') return userLevel === 'super';
    if (!activeTenant?.active_modules) return true;
    return activeTenant.active_modules.includes(item.id);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Flame size={20} fill="currentColor" />
        </div>
        <span className="logo-text">IGNIS</span>
      </div>

      <nav className="nav-section">
        <ul className="nav-list">
          {filteredNavItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onTabChange(item.id);
                }}
              >
                <item.icon />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="nav-list" style={{ marginBottom: '16px' }}>
          <a href="#settings" className="nav-item">
            <Settings />
            <span>Configurações</span>
          </a>
        </div>

        <div className="user-profile">
          <div className="avatar">W</div>
          <div className="user-info">
            <span className="user-name">Weyner Cardozo</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
