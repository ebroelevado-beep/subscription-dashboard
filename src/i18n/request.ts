import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Europe/Madrid",
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
      },
      number: {
        currency: { style: "currency", currency: "EUR" },
      },
    },
  };
});
