'use client'

import { TeamInvitation } from '@/lib/types'
import { acceptInvitation, rejectInvitation } from './actions'
import { useState } from 'react'
import { toast } from 'sonner'

interface InvitationViewProps {
  invitation: TeamInvitation & { team: { name: string } }
}

export default function InvitationView({ invitation }: InvitationViewProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const handleAccept = async () => {
    try {
      setIsAccepting(true)
      await acceptInvitation(invitation.id)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation')
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsRejecting(true)
      await rejectInvitation(invitation.id)
    } catch (error) {
      console.error('Error rejecting invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject invitation')
      setIsRejecting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Team Invitation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited to join {invitation.team.name}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Team
                </label>
                <p className="mt-1 text-sm text-gray-900">{invitation.team.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <p className="mt-1 text-sm text-gray-900">{invitation.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <p className="mt-1 text-sm text-gray-900">{invitation.status}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="flex-1 justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </button>
            <button
              onClick={handleReject}
              disabled={isAccepting || isRejecting}
              className="flex-1 justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
            >
              {isRejecting ? 'Rejecting...' : 'Reject Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 