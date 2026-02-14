import { db } from "@/lib/db";
import {
  jobs,
  jobLineItems,
  jobNotes,
  jobPhotos,
  jobSignatures,
  customers,
  properties,
  users,
} from "@fieldservice/shared/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  inArray,
  gte,
  lte,
  between,
} from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError, AppError } from "@/lib/api/errors";
import { getNextSequenceNumber } from "./sequences";

// ---------- Types ----------

type JobStatus = "new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled";
type JobPriority = "low" | "normal" | "high" | "emergency";
type LineItemType = "service" | "material" | "labor" | "discount" | "other";

export interface ListJobsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: JobStatus | JobStatus[];
  priority?: JobPriority;
  assignedTo?: string;
  customerId?: string;
  from?: string;
  to?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export interface CreateJobInput {
  customerId: string;
  propertyId: string;
  jobType: string;
  serviceType?: string;
  summary: string;
  description?: string;
  priority?: JobPriority;
  assignedTo?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  internalNotes?: string;
  customerNotes?: string;
  tags?: string[];
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    type?: LineItemType;
  }[];
}

export interface UpdateJobInput {
  jobType?: string;
  serviceType?: string | null;
  summary?: string;
  description?: string | null;
  priority?: JobPriority;
  assignedTo?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  internalNotes?: string | null;
  customerNotes?: string | null;
  tags?: string[];
}

// ---------- Valid status transitions ----------

const validTransitions: Record<JobStatus, JobStatus[]> = {
  new: ["scheduled", "canceled"],
  scheduled: ["dispatched", "new", "canceled"],
  dispatched: ["in_progress", "scheduled", "canceled"],
  in_progress: ["completed", "dispatched"],
  completed: [],
  canceled: ["new"],
};

// ---------- List ----------

export async function listJobs(ctx: UserContext, params: ListJobsParams = {}) {
  assertPermission(ctx, "jobs", "read");

  const {
    page = 1,
    pageSize: rawPageSize = 25,
    search,
    status,
    priority,
    assignedTo,
    customerId,
    from,
    to,
    sort = "createdAt",
    order = "desc",
  } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions: ReturnType<typeof eq>[] = [eq(jobs.tenantId, ctx.tenantId)];

  // Technicians only see their own jobs
  if (ctx.role === "technician") {
    conditions.push(eq(jobs.assignedTo, ctx.userId));
  } else if (assignedTo) {
    conditions.push(eq(jobs.assignedTo, assignedTo));
  }

  if (status) {
    if (Array.isArray(status)) {
      conditions.push(inArray(jobs.status, status));
    } else {
      conditions.push(eq(jobs.status, status));
    }
  }

  if (priority) {
    conditions.push(eq(jobs.priority, priority));
  }

  if (customerId) {
    conditions.push(eq(jobs.customerId, customerId));
  }

  if (from) {
    conditions.push(gte(jobs.scheduledStart, new Date(from)));
  }

  if (to) {
    conditions.push(lte(jobs.scheduledStart, new Date(to)));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(jobs.summary, term),
        ilike(jobs.jobNumber, term),
        ilike(jobs.description, term)
      )!
    );
  }

  const orderFn = order === "asc" ? asc : desc;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sortMap: Record<string, any> = {
    createdAt: jobs.createdAt,
    scheduledStart: jobs.scheduledStart,
    status: jobs.status,
    priority: jobs.priority,
    jobNumber: jobs.jobNumber,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const sortColumn = sortMap[sort] ?? jobs.createdAt;

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: jobs.id,
        jobNumber: jobs.jobNumber,
        summary: jobs.summary,
        status: jobs.status,
        priority: jobs.priority,
        jobType: jobs.jobType,
        serviceType: jobs.serviceType,
        scheduledStart: jobs.scheduledStart,
        scheduledEnd: jobs.scheduledEnd,
        totalAmount: jobs.totalAmount,
        createdAt: jobs.createdAt,
        customerId: jobs.customerId,
        customerFirstName: customers.firstName,
        customerLastName: customers.lastName,
        propertyCity: properties.city,
        propertyState: properties.state,
        assignedTo: jobs.assignedTo,
        assignedFirstName: users.firstName,
        assignedLastName: users.lastName,
        assignedColor: users.color,
      })
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(properties, eq(jobs.propertyId, properties.id))
      .leftJoin(users, eq(jobs.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: { page, pageSize, total: Number(countResult[0].count) },
  };
}

// ---------- Get ----------

export async function getJob(ctx: UserContext, jobId: string) {
  assertPermission(ctx, "jobs", "read");

  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .limit(1);

  if (!job) throw new NotFoundError("Job");

  if (ctx.role === "technician" && job.assignedTo !== ctx.userId) {
    throw new NotFoundError("Job");
  }

  return job;
}

export async function getJobWithRelations(ctx: UserContext, jobId: string) {
  const job = await getJob(ctx, jobId);

  const [
    customer,
    property,
    assignedUser,
    lineItems,
    notes,
    photos,
    signatures,
  ] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1).then((r) => r[0]),
    db.select().from(properties).where(eq(properties.id, job.propertyId)).limit(1).then((r) => r[0]),
    job.assignedTo
      ? db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, color: users.color, phone: users.phone })
          .from(users).where(eq(users.id, job.assignedTo)).limit(1).then((r) => r[0])
      : null,
    db.select().from(jobLineItems)
      .where(and(eq(jobLineItems.jobId, jobId), eq(jobLineItems.tenantId, ctx.tenantId)))
      .orderBy(asc(jobLineItems.sortOrder)),
    db.select({
        id: jobNotes.id,
        content: jobNotes.content,
        isInternal: jobNotes.isInternal,
        createdAt: jobNotes.createdAt,
        userId: jobNotes.userId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(jobNotes)
      .leftJoin(users, eq(jobNotes.userId, users.id))
      .where(and(eq(jobNotes.jobId, jobId), eq(jobNotes.tenantId, ctx.tenantId)))
      .orderBy(desc(jobNotes.createdAt)),
    db.select().from(jobPhotos)
      .where(and(eq(jobPhotos.jobId, jobId), eq(jobPhotos.tenantId, ctx.tenantId)))
      .orderBy(desc(jobPhotos.createdAt)),
    db.select().from(jobSignatures)
      .where(and(eq(jobSignatures.jobId, jobId), eq(jobSignatures.tenantId, ctx.tenantId)))
      .orderBy(desc(jobSignatures.createdAt)),
  ]);

  return {
    ...job,
    customer,
    property,
    assignedUser,
    lineItems,
    notes,
    photos,
    signatures,
  };
}

// ---------- Create ----------

export async function createJob(ctx: UserContext, input: CreateJobInput) {
  assertPermission(ctx, "jobs", "create");

  const jobNumber = await getNextSequenceNumber(ctx.tenantId, "job");

  const result = await db.transaction(async (tx) => {
    // Validate customer and property belong to tenant
    const [customer] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenantId)))
      .limit(1);
    if (!customer) throw new NotFoundError("Customer");

    const [property] = await tx
      .select({ id: properties.id })
      .from(properties)
      .where(and(eq(properties.id, input.propertyId), eq(properties.tenantId, ctx.tenantId)))
      .limit(1);
    if (!property) throw new NotFoundError("Property");

    // Validate tech belongs to tenant if assigned
    if (input.assignedTo) {
      const [tech] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, input.assignedTo), eq(users.tenantId, ctx.tenantId)))
        .limit(1);
      if (!tech) throw new NotFoundError("Technician");
    }

    const initialStatus: JobStatus =
      input.scheduledStart && input.assignedTo
        ? "scheduled"
        : "new";

    const [job] = await tx
      .insert(jobs)
      .values({
        tenantId: ctx.tenantId,
        jobNumber,
        customerId: input.customerId,
        propertyId: input.propertyId,
        jobType: input.jobType,
        serviceType: input.serviceType || null,
        summary: input.summary,
        description: input.description || null,
        priority: input.priority || "normal",
        assignedTo: input.assignedTo || null,
        status: initialStatus,
        scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null,
        scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
        internalNotes: input.internalNotes || null,
        customerNotes: input.customerNotes || null,
        tags: input.tags || null,
        createdBy: ctx.userId,
      })
      .returning();

    // Insert line items
    if (input.lineItems && input.lineItems.length > 0) {
      const items = input.lineItems.map((item, idx) => ({
        tenantId: ctx.tenantId,
        jobId: job.id,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        total: String(item.quantity * item.unitPrice),
        type: (item.type || "service") as LineItemType,
        sortOrder: idx,
      }));

      await tx.insert(jobLineItems).values(items);

      // Update job total
      const total = input.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      await tx
        .update(jobs)
        .set({ totalAmount: String(total) })
        .where(eq(jobs.id, job.id));
    }

    return job;
  });

  await logActivity(ctx, "job", result.id, "created");

  return result;
}

// ---------- Update ----------

export async function updateJob(ctx: UserContext, jobId: string, input: UpdateJobInput) {
  assertPermission(ctx, "jobs", "update");

  await getJob(ctx, jobId);

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (input.jobType !== undefined) updateData.jobType = input.jobType;
  if (input.serviceType !== undefined) updateData.serviceType = input.serviceType;
  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;
  if (input.customerNotes !== undefined) updateData.customerNotes = input.customerNotes;
  if (input.tags !== undefined) updateData.tags = input.tags;

  if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
  if (input.scheduledStart !== undefined)
    updateData.scheduledStart = input.scheduledStart ? new Date(input.scheduledStart) : null;
  if (input.scheduledEnd !== undefined)
    updateData.scheduledEnd = input.scheduledEnd ? new Date(input.scheduledEnd) : null;

  const [updated] = await db
    .update(jobs)
    .set(updateData)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "job", jobId, "updated");

  return updated;
}

// ---------- Status transitions ----------

export async function changeJobStatus(
  ctx: UserContext,
  jobId: string,
  newStatus: JobStatus
) {
  assertPermission(ctx, "jobs", "update");

  const job = await getJob(ctx, jobId);
  const currentStatus = job.status as JobStatus;

  const allowed = validTransitions[currentStatus];
  if (!allowed || !allowed.includes(newStatus)) {
    throw new AppError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition from "${currentStatus}" to "${newStatus}"`,
      422
    );
  }

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === "dispatched") updateData.dispatchedAt = new Date();
  if (newStatus === "in_progress") updateData.actualStart = new Date();
  if (newStatus === "completed") {
    updateData.actualEnd = new Date();
    updateData.completedAt = new Date();
  }

  const [updated] = await db
    .update(jobs)
    .set(updateData)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "job", jobId, "status_changed", {
    from: currentStatus,
    to: newStatus,
  });

  return updated;
}

// ---------- Assign ----------

export async function assignJob(
  ctx: UserContext,
  jobId: string,
  technicianId: string | null
) {
  assertPermission(ctx, "schedule", "update");

  const job = await getJob(ctx, jobId);

  if (technicianId) {
    const [tech] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, technicianId),
          eq(users.tenantId, ctx.tenantId),
          eq(users.canBeDispatched, true)
        )
      )
      .limit(1);
    if (!tech) throw new NotFoundError("Technician");
  }

  const [updated] = await db
    .update(jobs)
    .set({ assignedTo: technicianId, updatedAt: new Date() })
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .returning();

  await logActivity(ctx, "job", jobId, "assigned", {
    technicianId,
  });

  return updated;
}

// ---------- Line Items ----------

export async function addJobLineItem(
  ctx: UserContext,
  jobId: string,
  input: { description: string; quantity: number; unitPrice: number; type?: LineItemType }
) {
  assertPermission(ctx, "jobs", "update");
  await getJob(ctx, jobId);

  const total = input.quantity * input.unitPrice;

  // Get max sort order
  const maxSort = await db
    .select({ max: sql<number>`coalesce(max(${jobLineItems.sortOrder}), -1)` })
    .from(jobLineItems)
    .where(and(eq(jobLineItems.jobId, jobId), eq(jobLineItems.tenantId, ctx.tenantId)));

  const [item] = await db
    .insert(jobLineItems)
    .values({
      tenantId: ctx.tenantId,
      jobId,
      description: input.description,
      quantity: String(input.quantity),
      unitPrice: String(input.unitPrice),
      total: String(total),
      type: input.type || "service",
      sortOrder: Number(maxSort[0].max) + 1,
    })
    .returning();

  await recalculateJobTotal(ctx.tenantId, jobId);

  return item;
}

export async function updateJobLineItem(
  ctx: UserContext,
  jobId: string,
  itemId: string,
  input: { description?: string; quantity?: number; unitPrice?: number; type?: LineItemType }
) {
  assertPermission(ctx, "jobs", "update");
  await getJob(ctx, jobId);

  const [existing] = await db
    .select()
    .from(jobLineItems)
    .where(
      and(
        eq(jobLineItems.id, itemId),
        eq(jobLineItems.jobId, jobId),
        eq(jobLineItems.tenantId, ctx.tenantId)
      )
    )
    .limit(1);

  if (!existing) throw new NotFoundError("Line item");

  const qty = input.quantity ?? Number(existing.quantity);
  const price = input.unitPrice ?? Number(existing.unitPrice);

  const [updated] = await db
    .update(jobLineItems)
    .set({
      description: input.description ?? existing.description,
      quantity: String(qty),
      unitPrice: String(price),
      total: String(qty * price),
      type: input.type ?? existing.type,
      updatedAt: new Date(),
    })
    .where(eq(jobLineItems.id, itemId))
    .returning();

  await recalculateJobTotal(ctx.tenantId, jobId);

  return updated;
}

export async function deleteJobLineItem(ctx: UserContext, jobId: string, itemId: string) {
  assertPermission(ctx, "jobs", "update");
  await getJob(ctx, jobId);

  const result = await db
    .delete(jobLineItems)
    .where(
      and(
        eq(jobLineItems.id, itemId),
        eq(jobLineItems.jobId, jobId),
        eq(jobLineItems.tenantId, ctx.tenantId)
      )
    );

  await recalculateJobTotal(ctx.tenantId, jobId);
}

async function recalculateJobTotal(tenantId: string, jobId: string) {
  const result = await db
    .select({ sum: sql<string>`coalesce(sum(${jobLineItems.total}::numeric), 0)` })
    .from(jobLineItems)
    .where(and(eq(jobLineItems.jobId, jobId), eq(jobLineItems.tenantId, tenantId)));

  await db
    .update(jobs)
    .set({ totalAmount: result[0].sum, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

// ---------- Notes ----------

export async function addJobNote(
  ctx: UserContext,
  jobId: string,
  content: string,
  isInternal: boolean = true
) {
  assertPermission(ctx, "jobs", "update");
  await getJob(ctx, jobId);

  const [note] = await db
    .insert(jobNotes)
    .values({
      tenantId: ctx.tenantId,
      jobId,
      userId: ctx.userId,
      content,
      isInternal,
    })
    .returning();

  return note;
}

// ---------- Schedule helpers ----------

export async function getSchedule(
  ctx: UserContext,
  from: string,
  to: string,
  technicianId?: string
) {
  assertPermission(ctx, "schedule", "read");

  const conditions: ReturnType<typeof eq>[] = [
    eq(jobs.tenantId, ctx.tenantId),
    gte(jobs.scheduledStart, new Date(from)),
    lte(jobs.scheduledStart, new Date(to)),
  ];

  if (ctx.role === "technician") {
    conditions.push(eq(jobs.assignedTo, ctx.userId));
  } else if (technicianId) {
    conditions.push(eq(jobs.assignedTo, technicianId));
  }

  // Exclude canceled
  conditions.push(
    sql`${jobs.status} != 'canceled'` as ReturnType<typeof eq>
  );

  const data = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      summary: jobs.summary,
      status: jobs.status,
      priority: jobs.priority,
      jobType: jobs.jobType,
      scheduledStart: jobs.scheduledStart,
      scheduledEnd: jobs.scheduledEnd,
      assignedTo: jobs.assignedTo,
      assignedFirstName: users.firstName,
      assignedLastName: users.lastName,
      assignedColor: users.color,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      propertyAddress: properties.addressLine1,
      propertyCity: properties.city,
    })
    .from(jobs)
    .leftJoin(users, eq(jobs.assignedTo, users.id))
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .where(and(...conditions))
    .orderBy(asc(jobs.scheduledStart));

  return data;
}

// ---------- Dispatch helpers ----------

export async function getDispatchableJobs(ctx: UserContext) {
  assertPermission(ctx, "schedule", "read");

  // Jobs that are new (unscheduled) or scheduled but unassigned
  const data = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
      summary: jobs.summary,
      status: jobs.status,
      priority: jobs.priority,
      jobType: jobs.jobType,
      scheduledStart: jobs.scheduledStart,
      scheduledEnd: jobs.scheduledEnd,
      assignedTo: jobs.assignedTo,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      propertyAddress: properties.addressLine1,
      propertyCity: properties.city,
      propertyState: properties.state,
    })
    .from(jobs)
    .leftJoin(customers, eq(jobs.customerId, customers.id))
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .where(
      and(
        eq(jobs.tenantId, ctx.tenantId),
        inArray(jobs.status, ["new", "scheduled"]),
      )
    )
    .orderBy(
      desc(sql`case ${jobs.priority} when 'emergency' then 0 when 'high' then 1 when 'normal' then 2 when 'low' then 3 end`),
      asc(jobs.createdAt)
    );

  return data;
}

export async function getTechnicians(ctx: UserContext) {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      color: users.color,
      phone: users.phone,
    })
    .from(users)
    .where(
      and(
        eq(users.tenantId, ctx.tenantId),
        eq(users.canBeDispatched, true),
        eq(users.isActive, true)
      )
    )
    .orderBy(asc(users.firstName));
}
