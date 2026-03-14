import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

type Level = 'super' | 'matriz' | 'comunidade' | 'fiel';

interface BreadcrumbItem {
    label: string;
    icon?: React.ReactNode;
    navigateTo?: { level: Level; tab: string };
}

interface BreadcrumbsProps {
    level: Level;
    onNavigate?: (level: Level, tab: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ level, onNavigate }) => {
    const getItems = (): BreadcrumbItem[] => {
        const base: BreadcrumbItem[] = [
            { label: 'IGNIS', icon: <Home size={14} />, navigateTo: { level: 'super', tab: 'home' } }
        ];

        switch (level) {
            case 'super':
                return [...base, { label: 'Administração', navigateTo: { level: 'super', tab: 'home' } }, { label: 'Visão Global' }];
            case 'matriz':
                return [...base, { label: 'Nível 1', navigateTo: { level: 'matriz', tab: 'home' } }, { label: 'Paróquia', navigateTo: { level: 'matriz', tab: 'home' } }, { label: 'Gestão Cenáculo' }];
            case 'comunidade':
                return [...base, { label: 'Nível 2', navigateTo: { level: 'comunidade', tab: 'home' } }, { label: 'Comunidade', navigateTo: { level: 'comunidade', tab: 'home' } }, { label: 'Missão Local' }];
            case 'fiel':
                return [...base, { label: 'Nível 3', navigateTo: { level: 'fiel', tab: 'home' } }, { label: 'O Fiel', navigateTo: { level: 'fiel', tab: 'home' } }, { label: 'Minha Chama' }];
            default:
                return base;
        }
    };

    const items = getItems();

    return (
        <nav className="breadcrumbs">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isClickable = !isLast && item.navigateTo && onNavigate;

                return (
                    <React.Fragment key={index}>
                        <div
                            className={`breadcrumb-item ${isClickable ? 'breadcrumb-clickable' : ''}`}
                            onClick={isClickable ? () => onNavigate!(item.navigateTo!.level, item.navigateTo!.tab) : undefined}
                            role={isClickable ? 'link' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                            onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onNavigate!(item.navigateTo!.level, item.navigateTo!.tab); } : undefined}
                        >
                            {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                            <span className="breadcrumb-label">{item.label}</span>
                        </div>
                        {!isLast && (
                            <ChevronRight size={12} className="breadcrumb-separator" />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
