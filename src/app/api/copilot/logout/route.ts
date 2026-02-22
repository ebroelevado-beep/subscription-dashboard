import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { copilotToken: null }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging out from Copilot:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
