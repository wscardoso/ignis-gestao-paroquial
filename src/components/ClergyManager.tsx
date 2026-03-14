import React, { useState, useEffect, useMemo } from 'react';
import { User, Plus, Search, Edit2, Trash2, X, Loader2, Filter } from 'lucide-react';
import { ignisApi } from '../services/api';
import type { StaffMember } from '../services/api';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';
import './ClergyManager.css';

const ROLE_OPTIONS = ['Padre', 'Diácono', 'Catequista', 'Secretária', 'Ministro', 'Sacristão', 'Outro'];
const STATUS_OPTIONS: { value: StaffMember['status']; label: string }[] = [
    { value: 'available', label: 'Disponível' },
    { value: 'busy', label: 'Ocupado' },
    { value: 'off', label: 'Folga' },
    { value: 'inactive', label: 'Inativo' },
];

const statusLabel = (s: string) => STATUS_OPTIONS.find(o => o.value === s)?.label || s;

const emptyForm = (): Omit<StaffMember, 'id' | 'createdAt'> => ({
    tenantId: '',
    name: '',
    role: 'Padre',
    email: '',
    phone: '',
    status: 'available',
    joinedAt: '',
    notes: '',
});

export const ClergyManager: React.FC = () => {
    const { activeTenant } = useTenant();
    const tenantId = activeTenant?.id || '';

    const [members, setMembers] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [isSaving, setIsSaving] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMembers = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const data = await ignisApi.staff.getByTenant(tenantId);
            setMembers(data);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar equipe');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, [tenantId]);

    const filtered = useMemo(() => {
        return members.filter(m => {
            const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
            const matchRole = !roleFilter || m.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [members, search, roleFilter]);

    const openCreate = () => {
        setEditingMember(null);
        setForm({ ...emptyForm(), tenantId });
        setShowModal(true);
    };

    const openEdit = (member: StaffMember) => {
        setEditingMember(member);
        setForm({
            tenantId: member.tenantId,
            name: member.name,
            role: member.role,
            email: member.email || '',
            phone: member.phone || '',
            status: member.status,
            joinedAt: member.joinedAt || '',
            notes: member.notes || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }
        setIsSaving(true);
        try {
            if (editingMember) {
                const updated = await ignisApi.staff.update(editingMember.id, form);
                setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
                toast.success('Membro atualizado');
            } else {
                const created = await ignisApi.staff.create(form);
                setMembers(prev => [...prev, created]);
                toast.success('Membro criado');
            }
            setShowModal(false);
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await ignisApi.staff.delete(deleteTarget.id);
            setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
            toast.success('Membro removido');
            setDeleteTarget(null);
        } catch (err: any) {
            toast.error(err.message || 'Erro ao deletar');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="clergy-container">
            <div className="section-header">
                <h2 className="section-title">Gestão do Clero & Staff</h2>
                <button className="btn-add-staff" onClick={openCreate}><Plus size={14} /> Novo Membro</button>
            </div>

            {/* Filters */}
            <div className="staff-filters">
                <div className="staff-search-wrap">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="staff-search-input"
                    />
                </div>
                <div className="staff-role-filter-wrap">
                    <Filter size={14} />
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="staff-role-select">
                        <option value="">Todos os cargos</option>
                        {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="staff-loading"><Loader2 size={24} className="spin" /> Carregando...</div>
            ) : filtered.length === 0 ? (
                <div className="staff-empty">
                    <User size={32} />
                    <p>Nenhum membro encontrado</p>
                </div>
            ) : (
                <div className="staff-table-wrap">
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Cargo</th>
                                <th>Email</th>
                                <th>Telefone</th>
                                <th>Status</th>
                                <th>Entrada</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(m => (
                                <tr key={m.id} className="staff-row" onClick={() => openEdit(m)}>
                                    <td>
                                        <div className="staff-name-cell">
                                            <div className="staff-avatar-sm">{m.name.charAt(0)}</div>
                                            {m.name}
                                        </div>
                                    </td>
                                    <td><span className="staff-role-badge">{m.role}</span></td>
                                    <td className="text-muted">{m.email || '—'}</td>
                                    <td className="text-muted">{m.phone || '—'}</td>
                                    <td><span className={`staff-status-badge ${m.status}`}>{statusLabel(m.status)}</span></td>
                                    <td className="text-muted">{m.joinedAt || '—'}</td>
                                    <td>
                                        <div className="staff-actions" onClick={e => e.stopPropagation()}>
                                            <button className="btn-icon" title="Editar" onClick={() => openEdit(m)}><Edit2 size={14} /></button>
                                            <button className="btn-icon danger" title="Deletar" onClick={() => setDeleteTarget(m)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="staff-overlay" onClick={() => setShowModal(false)}>
                    <div className="staff-modal" onClick={e => e.stopPropagation()}>
                        <div className="staff-modal-header">
                            <h3>{editingMember ? 'Editar Membro' : 'Novo Membro'}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <div className="staff-modal-body">
                            <div className="staff-field">
                                <label>Nome *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="staff-field">
                                <label>Cargo</label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="staff-field-row">
                                <div className="staff-field">
                                    <label>Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div className="staff-field">
                                    <label>Telefone</label>
                                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="staff-field-row">
                                <div className="staff-field">
                                    <label>Status</label>
                                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StaffMember['status'] }))}>
                                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div className="staff-field">
                                    <label>Data de Entrada</label>
                                    <input type="date" value={form.joinedAt} onChange={e => setForm(f => ({ ...f, joinedAt: e.target.value }))} />
                                </div>
                            </div>
                            <div className="staff-field">
                                <label>Observações</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                        </div>
                        <div className="staff-modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <><Loader2 size={14} className="spin" /> Salvando...</> : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="staff-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="staff-modal staff-modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="staff-modal-header">
                            <h3>Confirmar Exclusão</h3>
                            <button className="btn-icon" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
                        </div>
                        <div className="staff-modal-body">
                            <p>Tem certeza que deseja remover <strong>{deleteTarget.name}</strong>? Esta ação não pode ser desfeita.</p>
                        </div>
                        <div className="staff-modal-footer">
                            <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                            <button className="btn-delete" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? <><Loader2 size={14} className="spin" /> Deletando...</> : 'Deletar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
