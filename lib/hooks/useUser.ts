import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-browser';
import { UserProfile } from '@/lib/types';

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data as UserProfile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        async function initializeAuth() {
            try {
                // Get initial session
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error) throw error;

                const initialUser = user ?? null;
                setUser(initialUser);

                if (initialUser) {
                    await fetchProfile(initialUser.id);
                } else {
                    setLoading(false);
                }

                // Listen for auth changes
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        const currentUser = session?.user ?? null;
                        setUser(currentUser);

                        if (currentUser) {
                            await fetchProfile(currentUser.id);
                        } else {
                            setProfile(null);
                            setLoading(false);
                        }
                    }
                );

                return () => {
                    subscription.unsubscribe();
                };
            } catch (error) {
                console.error('Error initializing auth:', error);
                setLoading(false);
            }
        }

        initializeAuth();
    }, [fetchProfile]);

    return {
        user,
        profile,
        loading,
        isAuthenticated: !!user,
    };
}
