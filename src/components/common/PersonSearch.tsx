import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Loader2, X } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { Person } from '../../services/api';

interface PersonSearchProps {
    tenantId: string;
    label: string;
    placeholder?: string;
    onSelect: (person: Person | null) => void;
    initialValue?: string;
}

export const PersonSearch: React.FC<PersonSearchProps> = ({
    tenantId, label, placeholder = 'Buscar por nome...', onSelect, initialValue = ''
}) => {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<Person[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query || query.length < 2 || selectedPerson) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const data = await ignisApi.people.search(tenantId, query);
                setResults(data);
                setIsOpen(true);
            } catch (error) {
                console.error('Error searching people:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, tenantId, selectedPerson]);

    const handleSelect = (person: Person) => {
        setSelectedPerson(person);
        setQuery(person.name);
        setIsOpen(false);
        onSelect(person);
    };

    const clearSelection = () => {
        setSelectedPerson(null);
        setQuery('');
        onSelect(null);
    };

    return (
        <div className="person-search-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                {label}
            </label>
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (selectedPerson) setSelectedPerson(null);
                    }}
                    placeholder={placeholder}
                    className="input-text"
                    style={{
                        paddingLeft: '40px',
                        paddingRight: selectedPerson ? '40px' : '10px',
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        height: '40px',
                        color: selectedPerson ? 'var(--accent-color)' : 'inherit',
                        fontWeight: selectedPerson ? '600' : 'normal'
                    }}
                />
                {selectedPerson && (
                    <button
                        type="button"
                        onClick={clearSelection}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="search-dropdown glass" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    marginTop: '5px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                    {results.map(person => (
                        <div
                            key={person.id}
                            className="search-result-item"
                            onClick={() => handleSelect(person)}
                            style={{
                                padding: '10px 15px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <User size={14} className="text-accent" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{person.name}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{person.cpf ? `CPF: ${person.cpf}` : 'Sem CPF'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
