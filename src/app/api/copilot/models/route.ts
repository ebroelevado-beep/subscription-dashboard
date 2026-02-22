import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { copilotToken: true },
    });

    if (!user?.copilotToken) {
      return new Response(JSON.stringify({ error: "No connection token" }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const tokenRes = await fetch("https://api.github.com/copilot_internal/v2/token", {
      headers: { Authorization: `token ${user.copilotToken}` },
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to exchange internal token" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const { token } = await tokenRes.json();

    const modelsRes = await fetch("https://api.githubcopilot.com/models", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Editor-Version": "vscode/1.85.1",
        "Copilot-Integration-Id": "vscode-chat",
      },
      cache: "no-store",
    });

    if (!modelsRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch models from Copilot" }), { status: modelsRes.status, headers: { "Content-Type": "application/json" } });
    }

    const modelsData = await modelsRes.json();
    return new Response(JSON.stringify(modelsData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Models fetch error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
