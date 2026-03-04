"use client";

import dynamic from "next/dynamic";

export interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  title: string;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  data: Record<string, unknown>[];
}

const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
  { ssr: false }
);
const LineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((m) => m.Line),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false }
);
const Area = dynamic(
  () => import("recharts").then((m) => m.Area),
  { ssr: false }
);
const PieChart = dynamic(
  () => import("recharts").then((m) => m.PieChart),
  { ssr: false }
);
const Pie = dynamic(
  () => import("recharts").then((m) => m.Pie),
  { ssr: false }
);
const Cell = dynamic(
  () => import("recharts").then((m) => m.Cell),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((m) => m.Legend),
  { ssr: false }
);

const COLORS = [
  "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

interface ChartRendererProps {
  data: ChartData;
  height?: number;
  className?: string;
}

export function ChartRenderer({ data, height = 256, className }: ChartRendererProps) {
  if (!data || !data.data || data.data.length === 0) return null;

  return (
    <div className={`rounded-xl border bg-card p-4 ${className ?? ""}`}>
      {data.title && (
        <h4 className="mb-3 text-sm font-medium">{data.title}</h4>
      )}
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(data)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(data: ChartData): React.ReactElement {
  const xKey = data.xKey || "name";
  const yKey = data.yKey || "value";

  switch (data.type) {
    case "bar":
      return (
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey={yKey} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      );

    case "line":
      return (
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={COLORS[0]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      );

    case "area":
      return (
        <AreaChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={COLORS[0]}
            fill={COLORS[0]}
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      );

    case "pie": {
      const nameKey = data.nameKey || "name";
      const valueKey = data.valueKey || "value";
      return (
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={data.data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {data.data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      );
    }

    default:
      return (
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={yKey} fill={COLORS[0]} />
        </BarChart>
      );
  }
}
