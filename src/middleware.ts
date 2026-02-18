import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createIntlMiddleware(routing);

export const config = {
  // Match everything except api, _next, _vercel, and files with dots (assets)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
