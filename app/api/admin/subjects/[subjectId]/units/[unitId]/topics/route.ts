import { NextResponse } from "next/server";
import { addUnitTopic } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
    unitId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { subjectId, unitId } = await context.params;
  const body = (await request.json()) as { topic?: string };
  const subjects = await addUnitTopic(subjectId, unitId, body.topic ?? "");

  return NextResponse.json({ subjects });
}
