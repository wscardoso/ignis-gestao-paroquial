import { supabase } from './supabase';

export interface Tenant {
    id: string;
    name: string;
    cnpj?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    priest_name?: string;
    slogan?: string;
    status: 'active' | 'inactive';
    active_modules?: string[];
}

export interface Community {
    id: string;
    tenantId: string;
    name: string;
    status: 'active' | 'inactive';
    address: string;
    members?: number;
    metrics?: string;
}

export interface Appointment {
    id: string;
    tenantId: string;
    subTenantId: string;
    clientName: string;
    clientPhone?: string;
    serviceType: string;
    celebrantName?: string;
    startTime: string;
    endTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'remarcado';
    notes?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    parentAppointmentId?: string;
    whatsappStatus?: 'none' | 'pending' | 'sent' | 'error';
    createdAt?: string;
}

export interface Sacrament {
    id: string;
    tenantId: string;
    type: 'baptism' | 'marriage' | 'confirmation';
    celebrantId?: string;
    subjectId?: string; // Link to people table
    celebratoryDate: string;
    bookNumber: string;
    pageNumber: string;
    entryNumber: string;
    subjectName: string;
    details: {
        father?: string;
        mother?: string;
        godfather?: string;
        godmother?: string;
        fatherId?: string;
        motherId?: string;
        godfatherId?: string;
        godmotherId?: string;
        birthDate?: string;
        birthPlace?: string;
        spouse?: string;
        spouseId?: string;
        witness1?: string;
        witness2?: string;
        [key: string]: any;
    };
    createdAt?: string;
}

export interface Person {
    id: string;
    tenantId: string;
    name: string;
    cpf?: string;
    birthDate?: string;
    email?: string;
    phone?: string;
    address?: string;
    photoUrl?: string;
    sacramentsData?: any;
    groups?: string[];
    status: 'active' | 'inactive' | 'deceased';
    createdAt?: string;
}

export const ignisApi = {
    tenants: {
        getAll: async () => {
            const { data, error } = await supabase
                .from('tenants')
                .select('*');
            if (error) throw error;
            return data as Tenant[];
        },
        getById: async (id: string) => {
            const { data, error } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data as Tenant;
        },
        create: async (data: Omit<Tenant, 'id' | 'status'>) => {
            const { data: newTenant, error } = await supabase
                .from('tenants')
                .insert([{ ...data, status: 'active' }])
                .select()
                .single();
            if (error) throw error;
            return newTenant as Tenant;
        }
    },
    communities: {
        getByTenant: async (tenantId: string) => {
            const { data, error } = await supabase
                .from('sub_tenants')
                .select('*')
                .eq('tenant_id', tenantId);
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                name: item.name,
                status: 'active',
                address: item.address || '',
                members: 0,
                metrics: '0/mês'
            })) as Community[];
        },
        create: async (data: Omit<Community, 'id'>) => {
            const { data: newCommunity, error } = await supabase
                .from('sub_tenants')
                .insert([{
                    tenant_id: data.tenantId,
                    name: data.name,
                    address: data.address
                }])
                .select()
                .single();
            if (error) throw error;
            return {
                id: newCommunity.id,
                tenantId: newCommunity.tenant_id,
                name: newCommunity.name,
                status: 'active',
                address: newCommunity.address || '',
                members: 0,
                metrics: '0/mês'
            } as Community;
        },
        update: async (id: string, data: Partial<Community>) => {
            const { data: updated, error } = await supabase
                .from('sub_tenants')
                .update({
                    name: data.name,
                    address: data.address
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return {
                id: updated.id,
                tenantId: updated.tenant_id,
                name: updated.name,
                status: 'active',
                address: updated.address || '',
                members: 0,
                metrics: '0/mês'
            } as Community;
        }
    },
    appointments: {
        getByDateRange: async (tenantId: string, subTenantId: string, start: Date, end: Date) => {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('sub_tenant_id', subTenantId)
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString());
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                subTenantId: item.sub_tenant_id,
                clientName: item.client_name,
                clientPhone: item.client_phone,
                serviceType: item.service_type,
                celebrantName: item.celebrant_name,
                startTime: item.start_time,
                endTime: item.end_time,
                status: item.status,
                notes: item.notes,
                isRecurring: item.is_recurring,
                recurrenceRule: item.recurrence_rule,
                parentAppointmentId: item.parent_appointment_id,
                whatsappStatus: item.whatsapp_status || 'none',
                createdAt: item.created_at
            })) as Appointment[];
        },
        create: async (data: Omit<Appointment, 'id' | 'createdAt'>) => {
            const { data: newItem, error } = await supabase
                .from('appointments')
                .insert([{
                    tenant_id: data.tenantId,
                    sub_tenant_id: data.subTenantId,
                    client_name: data.clientName,
                    client_phone: data.clientPhone,
                    service_type: data.serviceType,
                    celebrant_name: data.celebrantName,
                    start_time: data.startTime,
                    end_time: data.endTime,
                    status: data.status || 'pending',
                    notes: data.notes,
                    is_recurring: data.isRecurring,
                    recurrence_rule: data.recurrenceRule,
                    parent_appointment_id: data.parentAppointmentId
                }])
                .select()
                .single();
            if (error) throw error;
            return {
                id: newItem.id,
                tenantId: newItem.tenant_id,
                subTenantId: newItem.sub_tenant_id,
                clientName: newItem.client_name,
                clientPhone: newItem.client_phone,
                serviceType: newItem.service_type,
                celebrantName: newItem.celebrant_name,
                startTime: newItem.start_time,
                endTime: newItem.end_time,
                status: newItem.status,
                notes: newItem.notes,
                isRecurring: newItem.is_recurring,
                recurrenceRule: newItem.recurrence_rule,
                parentAppointmentId: newItem.parent_appointment_id,
                whatsappStatus: newItem.whatsapp_status || 'none',
                createdAt: newItem.created_at
            } as Appointment;
        },
        updateStatus: async (id: string, status: Appointment['status']) => {
            const { data, error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        update: async (id: string, data: Partial<Appointment>) => {
            const { data: updatedItem, error } = await supabase
                .from('appointments')
                .update({
                    client_name: data.clientName,
                    client_phone: data.clientPhone,
                    service_type: data.serviceType,
                    celebrant_name: data.celebrantName,
                    start_time: data.startTime,
                    end_time: data.endTime,
                    status: data.status,
                    notes: data.notes,
                    is_recurring: data.isRecurring,
                    recurrence_rule: data.recurrenceRule,
                    parent_appointment_id: data.parentAppointmentId
                })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return updatedItem;
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);
            if (error) throw error;
        }
    },
    sacraments: {
        getAll: async (tenantId: string) => {
            const { data, error } = await supabase
                .from('sacraments')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('celebratory_date', { ascending: false });
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                type: item.type,
                celebrantId: item.celebrant_id,
                subjectId: item.subject_id,
                celebratoryDate: item.celebratory_date,
                bookNumber: item.book_number,
                pageNumber: item.page_number,
                entryNumber: item.entry_number,
                subjectName: item.subject_name,
                details: item.details,
                createdAt: item.created_at
            })) as Sacrament[];
        },
        create: async (data: Omit<Sacrament, 'id' | 'createdAt'>) => {
            const { data: newItem, error } = await supabase
                .from('sacraments')
                .insert([{
                    tenant_id: data.tenantId,
                    type: data.type,
                    celebrant_id: data.celebrantId || null,
                    subject_id: data.subjectId || null,
                    celebratory_date: data.celebratoryDate,
                    book_number: data.bookNumber,
                    page_number: data.pageNumber,
                    entry_number: data.entryNumber,
                    subject_name: data.subjectName,
                    details: data.details
                }])
                .select()
                .single();
            if (error) throw error;
            return newItem as Sacrament;
        },
        getByPerson: async (tenantId: string, personId: string) => {
            const { data, error } = await supabase
                .from('sacraments')
                .select('*')
                .eq('tenant_id', tenantId)
                .or(`subject_id.eq.${personId},details->>fatherId.eq.${personId},details->>motherId.eq.${personId},details->>godfatherId.eq.${personId},details->>godmotherId.eq.${personId}`)
                .order('celebratory_date', { ascending: false });
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                type: item.type,
                celebrantId: item.celebrant_id,
                subjectId: item.subject_id,
                celebratoryDate: item.celebratory_date,
                bookNumber: item.book_number,
                pageNumber: item.page_number,
                entryNumber: item.entry_number,
                subjectName: item.subject_name,
                details: item.details,
                createdAt: item.created_at
            })) as Sacrament[];
        },
        search: async (tenantId: string, query: string) => {
            const { data, error } = await supabase
                .from('sacraments')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('subject_name', `%${query}%`);
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                type: item.type,
                celebrantId: item.celebrant_id,
                subjectId: item.subject_id,
                celebratoryDate: item.celebratory_date,
                bookNumber: item.book_number,
                pageNumber: item.page_number,
                entryNumber: item.entry_number,
                subjectName: item.subject_name,
                details: item.details,
                createdAt: item.created_at
            })) as Sacrament[];
        }
    },
    people: {
        getAll: async (tenantId: string) => {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                name: item.name,
                cpf: item.cpf,
                birthDate: item.birth_date,
                email: item.email,
                phone: item.phone,
                address: item.address,
                photoUrl: item.photo_url,
                sacramentsData: item.sacraments_data,
                groups: item.groups,
                status: item.status,
                createdAt: item.created_at
            })) as Person[];
        },
        getById: async (id: string) => {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return {
                id: data.id,
                tenantId: data.tenant_id,
                name: data.name,
                cpf: data.cpf,
                birthDate: data.birth_date,
                email: data.email,
                phone: data.phone,
                address: data.address,
                photoUrl: data.photo_url,
                sacramentsData: data.sacraments_data,
                groups: data.groups,
                status: data.status,
                createdAt: data.created_at
            } as Person;
        },
        upsert: async (data: Partial<Person> & { tenantId: string; name: string }) => {
            const payload = {
                tenant_id: data.tenantId,
                name: data.name,
                cpf: data.cpf,
                birth_date: data.birthDate,
                email: data.email,
                phone: data.phone,
                address: data.address,
                photo_url: data.photoUrl,
                sacraments_data: data.sacramentsData,
                groups: data.groups,
                status: data.status || 'active'
            };

            const { data: result, error } = await supabase
                .from('people')
                .upsert([payload], { onConflict: 'id' })
                .select()
                .single();

            if (error) throw error;
            return result as Person;
        },
        search: async (tenantId: string, query: string) => {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('name', `%${query}%`);
            if (error) throw error;
            return (data || []) as Person[];
        }
    },
    governance: {
        transferCommunity: async (communityId: string, targetTenantId: string) => {
            const { data, error } = await supabase
                .from('sub_tenants')
                .update({ tenant_id: targetTenantId })
                .eq('id', communityId)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        getGlobalStats: async () => {
            // Fetch aggregated data for global map
            const { data: parishes, error: pError } = await supabase.from('tenants').select('id, name');
            const { data: communities, error: cError } = await supabase.from('sub_tenants').select('tenant_id');
            const { data: appointments, error: aError } = await supabase.from('appointments').select('tenant_id, status');

            if (pError || cError || aError) throw pError || cError || aError;

            return parishes.map((p: any) => ({
                id: p.id,
                name: p.name,
                communitiesCount: (communities || []).filter((c: any) => c.tenant_id === p.id).length,
                activeAppointments: (appointments || []).filter((a: any) => a.tenant_id === p.id && a.status === 'confirmed').length,
                totalAppointments: (appointments || []).filter((a: any) => a.tenant_id === p.id).length
            }));
        }
    },
    notifications: {
        sendWhatsAppConfirmation: async (appointmentId: string) => {
            // No Supabase, dispararemos uma Edge Function que conversa com a Z-API
            const { data, error } = await supabase.functions.invoke('send-whatsapp', {
                body: { appointmentId }
            });

            if (error) {
                console.error('Erro ao chamar Edge Function:', error);
                // Fallback: marcar como erro no banco se a função falhar
                await supabase.from('appointments').update({ whatsapp_status: 'error' }).eq('id', appointmentId);
                throw error;
            }

            return data;
        },
        updateWhatsAppStatus: async (appointmentId: string, status: Appointment['whatsappStatus']) => {
            const { data, error } = await supabase
                .from('appointments')
                .update({ whatsapp_status: status })
                .eq('id', appointmentId);
            if (error) throw error;
            return data;
        }
    }
};
