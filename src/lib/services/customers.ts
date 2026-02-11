import { db } from "@/lib/db";
import { customers, properties, equipment } from "@/lib/db/schema";
import { eq, and, or, ilike, desc, asc, sql, isNull } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { NotFoundError } from "@/lib/api/errors";

export interface ListCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: "residential" | "commercial";
  sort?: string;
  order?: "asc" | "desc";
}

export async function listCustomers(
  ctx: UserContext,
  params: ListCustomersParams = {}
) {
  assertPermission(ctx, "customers", "read");

  const { page = 1, pageSize: rawPageSize = 25, search, type, sort = "createdAt", order = "desc" } = params;
  const pageSize = Math.min(Math.max(rawPageSize, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(customers.tenantId, ctx.tenantId),
    isNull(customers.deletedAt),
  ];

  if (type) {
    conditions.push(eq(customers.type, type));
  }

  if (search) {
    const term = `%${search}%`;
    conditions.push(
      or(
        ilike(customers.firstName, term),
        ilike(customers.lastName, term),
        ilike(customers.email, term),
        ilike(customers.phone, term),
        ilike(customers.companyName, term)
      )!
    );
  }

  const orderFn = order === "asc" ? asc : desc;
  const sortColumn =
    sort === "name"
      ? customers.lastName
      : sort === "email"
        ? customers.email
        : sort === "phone"
          ? customers.phone
          : customers.createdAt;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(and(...conditions)),
  ]);

  return {
    data,
    meta: {
      page,
      pageSize,
      total: Number(countResult[0].count),
    },
  };
}

export async function getCustomer(ctx: UserContext, customerId: string) {
  assertPermission(ctx, "customers", "read");

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.tenantId, ctx.tenantId),
        isNull(customers.deletedAt)
      )
    )
    .limit(1);

  if (!customer) {
    throw new NotFoundError("Customer");
  }

  return customer;
}

export async function getCustomerWithRelations(ctx: UserContext, customerId: string) {
  const customer = await getCustomer(ctx, customerId);

  const [customerProperties, customerEquipment] = await Promise.all([
    db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.customerId, customerId),
          eq(properties.tenantId, ctx.tenantId)
        )
      )
      .orderBy(desc(properties.isPrimary), asc(properties.createdAt)),
    db
      .select()
      .from(equipment)
      .where(
        and(
          eq(equipment.customerId, customerId),
          eq(equipment.tenantId, ctx.tenantId)
        )
      )
      .orderBy(desc(equipment.createdAt)),
  ]);

  return {
    ...customer,
    properties: customerProperties,
    equipment: customerEquipment,
  };
}

export interface CreateCustomerInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  altPhone?: string;
  companyName?: string;
  type?: "residential" | "commercial";
  source?: string;
  notes?: string;
  property?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zip: string;
  };
}

export async function createCustomer(ctx: UserContext, input: CreateCustomerInput) {
  assertPermission(ctx, "customers", "create");

  const result = await db.transaction(async (tx) => {
    const [customer] = await tx
      .insert(customers)
      .values({
        tenantId: ctx.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || null,
        phone: input.phone,
        altPhone: input.altPhone || null,
        companyName: input.companyName || null,
        type: input.type || "residential",
        source: input.source || null,
        notes: input.notes || null,
        createdBy: ctx.userId,
      })
      .returning();

    if (input.property) {
      await tx.insert(properties).values({
        tenantId: ctx.tenantId,
        customerId: customer.id,
        addressLine1: input.property.addressLine1,
        addressLine2: input.property.addressLine2 || null,
        city: input.property.city,
        state: input.property.state,
        zip: input.property.zip,
        isPrimary: true,
      });
    }

    return customer;
  });

  await logActivity(ctx, "customer", result.id, "created");

  return result;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string;
  altPhone?: string | null;
  companyName?: string | null;
  type?: "residential" | "commercial";
  source?: string | null;
  notes?: string | null;
  doNotContact?: boolean;
}

export async function updateCustomer(
  ctx: UserContext,
  customerId: string,
  input: UpdateCustomerInput
) {
  assertPermission(ctx, "customers", "update");

  await getCustomer(ctx, customerId);

  const [updated] = await db
    .update(customers)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(eq(customers.id, customerId), eq(customers.tenantId, ctx.tenantId))
    )
    .returning();

  await logActivity(ctx, "customer", customerId, "updated");

  return updated;
}

export async function deleteCustomer(ctx: UserContext, customerId: string) {
  assertPermission(ctx, "customers", "delete");

  await getCustomer(ctx, customerId);

  await db
    .update(customers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(customers.id, customerId), eq(customers.tenantId, ctx.tenantId))
    );

  await logActivity(ctx, "customer", customerId, "deleted");
}
