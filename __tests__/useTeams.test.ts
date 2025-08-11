/// <reference types="vitest" />
import { renderHook, act } from '@testing-library/react';
import { useTeams } from '../components/teams/useTeams';
import { Team, TeamInvitation } from '../types/team';
import { vi, describe, it, expect, beforeEach } from 'vitest';

global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let supabaseMock: any;
vi.mock('../lib/supabase-browser', () => ({
  createClient: () => supabaseMock,
}));

describe('useTeams hook', () => {
  const baseOptions = {
    userId: 'user1',
    userEmail: 'test@example.com',
    initialTeams: [] as Team[],
    initialInvitations: [] as TeamInvitation[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a team', async () => {
    const newTeam = {
      id: 'team1',
      name: 'New Team',
      description: 'desc',
      owner_id: 'user1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };
    supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'teams') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newTeam, error: null }),
              }),
            }),
          };
        }
        if (table === 'team_members') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn(),
          };
        }
        return {};
      }),
    };

    const { result } = renderHook(() => useTeams(baseOptions));

    await act(async () => {
      await result.current.handleCreateTeam('New Team', 'desc');
    });

    expect(result.current.teams.length).toBe(1);
    expect(result.current.teams[0].name).toBe('New Team');
  });

  it('handles invitation rejection', async () => {
    const invitation: TeamInvitation = {
      id: 'inv1',
      team_id: 'team1',
      email: 'user@example.com',
      role: 'member',
      status: 'pending',
      invited_at: '2024-01-01',
      expires_at: null,
      token: null,
    };
    supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'team_invitations') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
      rpc: vi.fn(),
    };

    const { result } = renderHook(() =>
      useTeams({ ...baseOptions, initialInvitations: [invitation] })
    );

    await act(async () => {
      await result.current.handleInvitationResponse(invitation, false);
    });

    expect(result.current.invitations.length).toBe(0);
  });

  it('removes a member', async () => {
    const team: Team = {
      id: 'team1',
      name: 'Team',
      description: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      members: [
        {
          id: 'm1',
          team_id: 'team1',
          user_id: 'user1',
          role: 'owner',
          joined_at: '2024-01-01',
          user: undefined,
        },
      ],
    };

    supabaseMock = {
      from: vi.fn((table: string) => {
        if (table === 'team_members') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi
                .fn()
                .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            }),
          };
        }
        return {};
      }),
    };

    const { result } = renderHook(() =>
      useTeams({ ...baseOptions, initialTeams: [team] })
    );

    await act(async () => {
      await result.current.handleRemoveMember('team1', 'user1');
    });

    expect(result.current.teams[0].members.length).toBe(0);
  });
});
