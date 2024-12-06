export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profiles: {
        email: string;
        full_name: string;
        avatar_url: string | null;
    };
}

export interface Team {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string | null;
    updated_at: string | null;
    members: TeamMember[];
}