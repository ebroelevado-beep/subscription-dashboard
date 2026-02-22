import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

const COPILOT_CLIENT_ID = '01ab8ac9400c4e429b23';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { device_code } = await req.json();

    if (!device_code) {
      return NextResponse.json({ error: 'Missing device_code' }, { status: 400 });
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: COPILOT_CLIENT_ID,
        device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (data.access_token) {
      // Save the token to the user
      await prisma.user.update({
        where: { id: session.user.id },
        data: { copilotToken: data.access_token }
      });
      return NextResponse.json({ success: true });
    } else if (data.error === 'authorization_pending') {
      return NextResponse.json({ pending: true });
    } else {
      // other errors like 'expired_token', 'access_denied', etc.
      return NextResponse.json({ error: data.error_description || data.error }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error polling for copilot token:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
