import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import type { DashboardLayoutProps, UpcomingJob } from "./types";

export function GlassLayout({ data }: DashboardLayoutProps) {
  const { stats, activity, upcoming } = data;

  return (
    <div className="-m-6 flex flex-col p-6 pt-0" style={{ minHeight: "calc(100vh - 64px)" }}>
      {/* Main grid: 3 ring cards + right donut panel, then bottom row */}
      <div className="flex-1 grid gap-3.5" style={{ gridTemplateColumns: "1fr 1fr 1fr 320px", gridTemplateRows: "auto 1fr" }}>
        {/* Row 1: Ring stat cards (span 3 cols) */}
        <div className="col-span-3 flex gap-3.5">
          <RingCard
            label="Revenue / Target"
            value={formatRevShort(stats.revenueMTD)}
            subLabel={`of ${formatRevShort(computeTarget(stats.revenueMTD))} target`}
            pct={computeRevPct(stats.revenueMTD)}
            glow="indigo"
            gradientFrom="#818cf8"
            gradientTo="#c084fc"
            href="/reports"
          />
          <RingCard
            label="Jobs Completed"
            value={`${stats.todaysCompleted}`}
            valueSuffix={` / ${stats.todaysJobs}`}
            subLabel="today"
            pct={stats.todaysJobs > 0 ? Math.round((stats.todaysCompleted / stats.todaysJobs) * 100) : 0}
            glow="emerald"
            gradientFrom="#34d399"
            gradientTo="#22d3ee"
          />
          <RingCard
            label="Open Estimates"
            value={`${stats.openEstimates}`}
            subLabel={formatCurrency(stats.openEstimatesValue)}
            pct={Math.min(Math.round((stats.openEstimates / Math.max(stats.openEstimates * 2, 10)) * 100), 100)}
            glow="pink"
            gradientFrom="#f472b6"
            gradientTo="#fb923c"
            href="/estimates?status=sent,viewed"
          />
        </div>

        {/* Right column: Donut + Activity (spans 2 rows) */}
        <div className="row-span-2 glass-card flex flex-col overflow-hidden">
          <div className="glass-card-header">
            <span className="text-[13px] font-semibold text-white/95" style={{ letterSpacing: "-0.2px" }}>
              Job Status
            </span>
            <span
              className="text-[10px] font-semibold rounded-full px-2.5 py-0.5"
              style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8" }}
            >
              {stats.todaysJobs} Today
            </span>
          </div>
          <div className="flex-1 px-4 pb-4 overflow-auto">
            <DonutChart stats={stats} />
            <ActivityFeed activity={activity} />
          </div>
        </div>

        {/* Row 2: Revenue chart + Active jobs (span 3 cols) */}
        <div className="col-span-3 grid gap-3.5" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
          {/* Revenue Chart */}
          <div className="glass-card flex flex-col">
            <div className="glass-card-header">
              <span className="text-[13px] font-semibold text-white/95">Weekly Revenue</span>
              <span
                className="text-[10px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
              >
                {formatRevShort(stats.revenueMTD)} MTD
              </span>
            </div>
            <div className="flex-1 px-4 pb-4">
              <RevenueChart revenueMTD={stats.revenueMTD} />
            </div>
          </div>

          {/* Active Jobs */}
          <div className="glass-card flex flex-col">
            <div className="glass-card-header">
              <span className="text-[13px] font-semibold text-white/95">Active Jobs</span>
              <span
                className="text-[10px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
              >
                {upcoming.length} Live
              </span>
            </div>
            <div className="flex-1 px-4 pb-4 overflow-auto">
              <JobList upcoming={upcoming} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Ring Stat Card ─── */

function RingCard({
  label,
  value,
  valueSuffix,
  subLabel,
  pct,
  glow,
  gradientFrom,
  gradientTo,
  href,
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  subLabel: string;
  pct: number;
  glow: "indigo" | "emerald" | "pink";
  gradientFrom: string;
  gradientTo: string;
  href?: string;
}) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  // Circle: r=26, C=2π*26=163.4
  const circumference = 163.4;
  const dashLen = (clampedPct / 100) * circumference;
  const gradId = `glassRing-${glow}`;

  const glowMap = {
    indigo: "0 0 12px rgba(129,140,248,0.3), inset 0 0 12px rgba(129,140,248,0.05)",
    emerald: "0 0 12px rgba(52,211,153,0.3), inset 0 0 12px rgba(52,211,153,0.05)",
    pink: "0 0 12px rgba(244,114,182,0.3), inset 0 0 12px rgba(244,114,182,0.05)",
  };

  const inner = (
    <div
      className="glass-card flex flex-1 items-center gap-4 px-5 py-4"
      style={{ boxShadow: glowMap[glow] }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="32" cy="32" r="26"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${circumference}`}
          transform="rotate(-90 32 32)"
        />
        <text
          x="32" y="35"
          textAnchor="middle"
          fill={gradientFrom}
          fontSize="12"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {clampedPct}%
        </text>
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[26px] font-light leading-none text-white/95" style={{ letterSpacing: "-1px" }}>
          {value}
          {valueSuffix && <span className="text-sm text-white/35">{valueSuffix}</span>}
        </div>
        <div className="mt-0.5 text-[11px] text-white/60">{label}</div>
        <div className="mt-1 text-[10px] font-medium" style={{ color: "#34d399" }}>{subLabel}</div>
      </div>
    </div>
  );

  return href ? <Link href={href} className="flex flex-1">{inner}</Link> : inner;
}

/* ─── Donut Chart ─── */

function DonutChart({ stats }: { stats: DashboardLayoutProps["data"]["stats"] }) {
  const total = stats.todaysJobs || 1;
  const completed = stats.todaysCompleted;
  const remaining = total - completed;

  // Simplified segments: completed vs remaining
  const circumference = 2 * Math.PI * 60; // r=60, ~377
  const completedDash = (completed / total) * circumference;
  const remainingDash = (remaining / total) * circumference;

  const segments = [
    { color: "#818cf8", label: "Completed", count: completed, dash: completedDash, offset: 0 },
    { color: "#22d3ee", label: "Remaining", count: remaining, dash: remainingDash, offset: -completedDash },
  ];

  return (
    <div>
      <div className="flex justify-center my-2">
        <svg width="140" height="140" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx="80" cy="80" r="60"
              fill="none"
              stroke={seg.color}
              strokeWidth="22"
              strokeDasharray={`${seg.dash} ${circumference}`}
              strokeDashoffset={seg.offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          ))}
          <text x="80" y="74" textAnchor="middle" fill="white" fontSize="28" fontWeight="300" fontFamily="Inter, sans-serif">
            {stats.todaysJobs}
          </text>
          <text x="80" y="92" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="Inter, sans-serif">
            TOTAL
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        <LegendItem color="#818cf8" label="Completed" value={completed} />
        <LegendItem color="#34d399" label="In Progress" value={stats.todaysJobs - stats.todaysCompleted > 0 ? 1 : 0} />
        <LegendItem color="#22d3ee" label="Scheduled" value={Math.max(remaining - 1, 0)} />
        <LegendItem
          color="#f472b6"
          label="Overdue"
          value={stats.overdueInvoices}
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="flex-1 text-white/60">{label}</span>
      <span className="font-semibold text-white/95">{value}</span>
    </div>
  );
}

/* ─── Activity Feed ─── */

function ActivityFeed({ activity }: { activity: DashboardLayoutProps["data"]["activity"] }) {
  if (activity.length === 0) return null;

  const feedColors = ["#34d399", "#818cf8", "#f472b6", "#fbbf24", "#22d3ee"];

  return (
    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      {activity.slice(0, 4).map((item, i) => (
        <div key={item.id} className="flex items-start gap-2">
          <div
            className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: feedColors[i % feedColors.length] }}
          />
          <div className="flex-1 min-w-0 text-[11px] leading-snug text-white/60">
            <span className="font-medium text-white/90">{item.userFirstName}</span>{" "}
            {formatAction(item.entityType, item.action)}
          </div>
          <span className="text-[9px] text-white/35 whitespace-nowrap shrink-0">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: false })}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Revenue Chart ─── */

function RevenueChart({ revenueMTD }: { revenueMTD: number }) {
  const points = generateSparkline(revenueMTD, 7);
  const maxY = Math.max(...points);
  const chartH = 170;
  const chartW = 550;

  const coords = points.map((v, i) => {
    const x = 40 + (i / (points.length - 1)) * (chartW - 80);
    const y = 30 + (chartH - 60) - (v / maxY) * (chartH - 80);
    return { x, y };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const polygon = `${coords[0].x},${chartH - 15} ${polyline} ${coords[coords.length - 1].x},${chartH - 15}`;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <svg width="100%" height="200" viewBox={`0 0 ${chartW} 200`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="glassAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="glassLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[40, 80, 120, 160].map((y) => (
        <line key={y} x1="0" y1={y} x2={chartW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4" />
      ))}
      {/* Area */}
      <polygon points={polygon} fill="url(#glassAreaGrad)" />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="url(#glassLineGrad)" strokeWidth="2.5" />
      {/* Dots */}
      {coords.map((c, i) => {
        const isLast = i === coords.length - 1;
        const dotColor = interpolateColor(i / (coords.length - 1));
        return (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={isLast ? 5 : 4}
            fill={isLast ? dotColor : "#0f0b1e"}
            stroke={dotColor}
            strokeWidth="2"
          />
        );
      })}
      {/* Day labels */}
      {coords.map((c, i) => (
        <text key={i} x={c.x} y={chartH + 5} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="Inter, sans-serif">
          {days[i]}
        </text>
      ))}
    </svg>
  );
}

/* ─── Job List ─── */

function JobList({ upcoming }: { upcoming: UpcomingJob[] }) {
  if (upcoming.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[13px] text-white/35">
        No active jobs.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {upcoming.map((job) => {
        const statusColor = getStatusColor(job.status);
        const techName = job.assignedFirstName
          ? `${job.assignedFirstName[0]}. ${job.assignedLastName ?? ""}`
          : null;
        const timeStr = job.scheduledStart
          ? format(new Date(job.scheduledStart), "h:mm a")
          : "";

        return (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all hover:border-white/10 hover:bg-white/[0.03]"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.04)",
            }}
          >
            {/* Status bar */}
            <div
              className="w-[3px] h-7 rounded-full shrink-0"
              style={{ background: statusColor }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white/95 truncate">{job.summary}</div>
              <div className="text-[10px] text-white/35">
                {job.jobNumber} &bull; {statusLabel(job.status)}
                {timeStr && ` ${timeStr}`}
              </div>
            </div>
            {techName && (
              <div
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] text-white/60 shrink-0"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: statusColor }} />
                {techName}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Helpers ─── */

function formatRevShort(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `$${amount}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function computeTarget(revenueMTD: number): number {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pace = dayOfMonth > 0 ? revenueMTD / dayOfMonth : 0;
  const projected = pace * daysInMonth;
  return Math.max(Math.ceil((projected * 1.15) / 5000) * 5000, 5000);
}

function computeRevPct(revenueMTD: number): number {
  return Math.min(Math.round((revenueMTD / computeTarget(revenueMTD)) * 100), 100);
}

function getStatusColor(status: string): string {
  switch (status) {
    case "in_progress": return "#34d399";
    case "dispatched": return "#fbbf24";
    case "scheduled": return "#22d3ee";
    case "completed": return "#818cf8";
    case "canceled": return "#f472b6";
    default: return "#818cf8";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "in_progress": return "In Progress";
    case "dispatched": return "En Route";
    case "scheduled": return "Scheduled";
    case "canceled": return "Canceled";
    case "completed": return "Complete";
    default: return status.replace("_", " ");
  }
}

function formatAction(entityType: string, action: string): string {
  const typeLabels: Record<string, string> = {
    job: "a job", estimate: "an estimate", invoice: "an invoice",
    payment: "a payment", customer: "a customer", user: "a team member", settings: "settings",
  };
  const actionLabels: Record<string, string> = {
    created: "created", updated: "updated", sent: "sent", approved: "approved",
    declined: "declined", voided: "voided", status_changed: "changed status of",
    assigned: "assigned", invited: "invited", deactivated: "deactivated",
    reactivated: "reactivated", recorded: "recorded",
    company_updated: "updated company profile", settings_updated: "updated",
  };
  return `${actionLabels[action] || action} ${typeLabels[entityType] || entityType}`;
}

function generateSparkline(seed: number, count: number): number[] {
  const result: number[] = [];
  let v = 40;
  for (let i = 0; i < count; i++) {
    v = Math.max(10, Math.min(100, v + (((seed * (i + 1) * 7) % 41) - 20)));
    result.push(v);
  }
  return result;
}

function interpolateColor(t: number): string {
  // Indigo (#818cf8) → Pink (#f472b6)
  const r = Math.round(129 + t * (244 - 129));
  const g = Math.round(140 + t * (114 - 140));
  const b = Math.round(248 + t * (182 - 248));
  return `rgb(${r},${g},${b})`;
}
