import { NextResponse } from "next/server";
import { removeTopicSubtopic, updateTopicSubtopic } from "@/lib/server/admin-store";

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

export async function DELETE(request: Request, context: RouteContext) {
  const { subjectId, unitId, topicId, subtopicId } = await context.params;
  const subjects = await removeTopicSubtopic(subjectId, unitId, topicId, subtopicId);

  return NextResponse.json({ subjects });
}
