import React, { useState, useEffect } from 'react';
import { X, Save, Search, User, Tag, Calendar, Banknote } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { FinancialCategory } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';

interface TransactionFormProps {
    type: 'income' | 'expense';
    onClose: () => void;
    onSuccess: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ type, onClose, onSuccess }) => {
    const { activeTenant } = useTenant();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other'>('pix');
    const [status, setStatus] = useState<'pending' | 'completed'>('completed');
    
    // Simplification for MVP: We just fetch categories but don't force a complex tree
    const [categories, setCategories] = useState<FinancialCategory[]>([]);
    const [categoryId, setCategoryId] = useState('');

    // Field for optional person
    const [isSearchingPerson, setIsSearchingPerson] = useState(false);
    const [personSearchQuery, setPersonSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<{ id: string, name: string } | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (activeTenant?.id) {
            ignisApi.administratio.getCategories(activeTenant.id, type)
                .then(data => {
                    setCategories(data);
                    if (data.length > 0) setCategoryId(data[0].id);
                })
                .catch(err => console.error("Falha ao carregar categorias", err));
        }
    }, [activeTenant?.id, type]);

    const handleSearchPerson = async () => {
        if (!personSearchQuery.trim() || !activeTenant?.id) return;
        setIsSearchingPerson(true);
        try {
            // Reusing common get people API or similar. Assuming simple exact fetch or filtered fetch exists in real app.
            // For MVP, we will use getAll and filter on client side if necessary, but ideally we'd have a searchEndpoint.
            const allPeople = await ignisApi.people.getAll(activeTenant.id);
            const filtered = allPeople.filter(p => p.name.toLowerCase().includes(personSearchQuery.toLowerCase()) || p.cpf?.includes(personSearchQuery));
            setSearchResults(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearchingPerson(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const numAmount = parseFloat(amount.replace(',', '.'));
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('O valor deve ser maior que zero.');
            return;
        }

        if (!activeTenant?.id) return;

        setIsSubmitting(true);
        try {
            await ignisApi.administratio.createTransaction({
                tenantId: activeTenant.id,
                type,
                amount: numAmount,
                description: description || undefined,
                categoryId: categoryId || undefined,
                personId: selectedPerson?.id || undefined,
                transactionDate,
                paymentMethod,
                status
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar transação');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass" style={{ maxWidth: '600px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: type === 'income' ? 'var(--success)' : 'var(--status-remarcado)' }}>
                        {type === 'income' ? 'Nova Receita' : 'Nova Despesa'}
                    </h2>
                    <button className="btn-icon" onClick={onClose}><X size={24} /></button>
                </div>

                {error && <div className="error-message p-3 mb-4 rounded-lg bg-red-900/50 text-red-200 border border-red-700/50">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Valor */}
                        <div className="form-group">
                            <label className="form-label">Valor (R$)*</label>
                            <div className="input-with-icon">
                                <Banknote size={16} className="input-icon" style={{ left: '12px' }}/>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="input-field" 
                                    style={{ paddingLeft: '36px', fontSize: '1.2rem', fontWeight: 700 }}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0,00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Data */}
                        <div className="form-group">
                            <label className="form-label">Data*</label>
                            <div className="input-with-icon">
                                <Calendar size={16} className="input-icon" style={{ left: '12px' }}/>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    style={{ paddingLeft: '36px' }}
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="form-group">
                        <label className="form-label">Descrição (Opcional)</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={type === 'income' ? 'Ex: Dízimo de João, Doação Anônima' : 'Ex: Conta de Luz, Material Limpeza'}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Categoria */}
                        <div className="form-group">
                            <label className="form-label">Categoria Financeira</label>
                            <div className="input-with-icon">
                                <Tag size={16} className="input-icon" style={{ left: '12px' }}/>
                                <select 
                                    className="input-select" 
                                    style={{ paddingLeft: '36px', width: '100%' }}
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                >
                                    <option value="">Diversos</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Forma de Pagamento */}
                        <div className="form-group">
                            <label className="form-label">Forma de Pagamento*</label>
                            <select 
                                className="input-select" 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                required
                            >
                                <option value="pix">PIX</option>
                                <option value="cash">Dinheiro em Espécie</option>
                                <option value="debit_card">Cartão de Débito</option>
                                <option value="credit_card">Cartão de Crédito</option>
                                <option value="bank_transfer">Transferência / TED</option>
                                <option value="check">Cheque</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                    </div>

                    {/* Vínculo com Fiel (Opcional) */}
                    <div className="form-group" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} /> Vincular com Fiel (Dízimo/Doação)?
                        </label>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '12px' }}>A busca é opcional. Se for um dizimista registrado, procure aqui para ligar o pagamento à ficha dele.</p>
                        
                        {selectedPerson ? (
                            <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 600 }}>{selectedPerson.name}</span>
                                </div>
                                <button type="button" className="btn-secondary" onClick={() => setSelectedPerson(null)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Remover</button>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="text" 
                                        className="input-field" 
                                        placeholder="Nome ou CPF..."
                                        value={personSearchQuery}
                                        onChange={(e) => setPersonSearchQuery(e.target.value)}
                                    />
                                    <button type="button" className="btn-secondary" onClick={handleSearchPerson} disabled={isSearchingPerson}>
                                        <Search size={16} /> Buscar
                                    </button>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="glass" style={{ marginTop: '8px', maxHeight: '150px', overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {searchResults.map(p => (
                                            <div 
                                                key={p.id} 
                                                style={{ padding: '8px', cursor: 'pointer', borderRadius: '8px' }} 
                                                className="hover-effect"
                                                onClick={() => {
                                                    setSelectedPerson({ id: p.id, name: p.name });
                                                    setSearchResults([]);
                                                }}
                                            >
                                                {p.name} {p.cpf && <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>({p.cpf})</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="form-group">
                        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                checked={status === 'completed'}
                                onChange={(e) => setStatus(e.target.checked ? 'completed' : 'pending')}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
                            />
                            Esta transação já foi paga/recebida?
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : <><Save size={18} /> Lançar {type === 'income' ? 'Receita' : 'Despesa'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
