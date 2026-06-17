import { NextRequest, NextResponse } from "next/server";
import { addSubjectAccess, removeSubjectAccess } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { subjectId } = await context.params;
  const body = (await request.json()) as { email?: string };
  const subjects = await addSubjectAccess(subjectId, body.email ?? "");

  return NextResponse.json({ subjects });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { subjectId } = await context.params;
  const body = (await request.json()) as { email?: string };
  const subjects = await removeSubjectAccess(subjectId, body.email ?? "");

  return NextResponse.json({ subjects });
}
