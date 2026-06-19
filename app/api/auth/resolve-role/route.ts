import { NextResponse } from "next/server";
import { resolveUserRole } from "@/lib/server/admin-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const user = await resolveUserRole(body.email ?? "", body.password ?? "");

    return NextResponse.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to login.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
