import { getInvitation } from './actions'
import InvitationView from './invitation-view'

export const dynamic = 'force-dynamic'

export default async function InvitationPage({
  params,
}: {
  params: { invitationId: string }
}) {
  const invitation = await getInvitation(params.invitationId)
  return <InvitationView invitation={invitation} />
}