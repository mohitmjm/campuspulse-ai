"use client";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const C = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
};
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" };
const axis = { stroke: C.muted, fontSize: 11, tickLine: false, axisLine: false };

export function TrendChart({ data }: { data: { day: string; count: number; target: number; cumulative: number | null; cumulativeTarget: number }[] }) {
  return (
    <div className="h-64 lg:h-[420px]" role="img" aria-label="Daily registrations against daily and cumulative targets">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} vertical={false} />
          <XAxis dataKey="day" {...axis} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="cumulativeTarget" name="Cumulative target" stroke={C.muted} strokeDasharray="4 4" fill="transparent" />
          <Line type="monotone" dataKey="cumulative" name="Cumulative actual" stroke={C.primary} strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
          <Bar dataKey="count" name="Daily registrations" fill={C.accent} radius={[4, 4, 0, 0]} barSize={18} />
          <Line type="step" dataKey="target" name="Daily target" stroke={C.accent} strokeOpacity={0.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlanVsActualChart({ data }: { data: { name: string; actual: number; expected: number }[] }) {
  return (
    <div className="h-56" role="img" aria-label="Registrations by plan channel versus expected to date">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={C.grid} horizontal={false} />
          <XAxis type="number" {...axis} />
          <YAxis type="category" dataKey="name" width={110} {...axis} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="expected" name="Expected to date" fill={C.muted} fillOpacity={0.35} radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="actual" name="Actual" fill={C.primary} radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
