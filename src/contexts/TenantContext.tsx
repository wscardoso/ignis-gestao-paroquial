import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

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
    setTenant: (tenant: Tenant) => void;
    setSubTenant: (subTenant: SubTenant | null) => void;
    updateTenantModules: (modules: string[]) => Promise<void>;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
    const [activeSubTenant, setActiveSubTenant] = useState<SubTenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch the main tenant (For MVP we pick the first one, or based on subdomain later)
    useEffect(() => {
        const initTenant = async () => {
            try {
                // Optional session check - helpful for logs but don't block for bypass
                const { data: sessionData } = await supabase.auth.getSession();
                console.log('TenantContext: Session check', !!sessionData?.session);

                const { data, error } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('status', 'active')
                    .limit(1)
                    .single();

                if (error) {
                    console.error('Error fetching tenant:', error);

                    // Check if it's a JWT/auth error
                    if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
                        console.error('JWT expired or invalid - logging out');
                        await supabase.auth.signOut();
                        setIsLoading(false);
                        return;
                    }
                }

                if (data) {
                    console.log('Tenant loaded:', data);
                    setActiveTenant(data as Tenant);

                    // Also check for sub-tenants to ensure grid can work
                    const { data: subData } = await supabase
                        .from('sub_tenants')
                        .select('*')
                        .eq('tenant_id', data.id)
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
                    }
                }
            } catch (err) {
                console.error('Unexpected error loading tenant:', err);
            } finally {
                setIsLoading(false);
            }
        };
        initTenant();
    }, []);

    const setTenant = (tenant: Tenant) => {
        setActiveTenant(tenant);
        setActiveSubTenant(null); // Reset sub-tenant when switching main tenant
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
            setTenant,
            setSubTenant: setActiveSubTenant,
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
