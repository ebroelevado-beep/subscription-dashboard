import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { type NextRequest } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

const publicPages = ["/", "/login", "/signup"];

export default async function middleware(req: NextRequest) {
  const isPublicPage = publicPages.some(
    (page) =>
      req.nextUrl.pathname === page ||
      req.nextUrl.pathname.startsWith(`/en${page}`) ||
      req.nextUrl.pathname.startsWith(`/es${page}`) ||
      req.nextUrl.pathname.startsWith(`/zh${page}`)
  );

  // If it's a public page, return `intlMiddleware` IMMEDIATELY.
  // Do NOT pass it to `auth(...)` wrapper.
  // NextAuth automatically issues a 307 redirect from HTTP to HTTPS if it detects
  // useSecureCookies=true but sees an incoming `http:` protocol (which happens behind Dokploy).
  // This causes infinite redirect loops on public pages.
  if (isPublicPage) {
    return intlMiddleware(req);
  }

  // Handle protected pages with the NextAuth wrapper.
  return auth((req) => {
    // Inside the wrapped request, NextAuth's `authorized` callback will enforce session rules.
    // If authenticated, we just pass the request to next-intl for routing.
    return intlMiddleware(req);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })(req, {} as any);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
