import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface UserProfile {
    id: string;
    full_name: string;
    role: 'super_admin' | 'matriz_admin' | 'comunidade_lead' | 'fiel';
    tenant_id?: string;
    sub_tenant_id?: string;
    avatar_url?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    signIn: (email: string) => Promise<void>;
    signInWithPassword: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isRecoveringPassword: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log('AuthProvider: Rendering...');
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

    useEffect(() => {
        console.log('AuthProvider: useEffect starting...');
        // Initial Session Check
        const initSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) console.error('AuthProvider: getSession error', error);
            else console.log('AuthProvider: Session retrieved', session);

            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            }
            setIsLoading(false);
        };
        initSession();

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('AuthProvider: Auth state change', event, session);
            setSession(session);
            setUser(session?.user ?? null);

            if (event === 'PASSWORD_RECOVERY') {
                setIsRecoveringPassword(true);
            } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                setIsRecoveringPassword(false);
            }

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

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        });
        if (error) throw error;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, signIn, signInWithPassword, signUp, signOut, refreshProfile, resetPassword, isRecoveringPassword }}>
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
