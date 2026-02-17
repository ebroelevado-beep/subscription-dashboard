import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pearfect S.L. — Professional Subscription Management",
  description:
    "Manage platforms, plans, seats, and client renewals from a single dashboard. Track profitability automatically.",
  metadataBase: new URL("https://sub.peramato.dev"),
  openGraph: {
    title: "Pearfect S.L. — Professional Subscription Management",
    description:
      "Manage platforms, plans, seats, and client renewals from a single dashboard.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
