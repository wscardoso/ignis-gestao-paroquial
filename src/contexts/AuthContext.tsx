import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface UserProfile {
    id: string;
    full_name: string;
    role: 'super_admin' | 'matriz_admin' | 'comunidade_lead' | 'fiel';
    tenant_id?: string;
    sub_tenant_id?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signIn: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    devBypass?: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log('AuthProvider: Rendering...');
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log('AuthProvider: useEffect starting...');
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) console.error('AuthProvider: getSession error', error);
            else console.log('AuthProvider: Session retrieved', session);

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            setIsLoading(false);
        });

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('AuthProvider: Auth state change', _event, session);
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!error && data) {
            setProfile(data as UserProfile);
        }
    };

    const signIn = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const devBypass = async (email: string) => {
        console.warn('AUTH_BYPASS: Logging in as dev user...', email);
        const { data: tenantData } = await supabase.from('tenants').select('id').limit(1).single();
        const { data: profileData } = await supabase.from('profiles').select('*').limit(1).single();

        const mockUser = { id: profileData?.id || 'dev-id', email } as any;
        setUser(mockUser);
        const baseProfile = profileData || {
            id: 'dev-id',
            full_name: 'Dev Admin',
            role: 'super_admin'
        };

        if (!baseProfile.tenant_id && tenantData) {
            baseProfile.tenant_id = tenantData.id;
        }

        setProfile(baseProfile as UserProfile);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, signIn, signOut, devBypass }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
