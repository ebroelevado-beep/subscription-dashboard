import { getTranslations } from "next-intl/server";
import { ChatInterface } from "@/components/assistant/chat-interface";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("dashboardTitle") }; // we can reuse dashboard for now
}

export default async function AssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -mx-4 lg:-mx-6 -my-4 lg:-my-6">
      <div className="flex-1 overflow-hidden relative border-b bg-background">
        <ChatInterface />
      </div>
    </div>
  );
}
