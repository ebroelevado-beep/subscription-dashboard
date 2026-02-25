import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currency } = await req.json();

  if (!currency || !['EUR', 'USD', 'GBP', 'CNY'].includes(currency)) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }

  try {
    const user = await (prisma.user as any).update({
      where: { id: session.user.id },
      data: { currency },
    });

    return NextResponse.json({ 
      ok: true, 
      data: {
        success: true, 
        currency: (user as any).currency 
      }
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Failed to update settings" 
    }, { status: 500 });
  }
}
