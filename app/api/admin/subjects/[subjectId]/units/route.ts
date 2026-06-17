import { NextResponse } from "next/server";
import { addSubjectUnit } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { subjectId } = await context.params;
  const body = (await request.json()) as { title?: string };
  const subjects = await addSubjectUnit(subjectId, body.title ?? "");

  return NextResponse.json({ subjects });
}
