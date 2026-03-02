import Link from "next/link";
import { format, getISOWeek } from "date-fns";
import type { DashboardLayoutProps, UpcomingJob } from "./types";

export function BlueprintLayout({ data }: DashboardLayoutProps) {
  const { stats, upcoming, firstName } = data;

  return (
    <div className="-m-6 blueprint-bg min-h-screen">
      <BlueprintHero
        firstName={firstName}
        todaysJobs={stats.todaysJobs}
        todaysCompleted={stats.todaysCompleted}
        revenueMTD={stats.revenueMTD}
        techCount={getUniqueTechs(upcoming).length}
      />
      <div className="grid grid-cols-2 gap-4 px-8 pb-8 pt-4">
        <RevenueGaugeCard revenueMTD={stats.revenueMTD} />
        <RouteMapCard upcoming={upcoming} todaysCompleted={stats.todaysCompleted} />
        <JobQueueCard upcoming={upcoming} />
        <TechnicianGridCard upcoming={upcoming} />
      </div>
    </div>
  );
}

/* ─── Hero Banner ─── */

function BlueprintHero({
  firstName,
  todaysJobs,
  todaysCompleted,
  revenueMTD,
  techCount,
}: {
  firstName: string;
  todaysJobs: number;
  todaysCompleted: number;
  revenueMTD: number;
  techCount: number;
}) {
  const now = new Date();
  const completionPct =
    todaysJobs > 0 ? Math.round((todaysCompleted / todaysJobs) * 100) : 0;

  return (
    <div
      className="flex items-center px-8"
      style={{
        height: 140,
        background: "var(--bp-hero-bg)",
      }}
    >
      <div className="flex-1">
        <p className="text-[13px] text-white/70">
          Good {getGreeting()}, {firstName}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Operations Dashboard
        </h1>
        <p className="mt-1 font-mono text-xs text-white/50 uppercase tracking-wider">
          {format(now, "EEEE, MMM d yyyy")} &bull; Week{" "}
          {String(getISOWeek(now)).padStart(2, "0")}
        </p>
      </div>
      <div className="flex gap-6">
        <HeroStat value={todaysJobs} label="Jobs Today" />
        <HeroStat value={techCount} label="Techs Active" />
        <HeroStat
          value={formatRevShort(revenueMTD)}
          label="MTD Revenue"
          highlight
        />
        <HeroStat value={`${completionPct}%`} label="Completion" />
      </div>
    </div>
  );
}

function HeroStat({
  value,
  label,
  highlight,
}: {
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className="font-mono text-[28px] font-bold leading-none"
        style={{ color: highlight ? "#fdba74" : "#ffffff" }}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">
        {label}
      </div>
    </div>
  );
}

/* ─── Blueprint Card Shell ─── */

function BlueprintCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded" style={{ background: "var(--bp-card-bg)", border: "2px dashed var(--bp-border)" }}>
      {/* Inner border */}
      <div
        className="pointer-events-none absolute rounded-sm"
        style={{
          top: 4,
          left: 4,
          right: 4,
          bottom: 4,
          border: "1px solid var(--bp-border-inner)",
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: "var(--bp-text)" }}>
          {title}
        </span>
        {badge && (
          <span className="rounded-sm font-mono text-[9px] font-semibold text-[#f97316] px-2 py-0.5" style={{ background: "rgba(249,115,22,0.1)" }}>
            {badge}
          </span>
        )}
      </div>
      {/* Body */}
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

/* ─── Revenue Gauge Card ─── */

function RevenueGaugeCard({ revenueMTD }: { revenueMTD: number }) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pace = dayOfMonth > 0 ? revenueMTD / dayOfMonth : 0;
  const projected = pace * daysInMonth;
  const target = Math.ceil((projected * 1.15) / 5000) * 5000;
  const safeTarget = Math.max(target, 5000);

  const pct = Math.min(revenueMTD / safeTarget, 1);
  const remaining = Math.max(safeTarget - revenueMTD, 0);
  const avgDay = dayOfMonth > 0 ? Math.round(revenueMTD / dayOfMonth) : 0;

  // Arc math: semicircle from (15,85) to (145,85), radius 65
  const arcLength = Math.PI * 65; // ~204
  const dashLen = pct * arcLength;

  // Needle angle: 0% = 180°, 100% = 0° (semicircle)
  const needleAngle = Math.PI * (1 - pct);
  const needleLen = 58;
  const cx = 80,
    cy = 85;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  const pctChange =
    dayOfMonth > 1 ? (((pace * daysInMonth) / safeTarget - 1) * 100).toFixed(1) : "0.0";

  return (
    <BlueprintCard title="Revenue / Target" badge={`${Number(pctChange) >= 0 ? "+" : ""}${pctChange}%`}>
      <div className="flex items-center gap-6 py-2">
        <svg width="160" height="95" viewBox="0 0 160 95" className="shrink-0">
          <defs>
            <linearGradient id="bpGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--bp-text)" />
              <stop offset="80%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path
            d="M 15 85 A 65 65 0 0 1 145 85"
            fill="none"
            stroke="var(--bp-gauge-track)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 15 85 A 65 65 0 0 1 145 85"
            fill="none"
            stroke="url(#bpGaugeGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dashLen} ${arcLength}`}
          />
          {/* Tick marks */}
          <line x1="15" y1="85" x2="15" y2="78" stroke="var(--bp-border)" strokeWidth="1" />
          <line x1="40" y1="35" x2="43" y2="41" stroke="var(--bp-border)" strokeWidth="1" />
          <line x1="80" y1="20" x2="80" y2="27" stroke="var(--bp-border)" strokeWidth="1" />
          <line x1="120" y1="35" x2="117" y2="41" stroke="var(--bp-border)" strokeWidth="1" />
          <line x1="145" y1="85" x2="145" y2="78" stroke="var(--bp-border)" strokeWidth="1" />
          {/* Tick labels */}
          <text x="15" y="94" textAnchor="middle" fill="var(--bp-text-subtle)" fontFamily="var(--font-jetbrains-mono)" fontSize="8">
            $0
          </text>
          <text x="80" y="16" textAnchor="middle" fill="var(--bp-text-subtle)" fontFamily="var(--font-jetbrains-mono)" fontSize="8">
            {formatRevShort(safeTarget / 2)}
          </text>
          <text x="145" y="94" textAnchor="middle" fill="var(--bp-text-subtle)" fontFamily="var(--font-jetbrains-mono)" fontSize="8">
            {formatRevShort(safeTarget)}
          </text>
          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--bp-needle)" strokeWidth="2" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="4" fill="var(--bp-needle)" />
          <circle cx={cx} cy={cy} r="2" fill="var(--bp-card-bg)" />
          {/* Center value */}
          <text x="80" y="75" textAnchor="middle" fill="var(--bp-text)" fontFamily="var(--font-jetbrains-mono)" fontSize="22" fontWeight="700">
            {formatRevShort(revenueMTD)}
          </text>
        </svg>

        {/* Revenue details */}
        <div className="flex-1 space-y-0">
          <RevLine label="Target" value={formatCurrency(safeTarget)} />
          <RevLine label="Current" value={formatCurrency(revenueMTD)} highlight />
          <RevLine label="Remaining" value={formatCurrency(remaining)} />
          <RevLine label="Avg/Day" value={formatCurrency(avgDay)} last />
        </div>
      </div>
    </BlueprintCard>
  );
}

function RevLine({
  label,
  value,
  highlight,
  last,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between py-1.5"
      style={last ? undefined : { borderBottom: "1px dashed var(--bp-border-dashed)" }}
    >
      <span className="text-xs" style={{ color: "var(--bp-text-muted)" }}>{label}</span>
      <span
        className="font-mono text-sm font-semibold"
        style={{ color: highlight ? "#f97316" : "var(--bp-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Route Map Card ─── */

function RouteMapCard({
  upcoming,
  todaysCompleted,
}: {
  upcoming: UpcomingJob[];
  todaysCompleted: number;
}) {
  const stops = upcoming.slice(0, 8);
  const stopCount = stops.length;

  if (stopCount === 0) {
    return (
      <BlueprintCard title="Today&apos;s Route Plan" badge="0 STOPS">
        <div className="flex items-center justify-center py-12 text-sm" style={{ color: "var(--bp-text-subtle)" }}>
          No scheduled stops today.
        </div>
      </BlueprintCard>
    );
  }

  // Generate positions: evenly spaced horizontally with sine-wave vertical variation
  const positions = stops.map((_, i) => {
    const xPct = 8 + (i / Math.max(stopCount - 1, 1)) * 84;
    const yPct = 30 + Math.sin((i * Math.PI) / 2.5) * 25 + (i % 2 === 0 ? 0 : 15);
    return { x: xPct, y: Math.min(Math.max(yPct, 15), 75) };
  });

  // Determine status: first N = completed, next = active, rest = upcoming
  const activeIdx = Math.min(todaysCompleted, stopCount - 1);

  return (
    <BlueprintCard title="Today's Route Plan" badge={`${stopCount} STOPS`}>
      <div className="blueprint-grid-inner relative" style={{ minHeight: 200 }}>
        {/* SVG bezier path connecting stops */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ zIndex: 1 }}
        >
          {positions.map((pos, i) => {
            if (i === 0) return null;
            const prev = positions[i - 1];
            const midX = (prev.x + pos.x) / 2;
            const isCompleted = i <= activeIdx;
            return (
              <path
                key={i}
                d={`M ${prev.x} ${prev.y} C ${midX} ${prev.y}, ${midX} ${pos.y}, ${pos.x} ${pos.y}`}
                fill="none"
                stroke={isCompleted ? "var(--bp-text)" : "var(--bp-border)"}
                strokeWidth="0.4"
                strokeDasharray="1.5 1"
                opacity={isCompleted ? 0.25 : 0.35}
              />
            );
          })}
        </svg>

        {/* Stop markers */}
        {stops.map((job, i) => {
          const pos = positions[i];
          const isCompleted = i < activeIdx;
          const isActive = i === activeIdx;

          let bg = "var(--bp-card-bg)";
          let border = "var(--bp-text)";
          let textColor = "var(--bp-text)";
          if (isCompleted) {
            bg = "var(--bp-text)";
            textColor = "var(--bp-card-bg)";
          } else if (isActive) {
            bg = "#f97316";
            border = "#f97316";
            textColor = "white";
          }

          const timeStr = job.scheduledStart
            ? format(new Date(job.scheduledStart), "h:mma").toLowerCase()
            : "TBD";
          const labelText = `${truncate(job.summary, 12)} ${timeStr}`;

          return (
            <div key={job.id} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, zIndex: 5 }}>
              {/* Marker */}
              <div
                className="flex items-center justify-center rounded-full font-mono text-[10px] font-bold"
                style={{
                  width: 24,
                  height: 24,
                  background: bg,
                  border: `2px solid ${border}`,
                  color: textColor,
                  transform: "translate(-50%, -50%)",
                  boxShadow: isActive ? "0 0 0 4px rgba(249,115,22,0.2)" : undefined,
                }}
              >
                {i + 1}
              </div>
              {/* Label */}
              <div
                className="whitespace-nowrap font-mono text-[9px] tracking-wide"
                style={{ transform: "translate(-50%, 4px)", textAlign: "center", color: "var(--bp-text-muted)" }}
              >
                {labelText}
              </div>
            </div>
          );
        })}

        {/* Animated tech dot near active stop */}
        {stops.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: `${positions[activeIdx].x - 2}%`,
              top: `${positions[activeIdx].y - 3}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#f97316",
              boxShadow: "0 0 8px #f97316",
              zIndex: 10,
              animation: "blueprint-route-pulse 3s ease-in-out infinite alternate",
            }}
          />
        )}
      </div>
    </BlueprintCard>
  );
}

/* ─── Job Queue Card ─── */

function JobQueueCard({ upcoming }: { upcoming: UpcomingJob[] }) {
  const jobs = upcoming.slice(0, 6);

  if (jobs.length === 0) {
    return (
      <BlueprintCard title="Job Queue" badge="0 PENDING">
        <div className="flex items-center justify-center py-8 text-sm" style={{ color: "var(--bp-text-subtle)" }}>
          No pending jobs.
        </div>
      </BlueprintCard>
    );
  }

  return (
    <BlueprintCard title="Job Queue" badge={`${jobs.length} PENDING`}>
      <div className="flex flex-col gap-1.5">
        {jobs.map((job) => {
          const priority = job.priority ?? "normal";
          const borderColor =
            priority === "high" || priority === "urgent"
              ? "#ef4444"
              : priority === "medium"
                ? "#f97316"
                : "#10b981";

          const timeStr = job.scheduledStart
            ? formatShortTime(new Date(job.scheduledStart))
            : "TBD";

          const tag = getJobTag(priority, job.status);

          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center gap-2.5 rounded-sm border transition-colors"
              style={{
                padding: "8px 12px",
                background: "var(--bp-card-item-bg)",
                borderColor: "var(--bp-border-inner)",
                borderLeftWidth: 3,
                borderLeftColor: borderColor,
              }}
            >
              <span className="w-[50px] shrink-0 font-mono text-[11px] font-semibold" style={{ color: "var(--bp-text)" }}>
                {timeStr}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: "var(--bp-text)" }}>
                  {job.summary}
                </div>
                <div className="text-[10px]" style={{ color: "var(--bp-text-subtle)" }}>{job.jobNumber}</div>
              </div>
              <span
                className="shrink-0 rounded-sm font-mono text-[9px] tracking-wide px-1.5 py-0.5"
                style={{
                  background:
                    tag === "URGENT"
                      ? "rgba(239,68,68,0.08)"
                      : "rgba(26,39,68,0.06)",
                  color: tag === "URGENT" ? "#ef4444" : "var(--bp-text-muted)",
                }}
              >
                {tag}
              </span>
            </Link>
          );
        })}
      </div>
    </BlueprintCard>
  );
}

/* ─── Technician Grid Card ─── */

function TechnicianGridCard({ upcoming }: { upcoming: UpcomingJob[] }) {
  const techs = getUniqueTechs(upcoming);

  if (techs.length === 0) {
    return (
      <BlueprintCard title="Technicians" badge="0 ACTIVE">
        <div className="flex items-center justify-center py-8 text-sm" style={{ color: "var(--bp-text-subtle)" }}>
          No techs scheduled today.
        </div>
      </BlueprintCard>
    );
  }

  return (
    <BlueprintCard title="Technicians" badge={`${techs.length} ACTIVE`}>
      <div className="grid grid-cols-2 gap-2">
        {techs.map((tech) => (
          <div
            key={tech.name}
            className="flex items-center gap-2.5 rounded-sm border p-2.5"
            style={{ borderColor: "var(--bp-border-inner)", background: "var(--bp-card-item-bg)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: tech.color }}
            >
              {tech.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: "var(--bp-text)" }}>
                {tech.abbrevName}
              </div>
              <div className="font-mono text-[9px] tracking-wide truncate uppercase" style={{ color: "var(--bp-text-subtle)" }}>
                {tech.statusText}
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="font-mono text-lg font-bold leading-none" style={{ color: "var(--bp-text)" }}>
                {tech.jobCount}
              </div>
              <div className="text-[8px] uppercase tracking-wide" style={{ color: "var(--bp-text-subtle)" }}>
                TODAY
              </div>
            </div>
          </div>
        ))}

        {/* Off-duty placeholder */}
        <div
          className="flex items-center gap-2.5 rounded-sm p-2.5"
          style={{ border: "1px dashed var(--bp-border)" }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
            style={{ background: "var(--bp-border-inner)", color: "var(--bp-text-subtle)" }}
          >
            +
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold" style={{ color: "var(--bp-text-subtle)" }}>Off-Duty</div>
            <div className="font-mono text-[9px] tracking-wide" style={{ color: "var(--bp-text-subtle)" }}>
              SCHEDULED TOMORROW
            </div>
          </div>
        </div>
      </div>
    </BlueprintCard>
  );
}

/* ─── Helpers ─── */

function getUniqueTechs(upcoming: UpcomingJob[]) {
  const map = new Map<
    string,
    {
      name: string;
      abbrevName: string;
      initials: string;
      color: string;
      jobCount: number;
      statusText: string;
      currentJob: string | null;
    }
  >();

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
        color: job.assignedColor ?? "#1a2744",
        jobCount: 1,
        statusText: job.jobNumber ? `ON JOB \u2022 ${job.jobNumber}` : "AVAILABLE",
        currentJob: job.jobNumber,
      });
    }
  }
  return Array.from(map.values());
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
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

function formatShortTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "p" : "a";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}:00${ampm}` : `${hour}:${String(m).padStart(2, "0")}${ampm}`;
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function getJobTag(priority: string, status: string): string {
  if (priority === "high" || priority === "urgent") return "URGENT";
  if (status === "scheduled") return "SCHED";
  return "SERVICE";
}
