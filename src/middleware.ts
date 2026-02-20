import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const intlMiddleware = createIntlMiddleware(routing);

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const isDashboardPage = nextUrl.pathname.match(/^\/(en|es|zh)\/dashboard/);

  // If trying to access dashboard without auth, redirect to landing
  if (!isAuthenticated && isDashboardPage) {
    const landingUrl = new URL("/", req.url);
    const localeMatch = nextUrl.pathname.match(/^\/(en|es|zh)/);
    if (localeMatch) {
      landingUrl.pathname = `/${localeMatch[1]}/login`;
    }
    return Response.redirect(landingUrl);
  }

  // Otherwise, proceed with intl middleware
  return intlMiddleware(req);
});

export const config = {
  // Match everything except api, _next, _vercel, and files with dots (assets)
  // Ensure we do NOT intercept /api/auth routes because NextAuth needs them
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
