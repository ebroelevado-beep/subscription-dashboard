export const runtime = "nodejs";

import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// ── Helper: strip locale prefix from pathname ──
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue; // default has no prefix
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // ── 1. Skip i18n for API routes ──
  if (pathname.startsWith("/api")) {
    const isLoggedIn = !!req.auth;
    if (!pathname.startsWith("/api/auth") && !isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── 2. Run i18n middleware (locale detection, rewriting) ──
  const intlResponse = intlMiddleware(req as unknown as NextRequest);

  // ── 3. Auth checks on the locale-stripped path ──
  const isLoggedIn = !!req.auth;
  const cleanPath = stripLocale(pathname);

  // Protect dashboard routes
  if (cleanPath.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect logged-in users away from login/signup/landing
  if (
    (cleanPath === "/" || cleanPath === "/login" || cleanPath === "/signup") &&
    isLoggedIn
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return intlResponse;
});

export const config = {
  // Match everything except api, _next, _vercel, and files with dots (assets)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
