"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4",
];

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="size-3 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="font-semibold">{data.name}</span>
      </div>
      <p className="text-muted-foreground">
        Weight: <span className="font-medium text-foreground">{data.value}%</span>
      </p>
    </div>
  );
}

export interface PieDataPoint {
  name: string;
  value: number;
}

export default function ClientPieChart({ data }: { data: PieDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<PieTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
