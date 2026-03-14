import React from 'react';
import {
  Home,
  Calendar,
  ScrollText,
  MapPin,
  Users,
  Heart,
  Wallet,
  Settings,
  Flame,
  FileBarChart,
  Globe,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import './Sidebar.css';

import { useTenant } from '../contexts/TenantContext';
import { useTheme } from '../hooks/useTheme';

const navGroups = [
  {
    title: 'Visão Geral',
    items: [
      { icon: Home, label: 'Início', id: 'home' },
      { icon: Globe, label: 'Mapa Global', id: 'global-map', level: 'super' },
    ],
  },
  {
    title: 'Gestão Paroquial',
    items: [
      { icon: Calendar, label: 'Agenda do Padre', id: 'priest-agenda', level: 'matriz' },
      { icon: Shield, label: 'Estratégia Pastoral', id: 'governance-local', level: 'matriz' },
      { icon: FileBarChart, label: 'Relatórios', id: 'reports' },
    ],
  },
  {
    title: 'Módulos Ignis',
    items: [
      { icon: ScrollText, label: 'Sacramenta', id: 'sacramenta' },
      { icon: MapPin, label: 'Missio', id: 'missio' },
      { icon: Users, label: 'Pastoralis', id: 'pastoralis' },
      { icon: Heart, label: 'Communio', id: 'communio' },
      { icon: Wallet, label: 'Administratio', id: 'administratio' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { icon: Users, label: 'Gestão de Usuários', id: 'user-management', level: 'super' },
      { icon: Settings, label: 'Configurações', id: 'settings', level: 'super' },
    ],
  },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTenantChange: (tenantId: string) => void;
  onProfileClick: () => void;
  userLevel?: string;
  isOpen?: boolean;
  currentUser?: {
    avatar_url?: string;
    full_name?: string;
  };
  roleLabel?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userLevel,
  activeTab,
  onTabChange,
  onProfileClick,
  isOpen,
  currentUser,
  roleLabel,
}) => {
  const { activeTenant } = useTenant();
  const { theme, toggleTheme } = useTheme();

  // Filter groups and items based on permissions
  const filteredGroups = navGroups.map(group => {
    const validItems = group.items.filter(item => {
      // 1. Level-based filtering
      // Super admin sees everything. Matriz admin sees matriz items and community items, etc.
      if (item.level) {
        if (userLevel === 'super') return true; // Super admin bypassed
        if (item.level === 'matriz' && (userLevel !== 'matriz')) return false;
        if (item.level === 'comunidade' && userLevel !== 'comunidade') return false;
        if (item.level === 'super' && userLevel !== 'super') return false;
      }
      
      // 2. Module-based filtering (for modules)
      if (group.title === 'Módulos Ignis') {
         // Super admin sees all modules for management purposes
         if (userLevel === 'super') return true;
         
         if (activeTenant?.active_modules) {
            // Only show if explicitly active for this tenant
            return activeTenant.active_modules.includes(item.id);
         }
         // If no modules defined, show all defaults
         return true;
      }
      return true;
    });

    return { ...group, items: validItems };
  }).filter(group => group.items.length > 0);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <Flame size={20} fill="currentColor" />
        </div>
        <span className="logo-text">IGNIS</span>
      </div>

      <nav className="nav-section">
        {filteredGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="nav-group">
            <h4 className="nav-group-title">{group.title}</h4>
            <ul className="nav-list">
              {group.items.map((item) => (
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
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-list" style={{ marginBottom: '16px' }}>
          <button
            className="nav-item theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>

        <div className="user-profile" onClick={onProfileClick} style={{ cursor: 'pointer' }}>
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt={currentUser?.full_name || 'Usuário'} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div className="avatar">{currentUser?.full_name?.[0]?.toUpperCase() || 'U'}</div>
          )}
          <div className="user-info">
            <span className="user-name">{currentUser?.full_name || 'Usuário'}</span>
            <span className="user-role">{roleLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
