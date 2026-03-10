import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Building2, MapPin, UploadCloud, Save, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { ModalCloseButton } from './ui/ModalCloseButton';
import './EditParishModal.css';

// Schema Validation with Zod
const schema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/, 'CNPJ inválido'),
    status: z.enum(['active', 'inactive', 'implanting']),
    address: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    priest_name: z.string().optional(),
    foundation_date: z.string().optional(),
    notes: z.string().optional(),
});

type ParishFormData = z.infer<typeof schema>;

interface EditParishModalProps {
    isOpen: boolean;
    onClose: () => void;
    parishId: string;
}

export const EditParishModal: React.FC<EditParishModalProps> = ({ isOpen, onClose, parishId }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<ParishFormData>({
        name: '', cnpj: '', status: 'active', address: '', number: '', neighborhood: '', city: '', state: '', zip_code: '', phone: '', email: '', priest_name: '', foundation_date: '', notes: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

    useEffect(() => {
        if (isOpen && parishId) {
            loadParish();
        }
    }, [isOpen, parishId]);

    const loadParish = async () => {
        setIsLoading(true);
        try {
            // Usando 'tenants' que é a verdadeira tabela no Ignis, apesar do prompt
            const { data, error } = await supabase.from('tenants').select('*').eq('id', parishId).single();
            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    cnpj: data.cnpj || '',
                    status: data.status || 'active',
                    address: data.address || '',
                    number: data.number || '', // Assuming number might exist, added here
                    neighborhood: data.neighborhood || '',
                    city: data.city || '',
                    state: data.state || '',
                    zip_code: data.zip_code || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    priest_name: data.priest_name || '',
                    foundation_date: data.foundation_date || '',
                    notes: data.notes || '',
                });
                if (data.logo_url) setLogoPreview(data.logo_url);
            }
        } catch (error) {
            toast.error('Erro ao carregar dados da Paróquia');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof ParishFormData, value: string) => {
        // Apply masks if necessary
        let formattedValue = value;
        if (field === 'cnpj') {
            formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
        } else if (field === 'phone') {
            formattedValue = value.replace(/\D/g, '').replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2').slice(0, 15);
        } else if (field === 'zip_code') {
            formattedValue = value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
        }
        setFormData(prev => ({ ...prev, [field]: formattedValue }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const saveToDatabase = async () => {
        try {
            schema.parse(formData); // Validate matching zod structure
            setIsSaving(true);

            let finalLogoUrl = logoPreview;
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${parishId}-${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('parishes').upload(fileName, logoFile, { upsert: true });
                if (uploadError) throw new Error('Erro ao fazer upload da logo');

                const { data: publicUrlData } = supabase.storage.from('parishes').getPublicUrl(fileName);
                finalLogoUrl = publicUrlData.publicUrl;
            }

            const updatePayload = {
                ...formData,
                logo_url: finalLogoUrl,
            };

            const { error } = await supabase.from('tenants').update(updatePayload).eq('id', parishId);
            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['parishes'] });
            toast.success('Paróquia atualizada com sucesso!');
            onClose();
        } catch (err: any) {
            if (err instanceof z.ZodError) {
                toast.error((err as any).errors[0].message);
            } else {
                toast.error(err.message || 'Erro ao atualizar paróquia');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="parish-modal-overlay" onClick={onClose}>
            <div className="parish-modal glass" onClick={e => e.stopPropagation()}>
                <div className="parish-modal-header">
                    <div>
                        <h2>Editar Informações</h2>
                        <p>Atualize os dados institucionais da paróquia</p>
                    </div>
                    <ModalCloseButton onClose={onClose} />
                </div>

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={32} /></div>
                ) : (
                    <div className="parish-modal-content">
                        {/* Esquerda: Informações Gerais */}
                        <div className="modal-panel">
                            <h3 className="panel-title"><Building2 size={16} /> Dados Gerais</h3>

                            <div className="logo-upload-section">
                                <div className="logo-circle" style={{ backgroundImage: `url(${logoPreview})` }}>
                                    {!logoPreview && <Building2 size={32} opacity={0.3} />}
                                </div>
                                <label className="btn-secondary btn-upload">
                                    <UploadCloud size={16} /> Alterar Logo
                                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Nome da Paróquia*</label>
                                <input type="text" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Ex: Paróquia São José" />
                            </div>

                            <div className="form-group">
                                <label>Pároco Responsável</label>
                                <input type="text" value={formData.priest_name} onChange={e => handleInputChange('priest_name', e.target.value)} placeholder="Ex: Pe. João" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>CNPJ*</label>
                                    <input type="text" value={formData.cnpj} onChange={e => handleInputChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
                                </div>

                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Status*</label>
                                    <select value={formData.status} onChange={e => handleInputChange('status', e.target.value)}>
                                        <option value="active">Ativa</option>
                                        <option value="inactive">Inativa</option>
                                        <option value="implanting">Em Implantação</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Data de Fundação</label>
                                <input type="date" value={formData.foundation_date} onChange={e => handleInputChange('foundation_date', e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea rows={2} value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)}></textarea>
                            </div>
                        </div>

                        {/* Direita: Endereço + Contato */}
                        <div className="modal-panel">
                            <h3 className="panel-title"><MapPin size={16} /> Endereço e Contato</h3>

                            <div className="form-group">
                                <label>E-mail Institucional</label>
                                <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="contato@paroquia.com" />
                            </div>

                            <div className="form-group">
                                <label>Telefone</label>
                                <input type="text" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} placeholder="(00) 0000-0000" />
                            </div>

                            <div className="form-group">
                                <label>CEP</label>
                                <input type="text" value={formData.zip_code} onChange={e => handleInputChange('zip_code', e.target.value)} placeholder="00000-000" />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Logradouro</label>
                                    <input type="text" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Rua / Av" />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Número</label>
                                    <input type="text" value={formData.number} onChange={e => handleInputChange('number', e.target.value)} placeholder="123" />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Bairro</label>
                                <input type="text" value={formData.neighborhood} onChange={e => handleInputChange('neighborhood', e.target.value)} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Cidade</label>
                                    <input type="text" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>UF</label>
                                    <input type="text" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} maxLength={2} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="parish-modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={isSaving}>Cancelar</button>
                    <button className="btn-primary" onClick={saveToDatabase} disabled={isSaving || isLoading}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span style={{ marginLeft: '8px' }}>Salvar Alterações</span>
                    </button>
                </div>
            </div>
        </div >
    );
}
