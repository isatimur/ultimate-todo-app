'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-browser';
import { IconUpload } from '@tabler/icons-react';
import { Profile as ProfileType } from '@/lib/database.types';
interface ProfileProps {
    user: User | null;
}



export default function Profile({ user }: ProfileProps) {
    const [profile, setProfile] = useState<ProfileType>({} as ProfileType);
    const [loading, setLoading] = useState(true);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
            }
        }
        setLoading(false);
    }

    async function uploadAvatar() {
        if (!avatarFile) return;

        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}/avatar.${fileExt}`;
        const filePath = fileName;

        let { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
            toast.error('Error uploading avatar');
            return;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', profile.id);

        if (error) {
            toast.error('Error updating profile');
        } else {
            setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));
            toast.success('Avatar updated successfully');
        }
    }

    async function updateProfile() {
        const { error } = await supabase
            .from('profiles')
            .update(profile)
            .eq('id', profile.id);

        if (error) {
            toast.error('Error updating profile');
        } else {
            toast.success('Profile updated successfully');
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAvatarFile(file);
                    }}
                />
                <Button onClick={uploadAvatar}>Upload Avatar</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Full Name"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                />
                <Input
                    placeholder="Username"
                    value={profile.username || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                />
            </div>

            <Textarea
                placeholder="Bio"
                value={profile.bio || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Job Title"
                    value={profile.job_title || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, job_title: e.target.value }))}
                />
                <Input
                    placeholder="Company"
                    value={profile.company || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                    placeholder="Location"
                    value={profile.location || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                />
                <Input
                    placeholder="Website"
                    value={profile.website || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                />
            </div>

            <Button onClick={updateProfile} className="w-full">
                Save Profile
            </Button>
        </div>
    );
}