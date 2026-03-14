import React from 'react';
import './ModuleHeader.css';

interface ModuleHeaderProps {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    actions?: React.ReactNode;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
    title,
    subtitle,
    icon: Icon,
    actions
}) => {
    return (
        <header className="module-header glass">
            <div className="module-icon">
                <Icon size={24} />
            </div>
            <div className="module-titles">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            {actions && (
                <div className="module-actions">
                    {actions}
                </div>
            )}
        </header>
    );
};
