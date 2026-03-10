import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

interface BreadcrumbsProps {
    level: 'super' | 'matriz' | 'comunidade' | 'fiel';
}

interface BreadcrumbItem {
    label: string;
    icon?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ level }) => {
    const getItems = (): BreadcrumbItem[] => {
        const base: BreadcrumbItem[] = [{ label: 'IGNIS', icon: <Home size={14} /> }];

        switch (level) {
            case 'super':
                return [...base, { label: 'Administração' }, { label: 'Visão Global' }];
            case 'matriz':
                return [...base, { label: 'Nível 1' }, { label: 'Paróquia' }, { label: 'Gestão Cenáculo' }];
            case 'comunidade':
                return [...base, { label: 'Nível 2' }, { label: 'Comunidade' }, { label: 'Missão Local' }];
            case 'fiel':
                return [...base, { label: 'Nível 3' }, { label: 'O Fiel' }, { label: 'Minha Chama' }];
            default:
                return base;
        }
    };

    const items = getItems();

    return (
        <nav className="breadcrumbs">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <div className="breadcrumb-item">
                        {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                        <span className="breadcrumb-label">{item.label}</span>
                    </div>
                    {index < items.length - 1 && (
                        <ChevronRight size={12} className="breadcrumb-separator" />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
