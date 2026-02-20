import { differenceInDays, startOfDay } from "date-fns";

export type Lang = "es" | "en" | "zh";

export interface SeatWhatsAppContext {
  customPrice: number;
  activeUntil: string;
  platformName: string;
}

export function buildWhatsAppUrl(
  phone: string,
  name: string,
  seats: SeatWhatsAppContext[],
  lang: Lang,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  const totalPrice = seats.reduce((s, x) => s + x.customPrice, 0);
  const services = [...new Set(seats.map((s) => s.platformName))].join(", ");

  // Use the closest deadline
  const today = startOfDay(new Date());
  const daysArr = seats.map((s) => differenceInDays(startOfDay(new Date(s.activeUntil)), today));
  const minDays = Math.min(...daysArr);

  let daysText: string;
  if (minDays < 0) {
    daysText = t("common.daysOverdue", { count: Math.abs(minDays) });
  } else if (minDays === 0) {
    daysText = t("common.today");
  } else {
    daysText = t("common.daysLeft", { count: minDays });
  }

  const priceStr = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(totalPrice);

  const msg = t("clients.whatsappTemplate", {
    name,
    daysText,
    priceStr,
    services,
  });

  // Clean phone: remove spaces, dashes, ensure starts with +
  const cleanPhone = phone.replace(/[\s-()]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
