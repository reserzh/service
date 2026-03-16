import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyEquipment, users } from "@fieldservice/shared/db/schema";
import { eq, and, lte, or, isNull } from "drizzle-orm";
import { verifyCronSecret } from "../lib";
import { createNotification } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find equipment due for service within 7 days, not reminded in last 7 days
    const dueEquipment = await db
      .select({
        id: companyEquipment.id,
        tenantId: companyEquipment.tenantId,
        name: companyEquipment.name,
        type: companyEquipment.type,
        nextServiceDue: companyEquipment.nextServiceDue,
        assignedTo: companyEquipment.assignedTo,
      })
      .from(companyEquipment)
      .where(
        and(
          lte(companyEquipment.nextServiceDue, sevenDaysOut.toISOString().split("T")[0]),
          or(
            isNull(companyEquipment.lastReminderSentAt),
            lte(companyEquipment.lastReminderSentAt, sevenDaysAgo)
          )
        )
      );

    let processed = 0;
    let failed = 0;

    for (const item of dueEquipment) {
      try {
        // Find admin users for this tenant to notify
        const admins = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.tenantId, item.tenantId),
              eq(users.role, "admin"),
              eq(users.isActive, true)
            )
          );

        const notifyUserIds = new Set<string>();
        // Notify admins
        for (const admin of admins) {
          notifyUserIds.add(admin.id);
        }
        // Notify assigned user if any
        if (item.assignedTo) {
          notifyUserIds.add(item.assignedTo);
        }

        const title = `Maintenance due: ${item.name}`;
        const message = `${item.name} (${item.type}) has service due on ${item.nextServiceDue}. Please schedule maintenance.`;

        for (const userId of notifyUserIds) {
          await createNotification({
            tenantId: item.tenantId,
            userId,
            type: "equipment_maintenance",
            title,
            message,
            entityType: "company_equipment",
            entityId: item.id,
          });
        }

        // Update lastReminderSentAt
        await db
          .update(companyEquipment)
          .set({ lastReminderSentAt: new Date() })
          .where(eq(companyEquipment.id, item.id));

        processed++;
      } catch (error) {
        console.error(`[Cron] Equipment maintenance reminder failed for ${item.name}:`, error);
        failed++;
      }
    }

    return NextResponse.json({ processed, failed, total: dueEquipment.length });
  } catch (error) {
    console.error("[Cron] Equipment maintenance error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
