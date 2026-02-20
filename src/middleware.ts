import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const intlMiddleware = createIntlMiddleware(routing);

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // The 'auth' wrapper from next-auth v5 handles redirects automatically
  // if 'authorized' returns false in auth.config.ts.
  // We just need to ensure the intl middleware runs for the resulting request.
  return intlMiddleware(req);
});



export const config = {
  // Match everything except api, _next, _vercel, and files with dots (assets)
  // Ensure we do NOT intercept /api/auth routes because NextAuth needs them
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
