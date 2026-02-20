import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware(routing);

const { auth } = NextAuth(authConfig);

const publicPages = ["/", "/login", "/signup"];

export default auth((req) => {
  const isAuth = !!req.auth;
  const isPublicPage = publicPages.some(
    (page) =>
      req.nextUrl.pathname === page ||
      req.nextUrl.pathname.startsWith(`/en${page}`) ||
      req.nextUrl.pathname.startsWith(`/es${page}`) ||
      req.nextUrl.pathname.startsWith(`/zh${page}`)
  );

  // If the user is trying to access a protected route (e.g., /dashboard) and is NOT authenticated
  if (!isPublicPage && !isAuth) {
    const url = req.nextUrl.clone();
    
    // Check if the current path already has a locale
    const currentLocale = routing.locales.find(locale => 
      req.nextUrl.pathname.startsWith(`/${locale}/`) || req.nextUrl.pathname === `/${locale}`
    );

    // If it has a locale, redirect to the localized login page
    if (currentLocale) {
      url.pathname = `/${currentLocale}/login`;
    } else {
      // Otherwise, redirect to root login, let next-intl handle the prefixing later
      url.pathname = '/login';
    }
    return NextResponse.redirect(url);
  }

  // Pass everything else to next-intl to handle the actual routing, prefixing, and locale negotiation
  return intlMiddleware(req);
});

export const config = {
  // This matcher strictly ignores Next.js internals and API routes to avoid unnecessary middleware execution
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
  ]
};

