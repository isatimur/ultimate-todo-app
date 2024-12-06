'use client';

import {useState, useEffect, useCallback} from 'react';
import {User} from '@supabase/supabase-js';
import {Card, CardContent, CardHeader, CardTitle} from './ui/card';
import {Avatar, AvatarFallback, AvatarImage} from './ui/avatar';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Textarea} from './ui/textarea';
import {toast} from 'sonner';
import {supabase} from '@/lib/supabase-browser';
import {motion} from 'framer-motion';
import {IconBrandGithub, IconBrandLinkedin, IconEdit, IconMail, IconPhone, IconUser, IconUpload, IconBriefcase, IconMapPin, IconWorld} from '@tabler/icons-react';
import {Label} from './ui/label';
import {Separator} from './ui/separator';

interface ProfileProps {
    user: User | null;
}

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    username: string;
    avatar_url: string;
    bio: string;
    location: string;
    website: string;
    job_title: string;
    company: string;
    phone: string;
    date_of_birth: string | null;
    social_links: {
        github?: string;
        linkedin?: string;
    };
    skills: string[];
    privacy_settings: {
        show_email?: boolean;
        show_phone?: boolean;
        profile_visibility?: 'public' | 'private';
    };
}

export default function Profile({user}: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({
        id: user?.id || '',
        email: user?.email || '',
        full_name: '',
        username: '',
        avatar_url: '',
        bio: '',
        location: '',
        website: '',
        job_title: '',
        company: '',
        phone: '',
        date_of_birth: null,
        social_links: {},
        skills: [],
        privacy_settings: {
            show_email: true,
            show_phone: false,
            profile_visibility: 'public'
        }
    });

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = useCallback(async () => {
        try {
            if (!user) return;
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setProfile(data);
            } else {
                const initialProfile: UserProfile = {
                    id: user.id,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || '',
                    username: '',
                    avatar_url: user.user_metadata?.avatar_url || '',
                    bio: '',
                    location: '',
                    website: '',
                    job_title: '',
                    company: '',
                    phone: '',
                    date_of_birth: null,
                    social_links: {
                        github: '',
                        linkedin: ''
                    },
                    skills: [],
                    privacy_settings: {
                        show_email: true,
                        show_phone: false,
                        profile_visibility: 'public' as const
                    }
                };

                const { error: insertError } = await supabase
                    .from('profiles')
                    .upsert([initialProfile], {
                        onConflict: 'id'
                    });

                if (insertError) {
                    console.error('Error inserting profile:', insertError);
                    throw insertError;
                }

                setProfile(initialProfile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Error fetching profile');
        } finally {
            setLoading(false);
        }
    }, [user]);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            await handleUpdateProfile({
                ...profile,
                avatar_url: publicUrl
            });

            toast.success('Avatar updated successfully');
        } catch (error) {
            toast.error('Error uploading avatar');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async (updatedProfile = profile) => {
        try {
            if (!user?.id) {
                throw new Error('User ID is required');
            }

            const updates = {
                ...updatedProfile,
                id: user?.id,
                email: user?.email || '',
                updated_at: new Date().toISOString(),
                privacy_settings: updatedProfile.privacy_settings || {
                    show_email: true,
                    show_phone: false,
                    profile_visibility: 'public'
                }
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates)
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile updated successfully');
            setIsEditing(false);
            await fetchProfile();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Error updating profile');
        }
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            className="max-w-4xl mx-auto space-y-6 p-6"
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profile</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditing(!isEditing)}
                    >
                        <IconEdit className="h-5 w-5"/>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={profile.avatar_url}/>
                                <AvatarFallback className="text-lg">
                                    {profile.full_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <IconUpload className="h-6 w-6 text-white"/>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={uploadAvatar}
                                        disabled={uploading}
                                    />
                                </label>
                            )}
                        </div>
                        <div className="space-y-4 flex-1">
                            {isEditing ? (
                                <>
                                    <Input
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                                        placeholder="Full Name"
                                    />
                                    <Textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                        placeholder="Tell us about yourself"
                                        className="resize-none"
                                    />
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                                    <p className="text-muted-foreground">{profile.bio}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator/>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label>Contact Information</Label>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <IconMail className="h-5 w-5 text-muted-foreground"/>
                                    <span>{user?.email}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <IconPhone className="h-5 w-5 text-muted-foreground"/>
                                    {isEditing ? (
                                        <Input
                                            value={profile.phone}
                                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                            placeholder="Phone Number"
                                        />
                                    ) : (
                                        <span>{profile.phone || 'Not provided'}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div className="space-y-4">
                            <Label>Professional Details</Label>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <IconBriefcase className="h-5 w-5 text-muted-foreground"/>
                                    {isEditing ? (
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                value={profile.job_title}
                                                onChange={(e) => setProfile({...profile, job_title: e.target.value})}
                                                placeholder="Job Title"
                                            />
                                            <Input
                                                value={profile.company}
                                                onChange={(e) => setProfile({...profile, company: e.target.value})}
                                                placeholder="Company"
                                            />
                                        </div>
                                    ) : (
                                        <span>{profile.job_title} at {profile.company}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator/>

                    {/* Location and Website */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Label>Location</Label>
                            <div className="flex items-center space-x-3">
                                <IconMapPin className="h-5 w-5 text-muted-foreground"/>
                                {isEditing ? (
                                    <Input
                                        value={profile.location}
                                        onChange={(e) => setProfile({...profile, location: e.target.value})}
                                        placeholder="Location"
                                    />
                                ) : (
                                    <span>{profile.location || 'Not provided'}</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label>Website</Label>
                            <div className="flex items-center space-x-3">
                                <IconWorld className="h-5 w-5 text-muted-foreground"/>
                                {isEditing ? (
                                    <Input
                                        value={profile.website}
                                        onChange={(e) => setProfile({...profile, website: e.target.value})}
                                        placeholder="Website URL"
                                    />
                                ) : (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-500 hover:underline">
                                        {profile.website || 'Not provided'}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator/>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <Label>Social Links</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <IconBrandGithub className="h-5 w-5 text-muted-foreground"/>
                                {isEditing ? (
                                    <Input
                                        value={profile.social_links?.github || ''}
                                        onChange={(e) => setProfile({
                                            ...profile,
                                            social_links: {...profile.social_links, github: e.target.value}
                                        })}
                                        placeholder="GitHub Profile URL"
                                    />
                                ) : (
                                    <a href={profile.social_links?.github} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-500 hover:underline">
                                        {profile.social_links?.github || 'Not provided'}
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <IconBrandLinkedin className="h-5 w-5 text-muted-foreground"/>
                                {isEditing ? (
                                    <Input
                                        value={profile.social_links?.linkedin || ''}
                                        onChange={(e) => setProfile({
                                            ...profile,
                                            social_links: {...profile.social_links, linkedin: e.target.value}
                                        })}
                                        placeholder="LinkedIn Profile URL"
                                    />
                                ) : (
                                    <a href={profile.social_links?.linkedin} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-500 hover:underline">
                                        {profile.social_links?.linkedin || 'Not provided'}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isEditing && (
                <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={() => handleUpdateProfile()}>Save Changes</Button>
                </div>
            )}
        </motion.div>
    );
}