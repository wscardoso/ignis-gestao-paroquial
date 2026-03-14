import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Banknote, Calendar } from 'lucide-react';
import { ignisApi } from '../../services/api';
import type { FinancialTransaction } from '../../services/api';
import { useTenant } from '../../contexts/TenantContext';

interface TransactionsListProps {
    onNewTransaction: (type: 'income' | 'expense') => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({ onNewTransaction }) => {
    const { activeTenant } = useTenant();
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    useEffect(() => {
        if (activeTenant?.id) {
            fetchTransactions();
        }
    }, [activeTenant?.id]);

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const data = await ignisApi.administratio.getTransactions(activeTenant!.id);
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="admin-content grid-layout">
            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', gridColumn: '1 / -1' }}>
                <div className="stat-card glass hover-effect" style={{ borderLeft: `4px solid ${balance >= 0 ? 'var(--success)' : 'var(--status-remarcado)'}` }}>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '8px' }}>Saldo Atual</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                    </h3>
                </div>
                <div className="stat-card glass hover-effect" style={{ borderLeft: '4px solid var(--success)' }}>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '8px' }}>Receitas</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                    </h3>
                </div>
                <div className="stat-card glass hover-effect" style={{ borderLeft: '4px solid var(--status-remarcado)' }}>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '8px' }}>Despesas</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--status-remarcado)' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                    </h3>
                </div>
            </div>

            <div className="glass" style={{ gridColumn: '1/-1', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wallet className="text-accent" /> Livro Caixa
                    </h3>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                            className="input-select" 
                            style={{ width: '150px' }}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                        >
                            <option value="all">Todas as Movimentações</option>
                            <option value="income">Apenas Receitas</option>
                            <option value="expense">Apenas Despesas</option>
                        </select>
                    </div>
                </div>

                <div className="transactions-list">
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Carregando dados financeiros...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', opacity: 0.5 }}>
                            <Banknote size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                            <p>Nenhuma transação encontrada no período.</p>
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                <button className="btn-secondary" style={{ color: 'var(--success)' }} onClick={() => onNewTransaction('income')}>
                                    <ArrowUpCircle size={16} /> Nova Receita
                                </button>
                                <button className="btn-secondary" style={{ color: 'var(--status-remarcado)' }} onClick={() => onNewTransaction('expense')}>
                                    <ArrowDownCircle size={16} /> Nova Despesa
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredTransactions.map(tx => (
                                <div key={tx.id} className="glass hover-effect" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', borderLeft: `4px solid ${tx.type === 'income' ? 'var(--success)' : 'var(--status-remarcado)'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: tx.type === 'income' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: tx.type === 'income' ? 'var(--success)' : 'var(--status-remarcado)' }}>
                                            {tx.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
                                                {tx.description || tx.categoryName || (tx.type === 'income' ? 'Receita Diversa' : 'Despesa Diversa')}
                                            </h4>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(tx.transactionDate).toLocaleDateString()}</span>
                                                {tx.personName && <span>Fiel: {tx.personName}</span>}
                                                <span style={{ textTransform: 'capitalize' }}>Banco: {tx.paymentMethod}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'var(--status-remarcado)' }}>
                                            {tx.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                                        </h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
