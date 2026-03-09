import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { increment } = await req.json();
    if (typeof increment !== "number") {
      return NextResponse.json({ error: "Invalid increment value" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        usageCredits: {
          increment: increment,
        },
      },
      select: {
        usageCredits: true,
      },
    });

    return NextResponse.json({ usageCredits: updatedUser.usageCredits });
  } catch (error) {
    console.error("Error updating usage credits:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
