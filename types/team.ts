export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    user?: {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface Team {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
    members: TeamMember[];
}

export interface TeamInvitation {
    id: string;
    team_id: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
    status: 'pending' | 'accepted' | 'rejected';
    invited_at: string | null;
    expires_at: string | null;
    token: string | null;
    team?: {
        id: string;
        name: string;
        description: string | null;
    };
}