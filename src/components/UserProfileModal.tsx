import React, { useState } from 'react';
import { X, Lock, User as UserIcon, Upload, Save, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import './UserProfileModal.css';

interface UserProfileModalProps {
  onClose: () => void;
  currentUser: any; 
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose, currentUser }) => {
  const { refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  
  // Security
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      setError('');
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true
        });

      if (uploadError) {
          if (uploadError.message.includes('bucket not found')) {
              throw new Error('Bucket de armazenamento "avatars" não encontrado. Por favor, contate o suporte.');
          }
          throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(publicUrl);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', currentUser.id);

      if (error) throw error;
      setSuccessMsg('Perfil atualizado com sucesso!');
      
      await refreshProfile();
      setTimeout(() => onClose(), 1500);
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (newPassword && newPassword !== confirmPassword) {
        throw new Error('As senhas não coincidem.');
      }

      const updates: any = {};
      if (email) updates.email = email;
      if (newPassword) updates.password = newPassword;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
        setSuccessMsg('Credenciais atualizadas com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
        setEmail('');
      } else {
        setError('Preencha os campos que deseja alterar.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-profile-modal glass" onClick={e => e.stopPropagation()}>
        <header className="up-header">
          <h2>Editar Perfil</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="up-tabs">
          <button 
            className={`up-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <UserIcon size={16} /> Geral
          </button>
          <button 
            className={`up-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={16} /> Segurança
          </button>
        </div>

        <div className="up-body">
          {error && <div className="status-box error"><AlertCircle size={16} /> {error}</div>}
          {successMsg && <div className="status-box success"><CheckCircle2 size={16} /> {successMsg}</div>}

          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="up-form">
              <div className="avatar-upload-section">
                <div className={`avatar-container ${avatarUrl ? 'has-image' : ''}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" />
                  ) : (
                    <UserIcon size={48} style={{ opacity: 0.3 }} />
                  )}
                  {isUploading && (
                    <div className="upload-overlay" style={{ opacity: 1, background: 'rgba(0,0,0,0.6)' }}>
                        <Loader2 className="spin" size={24} />
                    </div>
                  )}
                </div>
                
                <label className="btn-upload">
                  <Upload size={16} />
                  {isUploading ? 'Processando...' : avatarUrl ? 'Trocar Foto' : 'Adicionar Foto'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploading || isLoading}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <div className="input-with-icon">
                    <UserIcon size={16} className="input-icon" />
                    <input 
                    type="text" 
                    className="input-field" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Como você quer ser chamado?"
                    required
                    />
                </div>
              </div>

              <div className="up-actions">
                <button type="submit" className="btn-primary-action" disabled={isLoading || isUploading}>
                  {isLoading ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="up-form">
              <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '8px' }}>
                Altere seus dados de acesso ao ecossistema IGNIS.
              </p>
              
              <div className="form-group">
                <label className="form-label">Novo E-mail</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Deixe em branco para manter o atual"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Senha</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>

              <div className="up-actions">
                <button type="submit" className="btn-primary-action" disabled={isLoading} style={{ background: 'var(--status-remarcado)' }}>
                  {isLoading ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
                  <span>Atualizar Segurança</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
