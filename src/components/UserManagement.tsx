import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Save, Loader2,
  UserCheck, UserX, Users as UsersIcon
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useTenant } from '../contexts/TenantContext';
import toast from 'react-hot-toast';
import './UserManagement.css';

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string | null;
  status: string | null;
  tenant_id: string | null;
  avatar_url?: string | null;
  created_at: string | null;
  email?: string;
}

const ROLE_OPTIONS = [
  { value: 'fiel', label: 'Fiel' },
  { value: 'padre', label: 'Padre' },
  { value: 'comunidade_lead', label: 'Líder de Comunidade' },
  { value: 'matriz_admin', label: 'Admin Paróquia' },
  { value: 'super_admin', label: 'Super Admin' },
];

const roleLabelMap: Record<string, string> = {
  fiel: 'Fiel',
  padre: 'Padre',
  comunidade_lead: 'Líder Comunidade',
  matriz_admin: 'Admin Paróquia',
  super_admin: 'Super Admin',
};

export const UserManagement: React.FC = () => {
  const { activeTenant } = useTenant();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', password: '', role: 'fiel' });
  const [isCreating, setIsCreating] = useState(false);

  // Edit modal
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: '', status: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    if (!activeTenant) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', activeTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error('Erro ao carregar usuários: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [activeTenant?.id]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !searchQuery ||
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password || !createForm.fullName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    if (createForm.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setIsCreating(true);
    try {
      const res = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'create',
          email: createForm.email.trim(),
          password: createForm.password,
          fullName: createForm.fullName.trim(),
          role: createForm.role,
          tenantId: activeTenant?.id,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success('Usuário criado com sucesso!');
      setIsCreateOpen(false);
      setCreateForm({ fullName: '', email: '', password: '', role: 'fiel' });
      loadUsers();
    } catch (err: any) {
      toast.error('Erro ao criar usuário: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setIsSaving(true);
    try {
      const res = await supabase.functions.invoke('manage-user', {
        body: {
          action: 'update',
          userId: editUser.id,
          fullName: editForm.fullName.trim(),
          role: editForm.role,
          status: editForm.status,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success('Usuário atualizado!');
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await supabase.functions.invoke('manage-user', {
        body: { action: 'delete', userId: deleteTarget.id },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success('Usuário removido!');
      setDeleteTarget(null);
      loadUsers();
    } catch (err: any) {
      toast.error('Erro ao deletar: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditUser(user);
    setEditForm({
      fullName: user.full_name || '',
      role: user.role || 'fiel',
      status: user.status || 'active',
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="user-management">
      <div className="um-header">
        <div className="um-header-left">
          <UsersIcon size={22} />
          <h2>Gestão de Usuários</h2>
          <span className="um-count">{filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn-primary-action" onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="um-filters">
        <div className="um-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="um-role-filter"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">Todos os Roles</option>
          {ROLE_OPTIONS.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="um-table-wrapper">
        <table className="um-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Role</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="um-skeleton-row">
                  <td><div className="skeleton" /></td>
                  <td><div className="skeleton" /></td>
                  <td><div className="skeleton" /></td>
                  <td><div className="skeleton" /></td>
                  <td><div className="skeleton" /></td>
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="um-empty">Nenhum usuário encontrado</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} onClick={() => openEdit(user)} className="um-row-clickable">
                  <td>
                    <div className="um-user-cell">
                      <div className="um-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          (user.full_name || '?')[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="um-name">{user.full_name || 'Sem nome'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`um-role-badge role-${user.role}`}>
                      {roleLabelMap[user.role || 'fiel'] || user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`um-status ${user.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {user.status === 'active' ? <UserCheck size={14} /> : <UserX size={14} />}
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="um-date">{formatDate(user.created_at)}</td>
                  <td>
                    <div className="um-actions" onClick={e => e.stopPropagation()}>
                      <button className="um-btn-icon" onClick={() => openEdit(user)} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="um-btn-icon um-btn-danger" onClick={() => setDeleteTarget(user)} title="Deletar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="um-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Novo Usuário</h3>
              <button className="um-btn-close" onClick={() => setIsCreateOpen(false)}><X size={20} /></button>
            </div>
            <div className="um-modal-body">
              <div className="um-field">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Nome do usuário"
                />
              </div>
              <div className="um-field">
                <label>Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="um-field">
                <label>Senha *</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="um-field">
                <label>Role</label>
                <select
                  value={createForm.role}
                  onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="um-field">
                <label>Paróquia</label>
                <input type="text" value={activeTenant?.name || ''} disabled />
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="btn-secondary" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>Cancelar</button>
              <button className="btn-primary-action" onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                <span>Criar Usuário</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="um-overlay" onClick={() => setEditUser(null)}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Editar Usuário</h3>
              <button className="um-btn-close" onClick={() => setEditUser(null)}><X size={20} /></button>
            </div>
            <div className="um-modal-body">
              <div className="um-field">
                <label>Nome Completo</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div className="um-field">
                <label>Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="um-field">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
            <div className="um-modal-footer">
              <button className="btn-secondary" onClick={() => setEditUser(null)} disabled={isSaving}>Cancelar</button>
              <button className="btn-primary-action" onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="um-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="um-modal um-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="um-modal-header">
              <h3>Confirmar Exclusão</h3>
              <button className="um-btn-close" onClick={() => setDeleteTarget(null)}><X size={20} /></button>
            </div>
            <div className="um-modal-body">
              <p className="um-delete-msg">
                Tem certeza que deseja excluir <strong>{deleteTarget.full_name || 'este usuário'}</strong>?
                Esta ação é irreversível.
              </p>
            </div>
            <div className="um-modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancelar</button>
              <button className="um-btn-delete" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
