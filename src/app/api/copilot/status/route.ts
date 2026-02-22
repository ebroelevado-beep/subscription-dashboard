import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { copilotToken: true }
    });

    return NextResponse.json({
      hasToken: !!user?.copilotToken
    });
  } catch (error) {
    console.error('Error checking Copilot status:', error);
    return NextResponse.json({ error: 'Failed to verify status' }, { status: 500 });
  }
}
