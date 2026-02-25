"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useSession } from "next-auth/react";
import { CURRENCIES, formatCurrency } from "@/lib/currency";

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

export interface TrendDataPoint {
  period: string;
  revenue: number;
  cost: number;
}

export default function RevenueChart({ data }: { data: TrendDataPoint[] }) {
  const { data: session } = useSession();
  const currency = (session?.user as { currency?: string })?.currency || "EUR";

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickFormatter={(v) => {
            const symbol = (CURRENCIES[currency as keyof typeof CURRENCIES] || CURRENCIES.EUR).symbol;
            return `${symbol}${v}`;
          }}
        />
        <Tooltip content={<ChartTooltip currency={currency} />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#10b981"
          fill="url(#gradRevenue)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="cost"
          name="Cost"
          stroke="#ef4444"
          fill="url(#gradCost)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
