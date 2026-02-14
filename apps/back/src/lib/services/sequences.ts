import { db } from "@/lib/db";
import { tenantSequences } from "@fieldservice/shared/db/schema";
import { eq, and, sql } from "drizzle-orm";

type SequenceType = "job" | "estimate" | "invoice";

const defaultPrefixes: Record<SequenceType, string> = {
  job: "JOB",
  estimate: "EST",
  invoice: "INV",
};

/**
 * Generate the next sequential number for a tenant.
 * Uses SELECT FOR UPDATE to prevent race conditions.
 */
export async function getNextSequenceNumber(
  tenantId: string,
  sequenceType: SequenceType
): Promise<string> {
  const prefix = defaultPrefixes[sequenceType];

  // Upsert the sequence and atomically increment
  const result = await db
    .insert(tenantSequences)
    .values({
      tenantId,
      sequenceType,
      prefix,
      currentValue: 1,
    })
    .onConflictDoUpdate({
      target: [tenantSequences.tenantId, tenantSequences.sequenceType],
      set: {
        currentValue: sql`${tenantSequences.currentValue} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ currentValue: tenantSequences.currentValue });

  const num = result[0].currentValue;
  return `${prefix}-${String(num).padStart(4, "0")}`;
}

/**
 * Initialize default sequences for a new tenant.
 */
export async function initializeSequences(tenantId: string): Promise<void> {
  const types: SequenceType[] = ["job", "estimate", "invoice"];

  await db.insert(tenantSequences).values(
    types.map((type) => ({
      tenantId,
      sequenceType: type,
      prefix: defaultPrefixes[type],
      currentValue: 0,
    }))
  );
}
