import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface Tenant {
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

interface SubTenant {
    id: string;
    name: string;
    tenantId: string;
    status: 'active' | 'inactive';
    address: string;
}

interface TenantContextType {
    activeTenant: Tenant | null;
    activeSubTenant: SubTenant | null;
    allTenants: Tenant[];
    setTenant: (tenant: Tenant) => void;
    setSubTenant: (subTenant: SubTenant | null) => void;
    switchTenant: (tenantId: string) => void;
    updateTenantModules: (modules: string[]) => Promise<void>;
    isLoading: boolean;
}

const STORAGE_KEY = 'ignis_selected_tenant_id';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, isLoading: authLoading } = useAuth();
    const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
    const [activeSubTenant, setActiveSubTenant] = useState<SubTenant | null>(null);
    const [allTenants, setAllTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSubTenant = async (tenantId: string) => {
        const { data: subData } = await supabase
            .from('sub_tenants')
            .select('*')
            .eq('tenant_id', tenantId)
            .limit(1);

        if (subData && subData.length > 0) {
            const s = subData[0];
            setActiveSubTenant({
                id: s.id,
                tenantId: s.tenant_id,
                name: s.name,
                status: 'active',
                address: s.address || ''
            });
        } else {
            setActiveSubTenant(null);
        }
    };

    useEffect(() => {
        if (authLoading) return;

        if (!session) {
            setActiveTenant(null);
            setActiveSubTenant(null);
            setAllTenants([]);
            setIsLoading(false);
            return;
        }

        const initTenant = async () => {
            try {
                // Load all active tenants
                const { data: tenantsData, error } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('status', 'active')
                    .order('name');

                if (error) {
                    console.error('Error fetching tenants:', error);
                    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
                        await supabase.auth.signOut();
                        setIsLoading(false);
                        return;
                    }
                }

                const tenants = (tenantsData || []) as Tenant[];
                setAllTenants(tenants);

                if (tenants.length > 0) {
                    // Check localStorage for saved selection
                    const savedId = localStorage.getItem(STORAGE_KEY);
                    const savedTenant = savedId ? tenants.find(t => t.id === savedId) : null;
                    const selected = savedTenant || tenants[0];

                    setActiveTenant(selected);
                    localStorage.setItem(STORAGE_KEY, selected.id);
                    await loadSubTenant(selected.id);
                }
            } catch (err) {
                console.error('Unexpected error loading tenant:', err);
            } finally {
                setIsLoading(false);
            }
        };
        initTenant();
    }, [session, authLoading]);

    const switchTenant = (tenantId: string) => {
        const tenant = allTenants.find(t => t.id === tenantId);
        if (tenant) {
            setActiveTenant(tenant);
            setActiveSubTenant(null);
            localStorage.setItem(STORAGE_KEY, tenant.id);
            loadSubTenant(tenant.id);
        }
    };

    const setTenant = (tenant: Tenant) => {
        setActiveTenant(tenant);
        setActiveSubTenant(null);
        localStorage.setItem(STORAGE_KEY, tenant.id);
    };

    const updateTenantModules = async (modules: string[]) => {
        if (!activeTenant) return;

        try {
            const { error } = await supabase
                .from('tenants')
                .update({ active_modules: modules })
                .eq('id', activeTenant.id);

            if (error) throw error;

            setActiveTenant({ ...activeTenant, active_modules: modules });
        } catch (error) {
            console.error('Error updating tenant modules:', error);
            throw error;
        }
    };

    return (
        <TenantContext.Provider value={{
            activeTenant,
            activeSubTenant,
            allTenants,
            setTenant,
            setSubTenant: setActiveSubTenant,
            switchTenant,
            updateTenantModules,
            isLoading
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
