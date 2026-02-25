export type Currency = 'EUR' | 'USD' | 'GBP' | 'CNY';

export const CURRENCIES: Record<Currency, { symbol: string, label: string }> = {
  EUR: { symbol: '€', label: 'Euro (€)' },
  USD: { symbol: '$', label: 'Dollar ($)' },
  GBP: { symbol: '£', label: 'Pound (£)' },
  CNY: { symbol: '¥', label: 'Yuan (¥)' },
};

export function formatCurrency(amount: number | string, currency: string = 'EUR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const config = (CURRENCIES[currency as Currency] || CURRENCIES.EUR).symbol;
  
  // As per user request: "sin modificar cantidades solo el simbolo"
  // We just prepend or append the symbol depending on preference, 
  // but let's stick to a standard: symbol then amount with 2 decimals
  return `${config}${num.toFixed(2)}`;
}
