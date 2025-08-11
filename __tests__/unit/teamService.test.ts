import { fetchUserTeams, fetchTeamMembers, fetchPendingInvitations } from '@/lib/server/teamService'

const createSupabaseMock = (responses: any) => {
  return {
    rpc: jest.fn().mockResolvedValue(responses.rpc),
    from: jest.fn((table: string) => {
      const tableResponses = responses.from[table]
      return {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue(tableResponses.in),
        eq: jest.fn(function (this: any) {
          if (!this._eqCalls) this._eqCalls = 0
          this._eqCalls++
          if (this._eqCalls === 2) {
            return Promise.resolve(tableResponses.eq)
          }
          return this
        }),
      }
    }),
  } as any
}

describe('teamService', () => {
  it('fetchUserTeams returns teams with roles', async () => {
    const supabase = createSupabaseMock({
      rpc: { data: [{ team_id: '1', team_role: 'owner' }], error: null },
      from: {
        teams: {
          in: {
            data: [
              {
                id: '1',
                name: 'Team 1',
                description: null,
                created_at: '',
                updated_at: '',
              },
            ],
            error: null,
          },
        },
      },
    })

    const teams = await fetchUserTeams(supabase, 'user1')
    expect(teams).toEqual([
      {
        id: '1',
        name: 'Team 1',
        description: null,
        created_at: '',
        updated_at: '',
        members: [],
        role: 'owner',
      },
    ])
  })

  it('fetchTeamMembers groups members by team', async () => {
    const supabase = createSupabaseMock({
      from: {
        team_members: {
          in: {
            data: [
              {
                id: 'm1',
                team_id: '1',
                role: 'member',
                joined_at: '2024-01-01',
                user: {
                  id: 'u1',
                  email: 'a@b.com',
                  full_name: 'A',
                  avatar_url: null,
                },
              },
            ],
            error: null,
          },
        },
      },
    })

    const members = await fetchTeamMembers(supabase, ['1'])
    expect(members).toEqual({
      '1': [
        {
          id: 'm1',
          team_id: '1',
          user_id: 'u1',
          role: 'member',
          joined_at: '2024-01-01',
          user: {
            id: 'u1',
            email: 'a@b.com',
            full_name: 'A',
            avatar_url: null,
          },
        },
      ],
    })
  })

  it('fetchPendingInvitations returns processed invitations', async () => {
    const supabase = createSupabaseMock({
      from: {
        team_invitations: {
          eq: {
            data: [
              {
                id: 'i1',
                team_id: '1',
                email: 'a@b.com',
                role: 'member',
                status: 'pending',
                invited_at: null,
                expires_at: null,
                token: 't',
                team: { id: '1', name: 'Team 1', description: null },
              },
            ],
            error: null,
          },
        },
      },
    })

    const invitations = await fetchPendingInvitations(supabase, 'a@b.com')
    expect(invitations).toEqual([
      {
        id: 'i1',
        team_id: '1',
        email: 'a@b.com',
        role: 'member',
        status: 'pending',
        invited_at: null,
        expires_at: null,
        token: 't',
        team: { id: '1', name: 'Team 1', description: null },
      },
    ])
  })
})

