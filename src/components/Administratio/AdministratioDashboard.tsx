import React, { useState } from 'react';
import { 
    Wallet, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Landmark, 
    FileText, 
    Plus
} from 'lucide-react';
import { ModuleHeader } from '../ui/ModuleHeader';
import { TransactionsList } from './TransactionsList';
import { TransactionForm } from './TransactionForm';
import './Administratio.css';

export const AdministratioDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'transactions' | 'assets' | 'documents'>('transactions');
    const [showTransactionForm, setShowTransactionForm] = useState<'income' | 'expense' | null>(null);
    const [transactionRefreshToken, setTransactionRefreshToken] = useState(0);

    const handleTransactionSuccess = () => {
        setShowTransactionForm(null);
        setTransactionRefreshToken(prev => prev + 1);
    };

    const headerActions = (
        <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'transactions' && (
                <>
                    <button className="btn-secondary" style={{ color: 'var(--success)' }} onClick={() => setShowTransactionForm('income')}>
                        <ArrowUpCircle size={18} /> Nova Receita
                    </button>
                    <button className="btn-secondary" style={{ color: 'var(--status-remarcado)' }} onClick={() => setShowTransactionForm('expense')}>
                        <ArrowDownCircle size={18} /> Nova Despesa
                    </button>
                </>
            )}
            {activeTab === 'assets' && (
                <button className="btn-primary">
                    <Plus size={18} /> Novo Bem
                </button>
            )}
            {activeTab === 'documents' && (
                <button className="btn-primary">
                    <Plus size={18} /> Novo Documento
                </button>
            )}
        </div>
    );

    return (
        <div className="module-container fade-in administratio-module">
            <ModuleHeader
                title="IGNIS Administratio"
                subtitle="Gestão Financeira, Patrimonial e Documental"
                icon={Wallet}
                actions={headerActions}
            />

            <div className="sub-nav glass" style={{ marginBottom: '24px', padding: '8px', display: 'flex', gap: '6px', borderRadius: '12px', flexWrap: 'wrap' }}>
                <button 
                    className={`btn-secondary ${activeTab === 'transactions' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                    style={{ flex: 1, minWidth: '150px', color: activeTab === 'transactions' ? 'var(--accent-color)' : 'inherit', fontSize: '0.9rem' }}
                >
                    <Wallet size={16} /> Fluxo de Caixa
                </button>
                <button 
                    className={`btn-secondary ${activeTab === 'assets' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('assets')}
                    style={{ flex: 1, minWidth: '150px', color: activeTab === 'assets' ? 'var(--accent-color)' : 'inherit', fontSize: '0.9rem' }}
                >
                    <Landmark size={16} /> Patrimônio
                </button>
                <button 
                    className={`btn-secondary ${activeTab === 'documents' ? 'active-tab' : ''}`}
                    onClick={() => setActiveTab('documents')}
                    style={{ flex: 1, minWidth: '150px', color: activeTab === 'documents' ? 'var(--accent-color)' : 'inherit', fontSize: '0.9rem' }}
                >
                    <FileText size={16} /> Documentos
                </button>
            </div>

            {activeTab === 'transactions' && (
                <TransactionsList 
                    key={transactionRefreshToken} 
                    onNewTransaction={(type) => setShowTransactionForm(type)} 
                />
            )}

            {activeTab === 'assets' && (
                <div className="glass empty-state" style={{ textAlign: 'center', padding: '60px', opacity: 0.7, borderRadius: '16px' }}>
                    <Landmark size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <h3>Inventário Patrimonial Vazio</h3>
                    <p style={{ maxWidth: '400px', margin: '16px auto' }}>Aqui você poderá gerenciar imóveis, veículos, equipamentos e itens litúrgicos pertencentes à paróquia.</p>
                </div>
            )}

            {activeTab === 'documents' && (
                <div className="glass empty-state" style={{ textAlign: 'center', padding: '60px', opacity: 0.7, borderRadius: '16px' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                    <h3>Arquivos e Documentos</h3>
                    <p style={{ maxWidth: '400px', margin: '16px auto' }}>Integração com o Supabase Storage em breve. Guarde atas, decretos, contratos de forma segura e organizada.</p>
                </div>
            )}

            {showTransactionForm && (
                <TransactionForm 
                    type={showTransactionForm} 
                    onClose={() => setShowTransactionForm(null)} 
                    onSuccess={handleTransactionSuccess} 
                />
            )}
        </div>
    );
};
