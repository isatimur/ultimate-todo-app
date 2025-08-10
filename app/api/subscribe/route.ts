import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const subscription = await req.json();

  // In a real application you would store the subscription in your database
  console.log('Received push subscription', subscription);

  return NextResponse.json({ received: true });
}
