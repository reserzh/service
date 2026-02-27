import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { addJobAssignment } from "@/lib/services/jobs";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { jobAssignments, users } from "@fieldservice/shared/db/schema";
import { and, eq } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const assignments = await db
      .select({
        id: jobAssignments.id,
        jobId: jobAssignments.jobId,
        userId: jobAssignments.userId,
        role: jobAssignments.role,
        assignedAt: jobAssignments.assignedAt,
        assignedBy: jobAssignments.assignedBy,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userColor: users.color,
      })
      .from(jobAssignments)
      .leftJoin(users, eq(jobAssignments.userId, users.id))
      .where(and(eq(jobAssignments.jobId, id), eq(jobAssignments.tenantId, ctx.tenantId)));

    const data = assignments.map((a) => ({
      id: a.id,
      jobId: a.jobId,
      userId: a.userId,
      role: a.role,
      assignedAt: a.assignedAt,
      assignedBy: a.assignedBy,
      user: { id: a.userId, firstName: a.userFirstName!, lastName: a.userLastName!, color: a.userColor! },
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

const addSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["lead", "member"]).optional(),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const { userId, role } = addSchema.parse(body);

    const assignment = await addJobAssignment(ctx, id, userId, role);

    return NextResponse.json({ data: assignment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
