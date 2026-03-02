import Link from "next/link";
import { format } from "date-fns";
import type { DashboardLayoutProps, UpcomingJob } from "./types";

export function MissionControlLayout({ data }: DashboardLayoutProps) {
  const { stats, activity, upcoming, firstName } = data;
  const techCount = getUniqueTechs(upcoming).length;

  return (
    <div className="-m-6 mc-scanline flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Alert Bar */}
      <AlertBar stats={stats} activity={activity} />

      {/* Main Grid */}
      <div className="flex-1 grid gap-2.5 p-2.5" style={{ gridTemplateColumns: "1fr 1fr 280px", gridTemplateRows: "auto 1fr" }}>
        {/* Row 1: Gauge Meters (span 2 cols) */}
        <div className="col-span-2 flex gap-2.5">
          <GaugeCard
            label="Revenue / Target"
            value={formatRevShort(stats.revenueMTD)}
            pct={computeRevenuePct(stats.revenueMTD)}
            color="green"
            sub={`of ${formatRevShort(computeRevenueTarget(stats.revenueMTD))} target`}
          />
          <GaugeCard
            label="Jobs Completed"
            value={`${stats.todaysCompleted}`}
            valueSuffix={` / ${stats.todaysJobs}`}
            pct={stats.todaysJobs > 0 ? Math.round((stats.todaysCompleted / stats.todaysJobs) * 100) : 0}
            color="cyan"
            sub="today"
          />
          <GaugeCard
            label="Open Estimates"
            value={`${stats.openEstimates}`}
            pct={Math.min(Math.round((stats.openEstimates / Math.max(stats.openEstimates * 3, 10)) * 100), 100)}
            color="amber"
            sub={formatCurrency(stats.openEstimatesValue)}
            href="/estimates?status=sent,viewed"
          />
          <GaugeCard
            label="Overdue Invoices"
            value={`${stats.overdueInvoices}`}
            pct={Math.min(Math.round((stats.overdueInvoices / Math.max(stats.overdueInvoices * 3, 5)) * 100), 100)}
            color={stats.overdueInvoices > 0 ? "red" : "green"}
            sub={formatCurrency(stats.overdueValue)}
            href="/invoices?status=overdue"
          />
        </div>

        {/* Row 1 Right: Field Map header area (part of spanning panel) */}

        {/* Row 2 Left: Revenue Trend */}
        <MCPanel title="Revenue Trend" badge={`$${Math.round(stats.revenueMTD / 1000)}K MTD`} badgeColor="green">
          <RevenueChart revenueMTD={stats.revenueMTD} stats={stats} />
        </MCPanel>

        {/* Row 2 Center: Active Dispatch */}
        <MCPanel title="Active Dispatch" badge={`${upcoming.length} LIVE`} badgeColor="cyan">
          <DispatchTable upcoming={upcoming} />
        </MCPanel>

        {/* Row 2 Right: Field Map (spans both rows of this column) */}
        <div className="row-span-2 mc-panel overflow-hidden flex flex-col">
          <div className="mc-panel-header">
            <span className="mc-panel-title">Field Map</span>
            <span className="mc-badge mc-badge-green">{techCount} ACTIVE</span>
          </div>
          <FieldMap upcoming={upcoming} />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar stats={stats} techCount={techCount} upcoming={upcoming} />
    </div>
  );
}

/* ─── Alert Bar ─── */

function AlertBar({
  stats,
  activity,
}: {
  stats: DashboardLayoutProps["data"]["stats"];
  activity: DashboardLayoutProps["data"]["activity"];
}) {
  const now = new Date();
  const timeStr = format(now, "HH:mm:ss");

  // Build alert items from real data
  const alerts: { color: "red" | "amber" | "green"; label: string; text: string }[] = [];

  if (stats.overdueInvoices > 0) {
    alerts.push({
      color: "red",
      label: "ALERT",
      text: `${stats.overdueInvoices} overdue invoice${stats.overdueInvoices !== 1 ? "s" : ""} — ${formatCurrency(stats.overdueValue)}`,
    });
  }

  if (stats.openEstimates > 0) {
    alerts.push({
      color: "amber",
      label: "PENDING",
      text: `${stats.openEstimates} estimate${stats.openEstimates !== 1 ? "s" : ""} awaiting response`,
    });
  }

  // Latest activity as "OK" item
  const latestActivity = activity[0];
  if (latestActivity) {
    alerts.push({
      color: "green",
      label: "OK",
      text: `${latestActivity.userFirstName ?? "System"} ${formatAction(latestActivity.entityType, latestActivity.action)}`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({ color: "green", label: "OK", text: "All systems nominal" });
  }

  return (
    <div
      className="flex h-9 shrink-0 items-center gap-5 px-4 border-b"
      style={{
        background: "var(--mc-status-bar-bg)",
        borderColor: "var(--mc-panel-border)",
      }}
    >
      <span className="font-mono text-[10px] tracking-[2px] uppercase whitespace-nowrap" style={{ color: "var(--mc-accent)" }}>
        FSP-OPS<span className="mc-blink">_</span>
      </span>

      <div className="flex flex-1 items-center gap-4 overflow-hidden">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center gap-1.5 font-mono text-[10px] whitespace-nowrap">
            <div className={`mc-alert-dot mc-alert-dot-${alert.color}`} />
            <span style={{ color: alertColor(alert.color) }}>{alert.label}:</span>
            <span style={{ color: "var(--mc-text-secondary)" }}>{alert.text}</span>
          </div>
        ))}
      </div>

      <span className="font-mono text-[11px] tracking-wider whitespace-nowrap" style={{ color: "var(--mc-accent-cyan)" }}>
        {timeStr}
      </span>
    </div>
  );
}

/* ─── MC Panel Shell ─── */

function MCPanel({
  title,
  badge,
  badgeColor = "green",
  children,
}: {
  title: string;
  badge?: string;
  badgeColor?: "green" | "cyan" | "amber" | "red";
  children: React.ReactNode;
}) {
  return (
    <div className="mc-panel flex flex-col">
      <div className="mc-panel-header">
        <span className="mc-panel-title">{title}</span>
        {badge && <span className={`mc-badge mc-badge-${badgeColor}`}>{badge}</span>}
      </div>
      <div className="flex-1 px-3 py-2.5">{children}</div>
    </div>
  );
}

/* ─── SVG Gauge Card ─── */

function GaugeCard({
  label,
  value,
  valueSuffix,
  pct,
  color,
  sub,
  href,
}: {
  label: string;
  value: string;
  valueSuffix?: string;
  pct: number;
  color: "green" | "cyan" | "amber" | "red";
  sub: string;
  href?: string;
}) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  // Arc math: semicircle from (8,40) to (62,40), radius 30
  const arcLength = Math.PI * 30; // ~94.25
  const dashLen = (clampedPct / 100) * arcLength;

  // Needle angle: 0% = 180°, 100% = 0°
  const needleAngle = Math.PI * (1 - clampedPct / 100);
  const needleLen = 22;
  const cx = 35, cy = 40;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const colorMap = {
    green: { stroke: "var(--mc-accent)", glow: "rgba(0,255,136,0.3)", text: "var(--mc-accent)", gradEnd: "var(--mc-accent-cyan)" },
    cyan: { stroke: "var(--mc-accent-cyan)", glow: "rgba(0,212,255,0.3)", text: "var(--mc-accent-cyan)", gradEnd: "#818cf8" },
    amber: { stroke: "var(--mc-accent-amber)", glow: "rgba(255,184,0,0.3)", text: "var(--mc-accent-amber)", gradEnd: "#ff6b35" },
    red: { stroke: "var(--mc-accent-red)", glow: "rgba(255,51,85,0.3)", text: "var(--mc-accent-red)", gradEnd: "#ff6b35" },
  };
  const c = colorMap[color];
  const gradId = `mcGauge-${label.replace(/\W/g, "")}`;

  const inner = (
    <div className="mc-gauge-card flex items-center gap-3.5">
      <svg width="70" height="45" viewBox="0 0 70 45" className="shrink-0">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={c.stroke} />
            <stop offset="100%" stopColor={c.gradEnd} />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d="M 8 40 A 30 30 0 0 1 62 40" fill="none" stroke="var(--mc-panel-border)" strokeWidth="5" strokeLinecap="round" />
        {/* Value arc */}
        <path
          d="M 8 40 A 30 30 0 0 1 62 40"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dashLen} ${arcLength}`}
        />
        {/* Tick marks */}
        <line x1="8" y1="40" x2="8" y2="36" stroke="var(--mc-panel-border)" strokeWidth="1" />
        <line x1="35" y1="10" x2="35" y2="14" stroke="var(--mc-panel-border)" strokeWidth="1" />
        <line x1="62" y1="40" x2="62" y2="36" stroke="var(--mc-panel-border)" strokeWidth="1" />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3" fill={c.stroke} opacity="0.3" />
        <circle cx={cx} cy={cy} r="1.5" fill={c.stroke} />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9px] uppercase tracking-wider mb-0.5" style={{ color: "var(--mc-text-muted)" }}>{label}</div>
        <div className="font-mono text-xl font-bold leading-none mb-1" style={{ color: c.text }}>
          {value}
          {valueSuffix && <span className="text-xs" style={{ color: "var(--mc-text-muted)" }}>{valueSuffix}</span>}
        </div>
        <div className="font-mono text-[9px]" style={{ color: "var(--mc-text-muted)" }}>{sub}</div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Revenue Chart ─── */

function RevenueChart({
  revenueMTD,
  stats,
}: {
  revenueMTD: number;
  stats: DashboardLayoutProps["data"]["stats"];
}) {
  // Generate a deterministic 7-day sparkline from revenue
  const points = generateSparkline(revenueMTD, 7);
  const maxY = Math.max(...points);
  const chartH = 80;
  const chartW = 500;

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * chartW;
    const y = chartH - (v / maxY) * (chartH - 10);
    return { x, y };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const polygon = `0,${chartH} ${polyline} ${chartW},${chartH}`;
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const sparkRows = [
    { label: "Invoices Sent", color: "var(--mc-accent-cyan)", value: formatCurrency(Math.round(revenueMTD * 0.39)) },
    { label: "Payments Rec'd", color: "var(--mc-accent)", value: formatCurrency(Math.round(revenueMTD * 0.31)) },
    { label: "Outstanding", color: "var(--mc-accent-amber)", value: formatCurrency(stats.openEstimatesValue) },
    { label: "Overdue", color: "var(--mc-accent-red)", value: formatCurrency(stats.overdueValue) },
  ];

  return (
    <div>
      <svg width="100%" height="90" viewBox={`0 0 ${chartW} 90`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="mcAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--mc-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--mc-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="0" y1="22" x2={chartW} y2="22" stroke="var(--mc-panel-border)" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="0" y1="45" x2={chartW} y2="45" stroke="var(--mc-panel-border)" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="0" y1="68" x2={chartW} y2="68" stroke="var(--mc-panel-border)" strokeWidth="0.5" strokeDasharray="4" />
        {/* Area fill */}
        <polygon points={polygon} fill="url(#mcAreaGrad)" />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke="var(--mc-accent)" strokeWidth="2" />
        {/* Dots */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="3"
            fill={i === coords.length - 1 ? "var(--mc-accent)" : "var(--mc-bg-deep)"}
            stroke="var(--mc-accent)"
            strokeWidth="1.5"
          />
        ))}
        {/* Day labels */}
        {coords.map((c, i) => (
          <text key={i} x={c.x} y="88" fill="var(--mc-text-muted)" fontFamily="var(--font-jetbrains-mono)" fontSize="8" textAnchor="middle">
            {days[i]}
          </text>
        ))}
      </svg>

      {/* Sparkline metric rows */}
      <div className="mt-2 space-y-0">
        {sparkRows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-1.5"
            style={{ borderBottom: "1px solid var(--mc-panel-border)" }}
          >
            <span className="text-[11px] w-[100px]" style={{ color: "var(--mc-text-secondary)" }}>{row.label}</span>
            <svg width="120" height="20" viewBox="0 0 120 20" className="flex-1 mx-2">
              <polyline
                points={generateMiniSparkline(row.value)}
                fill="none"
                stroke={row.color}
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-mono text-xs w-[60px] text-right" style={{ color: row.color }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dispatch Table ─── */

function DispatchTable({ upcoming }: { upcoming: UpcomingJob[] }) {
  if (upcoming.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[13px]" style={{ color: "var(--mc-text-muted)" }}>
        No active dispatches.
      </div>
    );
  }

  return (
    <div className="text-[11px]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-1.5 mb-0.5" style={{ borderBottom: "1px solid var(--mc-panel-border)" }}>
        <span className="font-mono text-[9px] uppercase w-[55px]" style={{ color: "var(--mc-text-muted)" }}>Job ID</span>
        <span className="font-mono text-[9px] uppercase flex-1" style={{ color: "var(--mc-text-muted)" }}>Customer</span>
        <span className="font-mono text-[9px] uppercase w-[70px]" style={{ color: "var(--mc-text-muted)" }}>Tech</span>
        <span className="font-mono text-[9px] uppercase w-[75px] text-center" style={{ color: "var(--mc-text-muted)" }}>Status</span>
      </div>

      {/* Rows */}
      {upcoming.map((job) => {
        const statusStyle = getStatusStyle(job.status);
        const techName = job.assignedFirstName
          ? `${job.assignedFirstName[0]}. ${job.assignedLastName ?? ""}`
          : "—";

        return (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="flex items-center gap-2 py-1.5 transition-colors hover:bg-white/[0.02]"
            style={{ borderBottom: "1px solid var(--mc-panel-border)" }}
          >
            <span className="font-mono text-[10px] w-[55px] shrink-0" style={{ color: "var(--mc-accent-cyan)" }}>
              {job.jobNumber ?? "—"}
            </span>
            <span className="flex-1 truncate" style={{ color: "var(--mc-text-secondary)" }}>
              {job.summary}
            </span>
            <span className="text-[10px] w-[70px] truncate shrink-0" style={{ color: "var(--mc-text-muted)" }}>
              {techName}
            </span>
            <span
              className="font-mono text-[8px] uppercase tracking-wide w-[75px] text-center py-0.5 px-1.5 shrink-0"
              style={{
                background: statusStyle.bg,
                color: statusStyle.color,
                border: `1px solid ${statusStyle.border}`,
                borderRadius: 1,
              }}
            >
              {statusLabel(job.status)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Field Map ─── */

function FieldMap({ upcoming }: { upcoming: UpcomingJob[] }) {
  const techs = getUniqueTechs(upcoming);

  // Position techs deterministically across the map
  const techPositions = techs.map((tech, i) => {
    const angle = (i / Math.max(techs.length, 1)) * Math.PI * 1.6 + 0.3;
    const radius = 25 + (i % 3) * 12;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle) * 0.8;
    return { ...tech, x: Math.min(Math.max(x, 12), 88), y: Math.min(Math.max(y, 12), 88) };
  });

  // Job markers: distribute around map
  const jobPositions = upcoming.slice(0, 7).map((_, i) => ({
    x: 15 + ((i * 37 + 13) % 70),
    y: 15 + ((i * 29 + 7) % 70),
  }));

  const dotColors = ["green", "cyan", "green", "amber", "cyan", "green", "amber", "red"];

  return (
    <div
      className="flex-1 relative overflow-hidden"
      style={{
        background: "var(--mc-panel-bg)",
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, transparent, transparent 39px, var(--mc-grid-line) 39px, var(--mc-grid-line) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, var(--mc-grid-line) 39px, var(--mc-grid-line) 40px)
          `,
        }}
      />

      {/* Roads */}
      <div className="absolute" style={{ top: "25%", left: "10%", width: "80%", height: 3, background: "var(--mc-panel-border)", opacity: 0.8 }} />
      <div className="absolute" style={{ top: "50%", left: "5%", width: "90%", height: 3, background: "var(--mc-panel-border)", opacity: 0.8 }} />
      <div className="absolute" style={{ top: "75%", left: "15%", width: "70%", height: 3, background: "var(--mc-panel-border)", opacity: 0.8 }} />
      <div className="absolute" style={{ left: "20%", top: "10%", width: 3, height: "80%", background: "var(--mc-panel-border)", opacity: 0.8 }} />
      <div className="absolute" style={{ left: "50%", top: "5%", width: 3, height: "90%", background: "var(--mc-panel-border)", opacity: 0.8 }} />
      <div className="absolute" style={{ left: "75%", top: "15%", width: 3, height: "70%", background: "var(--mc-panel-border)", opacity: 0.8 }} />

      {/* Job markers */}
      {jobPositions.map((pos, i) => (
        <div
          key={`jm-${i}`}
          className="absolute"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: 6,
            height: 6,
            background: "rgba(0,212,255,0.3)",
            border: "1px solid rgba(0,212,255,0.5)",
            borderRadius: 1,
            transform: "translate(-50%,-50%) rotate(45deg)",
            zIndex: 5,
          }}
        />
      ))}

      {/* Technician dots */}
      {techPositions.map((tech, i) => {
        const dotColor = dotColors[i % dotColors.length];
        return (
          <div key={tech.name}>
            <div
              className={`mc-tech-dot mc-tech-dot-${dotColor}`}
              style={{ top: `${tech.y}%`, left: `${tech.x}%` }}
            />
            <div
              className="absolute font-mono text-[8px] whitespace-nowrap z-10"
              style={{
                top: `${tech.y}%`,
                left: `${tech.x}%`,
                transform: "translate(-50%, 10px)",
                color: "var(--mc-text-secondary)",
                textShadow: "0 0 4px var(--mc-bg-deep)",
              }}
            >
              {tech.abbrevName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Status Bar ─── */

function StatusBar({
  stats,
  techCount,
  upcoming,
}: {
  stats: DashboardLayoutProps["data"]["stats"];
  techCount: number;
  upcoming: UpcomingJob[];
}) {
  const inProgress = upcoming.filter((j) => j.status === "in_progress").length;
  const scheduled = upcoming.filter((j) => j.status === "scheduled").length;
  const dispatched = upcoming.filter((j) => j.status === "dispatched").length;

  return (
    <div
      className="flex h-7 shrink-0 items-center gap-6 px-4 border-t"
      style={{ background: "var(--mc-status-bar-bg)", borderColor: "var(--mc-panel-border)" }}
    >
      <StatusItem label="System" value="ONLINE" color="var(--mc-accent)" />
      <StatusItem label="Techs Active" value={`${techCount}`} color="var(--mc-accent-cyan)" />
      <StatusItem label="Jobs Today" value={`${stats.todaysJobs}`} />
      <StatusItem label="Completed" value={`${stats.todaysCompleted}`} color="var(--mc-accent)" />
      <StatusItem label="In Progress" value={`${inProgress}`} color="var(--mc-accent-cyan)" />
      <StatusItem label="Dispatched" value={`${dispatched}`} color="var(--mc-accent-amber)" />
      <StatusItem label="Scheduled" value={`${scheduled}`} />
      {stats.overdueInvoices > 0 && (
        <StatusItem label="Overdue" value={`${stats.overdueInvoices}`} color="var(--mc-accent-red)" />
      )}
      <div className="flex-1" />
      <StatusItem label="Ver" value="2.4.1" />
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-wide">
      <span className="uppercase" style={{ color: "var(--mc-text-muted)" }}>{label}:</span>
      <span style={{ color: color ?? "var(--mc-text-secondary)" }}>{value}</span>
    </div>
  );
}

/* ─── Helpers ─── */

function getUniqueTechs(upcoming: UpcomingJob[]) {
  const map = new Map<string, { name: string; abbrevName: string; initials: string; color: string; jobCount: number }>();
  for (const job of upcoming) {
    if (!job.assignedFirstName) continue;
    const key = job.assignedFirstName + (job.assignedLastName ?? "");
    const existing = map.get(key);
    if (existing) {
      existing.jobCount++;
    } else {
      const lastName = job.assignedLastName ?? "";
      map.set(key, {
        name: `${job.assignedFirstName} ${lastName}`.trim(),
        abbrevName: `${job.assignedFirstName[0]}. ${lastName}`,
        initials: `${job.assignedFirstName[0]}${lastName[0] ?? ""}`.toUpperCase(),
        color: job.assignedColor ?? "#6b7280",
        jobCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

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

function computeRevenuePct(revenueMTD: number): number {
  const target = computeRevenueTarget(revenueMTD);
  return Math.min(Math.round((revenueMTD / target) * 100), 100);
}

function computeRevenueTarget(revenueMTD: number): number {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pace = dayOfMonth > 0 ? revenueMTD / dayOfMonth : 0;
  const projected = pace * daysInMonth;
  return Math.max(Math.ceil((projected * 1.15) / 5000) * 5000, 5000);
}

function getStatusStyle(status: string) {
  switch (status) {
    case "in_progress":
      return { bg: "rgba(0,255,136,0.1)", color: "var(--mc-accent)", border: "rgba(0,255,136,0.2)" };
    case "dispatched":
      return { bg: "rgba(0,212,255,0.1)", color: "var(--mc-accent-cyan)", border: "rgba(0,212,255,0.2)" };
    case "scheduled":
      return { bg: "rgba(255,184,0,0.1)", color: "var(--mc-accent-amber)", border: "rgba(255,184,0,0.2)" };
    case "canceled":
      return { bg: "rgba(255,51,85,0.1)", color: "var(--mc-accent-red)", border: "rgba(255,51,85,0.2)" };
    default:
      return { bg: "rgba(90,94,114,0.1)", color: "var(--mc-text-muted)", border: "rgba(90,94,114,0.2)" };
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

function alertColor(color: "red" | "amber" | "green"): string {
  switch (color) {
    case "red": return "var(--mc-accent-red)";
    case "amber": return "var(--mc-accent-amber)";
    case "green": return "var(--mc-accent)";
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

function generateMiniSparkline(seedStr: string): string {
  // Generate a mini sparkline polyline from a string seed
  const seed = seedStr.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pts: string[] = [];
  let v = 10;
  for (let i = 0; i < 8; i++) {
    v = Math.max(2, Math.min(18, v + (((seed * (i + 1) * 13) % 11) - 5)));
    pts.push(`${(i / 7) * 120},${v}`);
  }
  return pts.join(" ");
}
