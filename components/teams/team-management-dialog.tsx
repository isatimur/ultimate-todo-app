import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Team } from '@/types/team';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    UserPlus,
    Shield,
    ShieldCheck,
    Crown,
    Clock,
    UserX,
    Settings,
    Users,
    Mail,
    MailCheck,
    MailX,
    UserPlus2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { formatDateWithFallback } from '@/lib/utils';

interface TeamManagementDialogProps {
    team: Team;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInviteMember: (teamId: string, email: string, role: string) => Promise<void>;
    onRemoveMember: (teamId: string, userId: string) => Promise<void>;
    currentUser: { id: string; email: string };
    pendingInvitations: {
        id: string;
        email: string;
        role: string;
        status: string;
        invited_at: string;
        expires_at: string;
    }[];
    onCancelInvitation: (invitationId: string) => Promise<void>;
    onResendInvitation: (invitationId: string) => Promise<void>;
}

export default function TeamManagementDialog({
    team,
    open,
    onOpenChange,
    onInviteMember,
    onRemoveMember,
    currentUser,
    pendingInvitations,
    onCancelInvitation,
    onResendInvitation
}: TeamManagementDialogProps) {
    const [activeTab, setActiveTab] = useState('members');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [isLoading, setIsLoading] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onInviteMember(team.id, email, role);
            setEmail('');
            setRole('member');
        } finally {
            setIsLoading(false);
        }
    };

    const isOwner = team.owner_id === currentUser.id;
    const currentUserRole = team.members.find(m => m.user_id === currentUser.id)?.role;
    const canManageMembers = isOwner || currentUserRole === 'admin';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Team Settings
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="members" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Members
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="flex items-center gap-2">
                            <UserPlus2 className="h-4 w-4" />
                            Pending
                            {pendingInvitations.length > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {pendingInvitations.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="invite" className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Invite
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>
                                    Manage your team members and their roles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-4">
                                        {team.members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage
                                                            src={member.profiles?.avatar_url || ''}
                                                            alt={member.profiles?.full_name || member.profiles?.email}
                                                        />
                                                        <AvatarFallback>
                                                            {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {member.profiles?.full_name || member.profiles?.email}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant={member.role === 'owner' ? 'default' : 'secondary'}
                                                                className="flex items-center gap-1"
                                                            >
                                                                {member.role === 'owner' && <Crown className="h-3 w-3" />}
                                                                {member.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                                                                {member.role === 'member' && <Shield className="h-3 w-3" />}
                                                                {member.role}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground flex items-center">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                Joined {formatDateWithFallback(member.joined_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {canManageMembers && member.user_id !== currentUser.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onRemoveMember(team.id, member.user_id)}
                                                    >
                                                        <UserX className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="pending">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Invitations</CardTitle>
                                <CardDescription>
                                    Manage pending team invitations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-4">
                                        {pendingInvitations.length === 0 ? (
                                            <div className="text-center text-muted-foreground py-8">
                                                <UserPlus2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p>No pending invitations</p>
                                            </div>
                                        ) : (
                                            pendingInvitations.map((invitation) => (
                                                <div
                                                    key={invitation.id}
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>
                                                                {invitation.email[0].toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">{invitation.email}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="secondary">
                                                                    {invitation.role}
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground flex items-center">
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    Invited {formatDateWithFallback(invitation.invited_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onResendInvitation(invitation.id)}
                                                        >
                                                            <MailCheck className="h-4 w-4 text-green-500" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => onCancelInvitation(invitation.id)}
                                                        >
                                                            <MailX className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="invite">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invite Members</CardTitle>
                                <CardDescription>
                                    Invite new members to join your team
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleInvite} className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <Input
                                                    type="email"
                                                    placeholder="Email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className="w-full"
                                                />
                                            </div>
                                            <Select
                                                value={role}
                                                onValueChange={setRole}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    {isOwner && (
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        <Mail className="h-4 w-4 mr-2" />
                                        {isLoading ? 'Sending invitation...' : 'Send Invitation'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
} 