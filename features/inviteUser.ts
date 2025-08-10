export interface InviteUserResult {
    success: boolean;
    message: string;
}

export const inviteUserToTeam = async (teamId: number, email: string): Promise<InviteUserResult> => {
    const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    let data: any = null;
    try {
        data = await response.json();
    } catch (error) {
        // Ignore JSON parse errors and use default messages
    }

    if (!response.ok) {
        const message = data?.error || data?.message || 'Failed to send invitation';
        return { success: false, message };
    }

    const message = data?.message || 'Invitation sent successfully';
    return { success: true, message };
}