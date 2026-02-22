import { NextRequest, NextResponse } from "next/server";
import { createPortalServerClient } from "@/lib/portal-supabase";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createPortalServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Portal logout error:", error);
    return NextResponse.json(
      { error: { message: "Failed to sign out." } },
      { status: 500 }
    );
  }
}
