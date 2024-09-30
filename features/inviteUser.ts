
export const inviteUserToTeam = async (teamId: number, email: string) => {
    const response = await fetch(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });
}