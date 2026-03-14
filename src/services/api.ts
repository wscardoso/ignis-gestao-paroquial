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
    type: 'baptism' | 'marriage' | 'confirmation' | 'first_communion' | 'anointing_of_sick';
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

export interface StaffMember {
    id: string;
    tenantId: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    status: 'available' | 'busy' | 'off' | 'inactive';
    joinedAt?: string;
    notes?: string;
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

export interface PastoralGroup {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    coordinatorId?: string;
    viceCoordinatorId?: string;
    treasurerId?: string;
    schedule?: string;
    isActive: boolean;
    createdAt?: string;
}

export interface PastoralGroupMember {
    personId: string;
    groupId: string;
    role: string;
    joinedAt: string;
    person?: Person;
    group?: PastoralGroup;
}

export interface FinancialCategory {
    id: string;
    tenantId: string;
    name: string;
    type: 'income' | 'expense';
    isActive: boolean;
}

export interface FinancialTransaction {
    id: string;
    tenantId: string;
    categoryId?: string;
    categoryName?: string;
    personId?: string;
    personName?: string;
    type: 'income' | 'expense';
    amount: number;
    description?: string;
    transactionDate: string;
    paymentMethod: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other';
    status: 'pending' | 'completed' | 'cancelled';
    receiptUrl?: string;
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
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('sub_tenants')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        getLinkedCounts: async (id: string) => {
            const { count: appts } = await supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .eq('sub_tenant_id', id);
            return { appointments: appts || 0 };
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
            return newItem as unknown as Sacrament;
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
        },
        update: async (id: string, data: Partial<Sacrament>) => {
            const payload: Record<string, any> = {};
            if (data.type !== undefined) payload.type = data.type;
            if (data.subjectName !== undefined) payload.subject_name = data.subjectName;
            if (data.subjectId !== undefined) payload.subject_id = data.subjectId || null;
            if (data.celebrantId !== undefined) payload.celebrant_id = data.celebrantId || null;
            if (data.celebratoryDate !== undefined) payload.celebratory_date = data.celebratoryDate;
            if (data.bookNumber !== undefined) payload.book_number = data.bookNumber;
            if (data.pageNumber !== undefined) payload.page_number = data.pageNumber;
            if (data.entryNumber !== undefined) payload.entry_number = data.entryNumber;
            if (data.details !== undefined) payload.details = data.details;

            const { error } = await supabase
                .from('sacraments')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('sacraments')
                .delete()
                .eq('id', id);
            if (error) throw error;
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
        getGroups: async (tenantId: string) => {
            const { data, error } = await supabase
                .from('pastoral_groups')
                .select('*')
                .eq('tenant_id', tenantId);
            if (error) throw error;
            return (data || []).map((d: any) => ({
                id: d.id,
                tenantId: d.tenant_id,
                name: d.name,
                description: d.description,
                coordinatorId: d.coordinator_id,
                viceCoordinatorId: d.vice_coordinator_id,
                treasurerId: d.treasurer_id,
                schedule: d.schedule,
                isActive: d.is_active,
                createdAt: d.created_at
            })) as PastoralGroup[];
        },
        createGroup: async (data: Omit<PastoralGroup, 'id' | 'createdAt' | 'isActive'>) => {
            const { data: ng, error } = await supabase.from('pastoral_groups').insert([{
                tenant_id: data.tenantId,
                name: data.name,
                description: data.description,
                coordinator_id: data.coordinatorId || null,
                vice_coordinator_id: data.viceCoordinatorId || null,
                treasurer_id: data.treasurerId || null,
                schedule: data.schedule
            }]).select().single();
            if (error) throw error;
            return ng as unknown as PastoralGroup;
        },
        getGroupMembers: async (groupId: string) => {
            const { data, error } = await supabase
                .from('person_pastoral_groups')
                .select(`
                    *,
                    person:people(*)
                `)
                .eq('group_id', groupId);
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                groupId: item.group_id,
                personId: item.person_id,
                role: item.role,
                joinedAt: item.joined_at,
                person: {
                    id: item.person.id,
                    tenantId: item.person.tenant_id,
                    name: item.person.name,
                    cpf: item.person.cpf,
                    birthDate: item.person.birth_date,
                    email: item.person.email,
                    phone: item.person.phone,
                    address: item.person.address,
                    photoUrl: item.person.photo_url,
                    sacramentsData: item.person.sacraments_data,
                    groups: item.person.groups,
                    status: item.person.status,
                    createdAt: item.person.created_at
                }
            })) as PastoralGroupMember[];
        },
        addMemberToGroup: async (groupId: string, personId: string, role: string = 'Membro') => {
            const { error } = await supabase.from('person_pastoral_groups').insert([{
                group_id: groupId,
                person_id: personId,
                role
            }]);
            if (error) throw error;
        },
        removeMemberFromGroup: async (groupId: string, personId: string) => {
            const { error } = await supabase.from('person_pastoral_groups')
                .delete()
                .eq('group_id', groupId)
                .eq('person_id', personId);
            if (error) throw error;
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
            return result as unknown as Person;
        },
        search: async (tenantId: string, query: string) => {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .eq('tenant_id', tenantId)
                .ilike('name', `%${query}%`);
            if (error) throw error;
            return (data || []) as unknown as Person[];
        }
    },
    staff: {
        getByTenant: async (tenantId: string) => {
            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true });
            if (error) throw error;
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                name: item.name,
                role: item.role,
                email: item.email,
                phone: item.phone,
                status: item.status,
                joinedAt: item.joined_at,
                notes: item.notes,
                createdAt: item.created_at,
            })) as StaffMember[];
        },
        create: async (data: Omit<StaffMember, 'id' | 'createdAt'>) => {
            const { data: newItem, error } = await supabase
                .from('staff')
                .insert([{
                    tenant_id: data.tenantId,
                    name: data.name,
                    role: data.role,
                    email: data.email,
                    phone: data.phone,
                    status: data.status || 'available',
                    joined_at: data.joinedAt,
                    notes: data.notes,
                }])
                .select()
                .single();
            if (error) throw error;
            return {
                id: newItem.id,
                tenantId: newItem.tenant_id,
                name: newItem.name,
                role: newItem.role,
                email: newItem.email,
                phone: newItem.phone,
                status: newItem.status,
                joinedAt: newItem.joined_at,
                notes: newItem.notes,
                createdAt: newItem.created_at,
            } as StaffMember;
        },
        update: async (id: string, data: Partial<StaffMember>) => {
            const payload: Record<string, any> = {};
            if (data.name !== undefined) payload.name = data.name;
            if (data.role !== undefined) payload.role = data.role;
            if (data.email !== undefined) payload.email = data.email;
            if (data.phone !== undefined) payload.phone = data.phone;
            if (data.status !== undefined) payload.status = data.status;
            if (data.joinedAt !== undefined) payload.joined_at = data.joinedAt;
            if (data.notes !== undefined) payload.notes = data.notes;

            const { data: updated, error } = await supabase
                .from('staff')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return {
                id: updated.id,
                tenantId: updated.tenant_id,
                name: updated.name,
                role: updated.role,
                email: updated.email,
                phone: updated.phone,
                status: updated.status,
                joinedAt: updated.joined_at,
                notes: updated.notes,
                createdAt: updated.created_at,
            } as StaffMember;
        },
        delete: async (id: string) => {
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
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
        },
        getLocalStats: async (tenantId: string) => {
            // Fetch communities and metrics for a specific parish
            const { data: communities, error: cError } = await supabase
                .from('sub_tenants')
                .select('*')
                .eq('tenant_id', tenantId);
            
            const { data: appointments, error: aError } = await supabase
                .from('appointments')
                .select('*')
                .eq('tenant_id', tenantId);

            if (cError || aError) throw cError || aError;

            // Group by sub_tenant for local metrics
            return (communities || []).map(c => {
                const cAppts = (appointments || []).filter(a => (a as any).sub_tenant_id === c.id);
                return {
                    id: c.id,
                    name: c.name,
                    activeAppointments: cAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
                    totalAppointments: cAppts.length,
                    efficiency: Math.round((cAppts.filter(a => a.status === 'completed').length / (cAppts.length || 1)) * 100)
                };
            });
        }
    },
    administratio: {
        getCategories: async (tenantId: string, type?: 'income' | 'expense') => {
            let query = supabase.from('financial_categories').select('*').eq('tenant_id', tenantId).eq('is_active', true);
            if (type) query = query.eq('type', type);
            
            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;
            
            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                name: item.name,
                type: item.type,
                isActive: item.is_active
            })) as FinancialCategory[];
        },
        createCategory: async (data: Omit<FinancialCategory, 'id' | 'isActive'>) => {
            const { data: newCat, error } = await supabase
                .from('financial_categories')
                .insert([{
                    tenant_id: data.tenantId,
                    name: data.name,
                    type: data.type
                }])
                .select()
                .single();
            if (error) throw error;
            return {
                id: newCat.id,
                tenantId: newCat.tenant_id,
                name: newCat.name,
                type: newCat.type,
                isActive: newCat.is_active
            } as FinancialCategory;
        },
        getTransactions: async (tenantId: string, startDate?: string, endDate?: string) => {
            let query = supabase
                .from('financial_transactions')
                .select(`
                    *,
                    category:financial_categories(name),
                    person:people(name)
                `)
                .eq('tenant_id', tenantId);

            if (startDate) query = query.gte('transaction_date', startDate);
            if (endDate) query = query.lte('transaction_date', endDate);

            const { data, error } = await query.order('transaction_date', { ascending: false });
            if (error) throw error;

            return (data || []).map((item: any) => ({
                id: item.id,
                tenantId: item.tenant_id,
                categoryId: item.category_id,
                categoryName: item.category?.name,
                personId: item.person_id,
                personName: item.person?.name,
                type: item.type,
                amount: Number(item.amount),
                description: item.description,
                transactionDate: item.transaction_date,
                paymentMethod: item.payment_method,
                status: item.status,
                receiptUrl: item.receipt_url,
                createdAt: item.created_at
            })) as FinancialTransaction[];
        },
        createTransaction: async (data: Omit<FinancialTransaction, 'id' | 'createdAt' | 'categoryName' | 'personName'>) => {
            const { data: newTx, error } = await supabase
                .from('financial_transactions')
                .insert([{
                    tenant_id: data.tenantId,
                    category_id: data.categoryId || null,
                    person_id: data.personId || null,
                    type: data.type,
                    amount: data.amount,
                    description: data.description || null,
                    transaction_date: data.transactionDate,
                    payment_method: data.paymentMethod,
                    status: data.status,
                    receipt_url: data.receiptUrl || null
                }])
                .select(`
                    *,
                    category:financial_categories(name),
                    person:people(name)
                `)
                .single();
            if (error) throw error;
            return {
                id: newTx.id,
                tenantId: newTx.tenant_id,
                categoryId: newTx.category_id,
                categoryName: newTx.category?.name,
                personId: newTx.person_id,
                personName: newTx.person?.name,
                type: newTx.type,
                amount: Number(newTx.amount),
                description: newTx.description,
                transactionDate: newTx.transaction_date,
                paymentMethod: newTx.payment_method,
                status: newTx.status,
                receiptUrl: newTx.receipt_url,
                createdAt: newTx.created_at
            } as FinancialTransaction;
        },
        deleteTransaction: async (id: string) => {
            const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
            if (error) throw error;
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
