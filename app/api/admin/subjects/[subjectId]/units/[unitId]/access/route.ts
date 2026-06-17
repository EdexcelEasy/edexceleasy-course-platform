import { NextRequest, NextResponse } from "next/server";
import { addUnitAccess, removeUnitAccess } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
    unitId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { subjectId, unitId } = await context.params;
  const body = (await request.json()) as { email?: string };
  const subjects = await addUnitAccess(subjectId, unitId, body.email ?? "");

  return NextResponse.json({ subjects });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { subjectId, unitId } = await context.params;
  const body = (await request.json()) as { email?: string };
  const subjects = await removeUnitAccess(subjectId, unitId, body.email ?? "");

  return NextResponse.json({ subjects });
}
