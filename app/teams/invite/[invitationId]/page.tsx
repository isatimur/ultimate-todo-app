import { getInvitation } from './actions'
import InvitationView from './invitation-view'

export const dynamic = 'force-dynamic'

// This helps Next.js understand the structure of the params
export async function generateStaticParams() {
  return []
}

export default async function InvitationPage(props: any) {
  const invitationId = props.params.invitationId;
  const invitation = await getInvitation(invitationId)
  return <InvitationView invitation={invitation} />
}