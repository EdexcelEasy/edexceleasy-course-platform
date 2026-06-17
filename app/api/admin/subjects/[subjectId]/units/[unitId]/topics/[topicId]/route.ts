import { NextResponse } from "next/server";
import { updateUnitTopic } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
    unitId: string;
    topicId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { subjectId, unitId, topicId } = await context.params;
  const body = (await request.json()) as { title?: string };
  const subjects = await updateUnitTopic(subjectId, unitId, topicId, body.title ?? "");

  return NextResponse.json({ subjects });
}
