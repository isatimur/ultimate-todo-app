import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TeamManager from '@/components/teams/TeamManager'
import { inviteUserToTeam } from '@/features/inviteUser'
import { vi } from 'vitest'

vi.mock('@/features/inviteUser', () => ({
  inviteUserToTeam: vi.fn(),
}))

describe('Team Collaboration', () => {
  it('invites a new team member', () => {
    render(<TeamManager teamId={1} />)

    fireEvent.click(screen.getByText('Add Member'))
    const input = screen.getByPlaceholderText("User's Email")
    fireEvent.change(input, { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByText('Send Invitation'))

    expect(inviteUserToTeam).toHaveBeenCalledWith(1, 'user@example.com')
  })
})
