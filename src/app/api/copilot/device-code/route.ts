import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const COPILOT_CLIENT_ID = '01ab8ac9400c4e429b23';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const response = await fetch('https://github.com/login/device/code', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: COPILOT_CLIENT_ID,
        scope: 'read:user'
      }),
      // Using no-store so Next.js doesn't cache the device code
      cache: 'no-store'
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching device code:', error);
    return NextResponse.json({ error: 'Failed to fetch device code' }, { status: 500 });
  }
}
