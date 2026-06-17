import { NextResponse } from "next/server";
import { updateTopicSubtopic } from "@/lib/server/admin-store";

type RouteContext = {
  params: Promise<{
    subjectId: string;
    unitId: string;
    topicId: string;
    subtopicId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { subjectId, unitId, topicId, subtopicId } = await context.params;
  const body = (await request.json()) as { title?: string; driveUrl?: string };
  const subjects = await updateTopicSubtopic(
    subjectId,
    unitId,
    topicId,
    subtopicId,
    body.title ?? "",
    body.driveUrl ?? ""
  );

  return NextResponse.json({ subjects });
}
