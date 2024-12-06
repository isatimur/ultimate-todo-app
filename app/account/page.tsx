'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-browser';
import {
    IconUser,
    IconLock,
    IconTrash,
    IconDownload,
    IconShield
} from '@tabler/icons-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function AccountPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    useEffect(() => {
        async function loadUserData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserData(prev => ({ ...prev, email: user.email || '' }));
            }
        }
        loadUserData();
    }, []);

    const handlePasswordChange = async () => {
        try {
            setLoading(true);
            if (userData.newPassword !== userData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            const { error } = await supabase.auth.updateUser({
                password: userData.newPassword
            });

            if (error) throw error;
            toast.success('Password updated successfully');
            setUserData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleAccountDeletion = async () => {
        try {
            setLoading(true);
            if (deleteConfirmation !== 'DELETE') {
                throw new Error('Please type DELETE to confirm');
            }

            const { error } = await supabase.rpc('delete_user_account');
            if (error) throw error;

            await supabase.auth.signOut();
            router.push('/signin');
            toast.success('Account deleted successfully');
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-4xl py-8">
            <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

            <div className="space-y-6">
                {/* Account Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconUser className="h-5 w-5" />
                            Account Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input value={userData.email} disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconLock className="h-5 w-5" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={userData.newPassword}
                                onChange={(e) => setUserData({ ...userData, newPassword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                value={userData.confirmPassword}
                                onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={handlePasswordChange}
                            disabled={loading || !userData.newPassword}
                        >
                            Update Password
                        </Button>
                    </CardContent>
                </Card>

                {/* Data & Privacy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconShield className="h-5 w-5" />
                            Data & Privacy
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => {/* Implement data export */ }}
                        >
                            <IconDownload className="h-4 w-4 mr-2" />
                            Export My Data
                        </Button>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    <IconTrash className="h-4 w-4 mr-2" />
                                    Delete Account
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Account</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <Label>
                                        Type DELETE to confirm
                                    </Label>
                                    <Input
                                        value={deleteConfirmation}
                                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="destructive"
                                        onClick={handleAccountDeletion}
                                        disabled={loading || deleteConfirmation !== 'DELETE'}
                                    >
                                        Delete Account
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}